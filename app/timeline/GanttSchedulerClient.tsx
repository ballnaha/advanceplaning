'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Container,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { ArrowDown2, ArrowLeft2, ArrowRight2, ArrowUp2, Calendar, CloseCircle } from 'iconsax-react';
import { addDays, parseIsoDate, startOfMondayWeek } from './date-utils';
import PlanningActionBar from '../components/PlanningActionBar';
import {
  cleanZpg2d,
  sortJobsWithZpg3dTransition,
} from '@/lib/zpg1d-helpers';
import type { PlanningJob } from '@/lib/planning';
import JobDetailDialog from '../components/JobDetailDialog';
import NotificationSnackbar from '../components/NotificationSnackbar';

type Props = {
  initialDate: string;
  jobs: PlanningJob[];
  workCenters: string[];
  generatedAt: string;
};

const DAY_COUNT = 7;
const MACHINE_CAPACITY_LIMIT = 24.0;
const numberFormatter = new Intl.NumberFormat('th-TH');
const dayFormatter = new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: '2-digit', month: 'short' });
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : '-';
}

function getStatusStyle(status: string) {
  switch (status.toUpperCase()) {
    case 'DONE':
      return { color: '#166534', bg: '#dcfce7', border: '#22c55e' };
    case 'START':
      return { color: '#1d4ed8', bg: '#dbeafe', border: '#3b82f6' };
    case 'WAIT':
      return { color: '#854d0e', bg: '#fef9c3', border: '#eab308' };
    case 'NOT START':
      return { color: '#475569', bg: '#f1f5f9', border: '#94a3b8' };
    default:
      return { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe' };
  }
}

type LacquerColor = { bg: string; chipBg: string; text: string; border: string };

const fallbackLacquerColor: LacquerColor = {
  bg: 'rgba(100, 116, 139, 0.06)',
  chipBg: 'rgba(100, 116, 139, 0.1)',
  text: '#475569',
  border: 'rgba(100, 116, 139, 0.24)',
};

const lacquerBaseColorCache = new Map<number, LacquerColor>();

function createLacquerColor(index: number) {
  let cached = lacquerBaseColorCache.get(index);
  if (!cached) {
    const hue = Math.round((index * 137.508) % 360);
    const saturation = [62, 70, 56, 66][index % 4];
    const lightness = [42, 36, 48][Math.floor(index / 4) % 3];

    cached = {
      bg: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.07)`,
      chipBg: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.16)`,
      text: `hsl(${hue}, ${Math.min(saturation + 8, 82)}%, ${Math.max(lightness - 14, 24)}%)`,
      border: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`,
    };
    lacquerBaseColorCache.set(index, cached);
  }
  return cached;
}

const goldTheme = {
  bg: '#fffbeb',
  chipBg: '#fef3c7',
  text: '#b45309',
  border: '#f59e0b',
};

const whiteTheme = {
  bg: '#f8fafc',
  chipBg: '#ffffff',
  text: '#0f172a',
  border: '#cbd5e1',
};

const metallicTheme = {
  bg: '#f1f5f9',
  chipBg: '#e2e8f0',
  text: '#334155',
  border: '#94a3b8',
};

function getLacquerColorByGroup3(zpg3d: string | null, indexFallback: number) {
  const group3 = zpg3d?.trim() || '';
  if (group3.includes('ทอง')) return goldTheme;
  if (group3.includes('ขาว') || group3.includes('White') || group3.includes('Plain')) return whiteTheme;
  if (group3.includes('บรอนด์') || group3.includes('บรอนซ์') || group3.includes('Bronze') || group3.includes('เงิน') || group3.includes('Silver')) {
    return metallicTheme;
  }
  return createLacquerColor(indexFallback);
}

function getLacquerKey(job: PlanningJob) {
  return job.zpg3d?.trim() || '';
}

function calculateChangeovers(jobs: PlanningJob[]) {
  const byWc: Record<string, PlanningJob[]> = {};
  jobs.forEach((j) => {
    byWc[j.arbpl] ??= [];
    byWc[j.arbpl].push(j);
  });

  let totalCount = 0;
  Object.keys(byWc).forEach((wc) => {
    const list = byWc[wc].filter(Boolean);
    list.sort((a, b) => (a.stdate || '').localeCompare(b.stdate || '') || a.seqno - b.seqno || a.id - b.id);
    for (let i = 0; i < list.length - 1; i++) {
      if (getLacquerKey(list[i]) !== getLacquerKey(list[i + 1])) {
        totalCount++;
      }
    }
  });
  return totalCount;
}

function countOverloadDays(jobs: PlanningJob[]) {
  const map = new Map<string, number>();
  jobs.forEach((job) => {
    if (job.stdate && job.findate && job.optime > 0) {
      const durationDays = daysBetween(job.stdate, job.findate) + 1;
      const hoursPerDay = job.optime / durationDays;

      for (let i = 0; i < durationDays; i++) {
        const currentDayStr = addDays(job.stdate, i);
        const key = `${job.arbpl}|${currentDayStr}`;
        map.set(key, (map.get(key) ?? 0) + hoursPerDay);
      }
    }
  });

  let count = 0;
  map.forEach((hours) => {
    if (hours > MACHINE_CAPACITY_LIMIT) {
      count++;
    }
  });
  return count;
}

function daysBetween(startDate: string, finishDate: string) {
  const start = parseIsoDate(startDate).getTime();
  const finish = parseIsoDate(finishDate).getTime();
  return Math.max(0, Math.round((finish - start) / 86400000));
}

function resequenceWorkCentersBySchedule(jobs: PlanningJob[], workCenters: Set<string>) {
  const sequenceById = new Map<number, number>();

  for (const workCenter of workCenters) {
    const scheduledJobs = jobs
      .filter((job) => job.arbpl === workCenter)
      .sort((a, b) =>
        (a.stdate || '').localeCompare(b.stdate || '') ||
        a.seqno - b.seqno ||
        a.id - b.id
      );
    scheduledJobs
      .forEach((job, index) => sequenceById.set(job.id, index + 1));
  }

  return jobs.map((job) => (
    sequenceById.has(job.id)
      ? { ...job, seqno: sequenceById.get(job.id)! }
      : job
  ));
}

function calculateGanttPosition(jobStDate: string, jobFinDate: string, wStart: string, wEnd: string) {
  const start = parseIsoDate(jobStDate);
  const end = parseIsoDate(jobFinDate);
  const winStart = parseIsoDate(wStart);
  const winEnd = parseIsoDate(wEnd);

  if (end < winStart || start > winEnd) {
    return null;
  }

  const visibleStart = start < winStart ? winStart : start;
  const visibleEnd = end > winEnd ? winEnd : end;

  const daysFromStart = Math.round((visibleStart.getTime() - winStart.getTime()) / 86400000);
  const durationDays = Math.round((visibleEnd.getTime() - visibleStart.getTime()) / 86400000) + 1;

  return {
    daysFromStart,
    durationDays,
    isClippedLeft: start < winStart,
    isClippedRight: end > winEnd,
  };
}

const GanttBarItem = React.memo(function GanttBarItem({
  job,
  daysFromStart,
  durationDays,
  isClippedLeft,
  isClippedRight,
  trackIndex,
  onOpenDetail,
  onDragStartAny,
  onDragEndAny,
  onDragOverJob,
  onDragLeaveJob,
  onDropOnJob,
  isDragOver,
  dropPosition,
  lacquerColorMap,
  isHighlighted = false,
}: {
  job: PlanningJob;
  daysFromStart: number;
  durationDays: number;
  isClippedLeft: boolean;
  isClippedRight: boolean;
  trackIndex: number;
  onOpenDetail: (job: PlanningJob) => void;
  onDragStartAny: () => void;
  onDragEndAny: () => void;
  onDragOverJob: (event: React.DragEvent<HTMLElement>, targetJob: PlanningJob, position: 'before' | 'after') => void;
  onDragLeaveJob: (event: React.DragEvent<HTMLElement>) => void;
  onDropOnJob: (event: React.DragEvent<HTMLElement>, targetJob: PlanningJob, position: 'before' | 'after') => void;
  isDragOver: boolean;
  dropPosition: 'before' | 'after' | null;
  lacquerColorMap: Map<string, LacquerColor>;
  isHighlighted?: 'undo' | 'drop' | false;
}) {
  const statusStyle = getStatusStyle(job.text1 || 'NOT START');
  const lacquerKey = getLacquerKey(job);
  const lacquerColor = lacquerColorMap.get(lacquerKey) || fallbackLacquerColor;
  const fullDuration = daysBetween(job.stdate || '', job.findate || '') + 1;

  const handleDragStart = (event: React.DragEvent<HTMLElement>) => {
    event.dataTransfer.setData('text/plain', String(job.id));
    event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      document.querySelector('.gantt-board-container')?.classList.add('is-dragging-active');
    }, 0);
    onDragStartAny();
  };

  const handleDragEnd = () => {
    document.querySelector('.gantt-board-container')?.classList.remove('is-dragging-active');
    onDragEndAny();
  };

  const leftPercent = (daysFromStart / DAY_COUNT) * 100;
  const widthPercent = (durationDays / DAY_COUNT) * 100;

  return (
    <Box
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
        onDragOverJob(event, job, position);
      }}
      onDragLeave={onDragLeaveJob}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
        onDropOnJob(event, job, position);
      }}
      onClick={() => onOpenDetail(job)}
      sx={{
        position: 'absolute',
        left: `${leftPercent}%`,
        width: `calc(${widthPercent}% - 8px)`,
        mx: '4px',
        top: trackIndex * 76 + 10,
        height: 66,
        borderRadius: 2,
        color: statusStyle.color,
        bgcolor: isHighlighted === 'undo'
          ? 'rgba(244, 63, 94, 0.25) !important'
          : isHighlighted === 'drop'
            ? 'rgba(6, 182, 212, 0.25) !important'
            : statusStyle.bg,
        border: isHighlighted === 'undo'
          ? '1.5px solid #f43f5e !important'
          : isHighlighted === 'drop'
            ? '1.5px solid #06b6d4 !important'
            : `1px solid ${statusStyle.border}`,
        borderLeftWidth: isClippedLeft ? '3px dashed' : '1.5px solid',
        borderRightWidth: isClippedRight ? '3px dashed' : '1px solid',
        boxShadow: isClippedLeft
          ? 'none'
          : 'inset 3.5px 0 0 ' + (isHighlighted === 'undo' ? '#f43f5e' : isHighlighted === 'drop' ? '#06b6d4' : statusStyle.border) + ', 0 3px 6px rgba(15,23,42,0.03)',
        cursor: 'grab',
        transition: isHighlighted ? 'none' : 'background-color 1s ease, border-color 1s ease, box-shadow 150ms ease, filter 150ms ease',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        px: 1.25,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 6px 12px rgba(15,23,42,0.08)',
          filter: 'brightness(0.97)',
          zIndex: 6,
        },
        '&:active': { cursor: 'grabbing' },
        '& > *': { pointerEvents: 'none' }, // Prevent children from triggering drag enter/leave flickering
      }}
    >
      {isDragOver && dropPosition && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            bgcolor: '#4f46e5',
            zIndex: 10,
            pointerEvents: 'none', // Ignore pointer events on the indicator line itself
            boxShadow: '0 0 6px rgba(79, 70, 229, 0.5)',
            ...(dropPosition === 'before' ? { top: 0 } : { bottom: 0 }),
          }}
        />
      )}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Typography noWrap sx={{ fontSize: '0.84rem', fontWeight: 950, lineHeight: 1.1 }}>
          {job.aufnr}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography
            sx={{
              fontSize: '0.66rem',
              fontWeight: 900,
              color: statusStyle.color,
              bgcolor: 'rgba(255, 255, 255, 0.45)',
              px: 0.5,
              py: 0.05,
              borderRadius: '4px',
              border: `1px solid ${statusStyle.border}`,
              textTransform: 'uppercase',
              lineHeight: 1.1,
            }}
          >
            {job.text1 || 'NOT START'}
          </Typography>
          <Chip
            size="small"
            label={`OP ${job.vornr || '-'}`}
            sx={{
              height: 18,
              fontSize: '0.66rem',
              fontWeight: 900,
              bgcolor: 'rgba(255, 255, 255, 0.55)',
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
              px: 0.35,
            }}
          />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.2, overflow: 'hidden', width: '100%' }}>
        {job.zpg3d && (
          <Typography
            noWrap
            sx={{
              fontSize: '0.66rem',
              fontWeight: 900,
              color: '#0f172a',
              bgcolor: 'rgba(15, 23, 42, 0.08)',
              px: 0.5,
              py: 0.05,
              borderRadius: '4px',
              border: '1px solid rgba(15, 23, 42, 0.15)',
              lineHeight: 1.25,
            }}
          >
            {job.zpg3d}
          </Typography>
        )}
        {job.zpg2d && (
          <Typography noWrap sx={{ fontSize: '0.66rem', fontWeight: 800, color: 'text.secondary' }}>
            {cleanZpg2d(job.zpg2d)}
          </Typography>
        )}
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.2, width: '100%' }}>
        <Typography noWrap sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', maxWidth: '65%' }}>
          {job.zptkx || job.ltxa1 || 'คำสั่งผลิต'}
        </Typography>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 900, color: 'text.primary', ml: 1 }}>
          {job.optime > 0 ? `${numberFormatter.format(job.optime)} ชม.` : '0 ชม.'}
        </Typography>
      </Stack>
    </Box>
  );
});

export default function GanttSchedulerClient({ initialDate, jobs, workCenters, generatedAt }: Props) {
  const [windowStart, setWindowStart] = React.useState(() => startOfMondayWeek(initialDate));
  const [orderSearch, setOrderSearch] = React.useState('');
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>(['NOT START', 'START', 'WAIT', 'DONE']);
  const [selectedWorkCenter, setSelectedWorkCenter] = React.useState('ALL');

  const [localJobs, setLocalJobs] = React.useState(jobs);
  const [initialJobs, setInitialJobs] = React.useState(jobs);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isDefaultSettingProcessing, setIsDefaultSettingProcessing] = React.useState(false);
  const [localJobsHistory, setLocalJobsHistory] = React.useState<{ state: PlanningJob[]; affectedJobIds: number[] }[]>([]);
  const [highlightedJobIds, setHighlightedJobIds] = React.useState<Set<number>>(new Set());
  const [droppedJobIds, setDroppedJobIds] = React.useState<Set<number>>(new Set());

  const localJobsRef = React.useRef(localJobs);
  React.useEffect(() => {
    localJobsRef.current = localJobs;
  }, [localJobs]);

  const pushToHistory = React.useCallback((affectedJobIds: number[] = []) => {
    setLocalJobsHistory((prev) => [...prev, { state: localJobsRef.current, affectedJobIds }]);
  }, []);

  const triggerDropHighlight = React.useCallback((jobIds: number[]) => {
    if (jobIds.length === 0) return;
    const idsSet = new Set(jobIds);
    setDroppedJobIds(idsSet);
    window.setTimeout(() => {
      setDroppedJobIds((prev) => {
        const next = new Set(prev);
        jobIds.forEach((id) => next.delete(id));
        return next;
      });
    }, 1000);
  }, []);

  const handleAutoSequence = React.useCallback(() => {
    if (isDefaultSettingProcessing) return;

    setIsDefaultSettingProcessing(true);
    setSnackbar({
      open: true,
      message: 'กำลังจัดลำดับเริ่มต้นคิวงานตาม Excel...',
      severity: 'info',
    });

    window.setTimeout(() => {
      try {
        pushToHistory();  // DEFAULT SETTING affects all jobs, highlight all
        setLocalJobs((current) => {
          // Restore WC and dates to the initial Excel database/uploaded values
          const initialMap = new Map(initialJobs.map((j) => [j.id, j]));
          const restored = current.map((job) => {
            const init = initialMap.get(job.id);
            if (init) {
              return {
                ...job,
                arbpl: init.excelArbpl ?? init.arbpl,
                stdate: init.excelStdate ?? init.stdate,
                findate: init.excelFindate ?? init.findate,
                seqno: init.excelSeqno ?? init.seqno,
                queueGroup: null, // excel default has no custom steel group
              };
            }
            return job;
          });

          // Group restored jobs by Work Center
          const byArbpl: Record<string, PlanningJob[]> = {};
          restored.forEach((job) => {
            byArbpl[job.arbpl] ??= [];
            byArbpl[job.arbpl].push(job);
          });

          const updatedJobs: PlanningJob[] = [];
          Object.keys(byArbpl).forEach((wc) => {
            const wcJobs = byArbpl[wc];
            // Sort using the exact home page logic
            const sorted = sortJobsWithZpg3dTransition(wcJobs);
            // Assign sequential seqno 1, 2, 3...
            const resequenced = sorted.map((job, idx) => ({
              ...job,
              seqno: idx + 1,
            }));
            updatedJobs.push(...resequenced);
          });

          const wcJobIds = new Set(updatedJobs.map((j) => j.id));
          const remainingJobs = restored.filter((j) => !wcJobIds.has(j.id));

          const nextList = [...updatedJobs, ...remainingJobs];

          const beforeCount = calculateChangeovers(current);
          const afterCount = calculateChangeovers(nextList);
          const savedCount = beforeCount - afterCount;

          setSnackbar({
            open: true,
            message: savedCount > 0
              ? `จัดเรียงคิวอัตโนมัติสำเร็จ! ลดการสลับสีเคลือบเหลือเพียง ${afterCount} ครั้ง (ลดลงถึง ${savedCount} ครั้ง! ⚡)`
              : `จัดเรียงคิวอัตโนมัติสำเร็จ! ความต่อเนื่องกลุ่มสีเคลือบอยู่ที่ ${afterCount} ครั้ง`,
            severity: 'success',
          });

          return nextList;
        });
        setHasChanges(true);
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : String(error)),
          severity: 'error',
        });
      } finally {
        setIsDefaultSettingProcessing(false);
      }
    }, 100);
  }, [initialJobs, isDefaultSettingProcessing]);

  const [selectedJobForModal, setSelectedJobForModal] = React.useState<PlanningJob | null>(null);
  const [dragOverState, setDragOverState] = React.useState<{ id: number; position: 'before' | 'after' } | null>(null);

  const weekChangeTimerRef = React.useRef<number | null>(null);

  const [collapsedWCs, setCollapsedWCs] = React.useState<Record<string, boolean>>({});

  const allCollapsed = React.useMemo(() => {
    return workCenters.every((wc) => collapsedWCs[wc]);
  }, [workCenters, collapsedWCs]);

  const handleToggleAllWCs = React.useCallback(() => {
    if (allCollapsed) {
      setCollapsedWCs({});
    } else {
      const next: Record<string, boolean> = {};
      workCenters.forEach((wc) => {
        next[wc] = true;
      });
      setCollapsedWCs(next);
    }
  }, [allCollapsed, workCenters]);

  const toggleWCCollapse = React.useCallback((wc: string) => {
    setCollapsedWCs((prev) => ({ ...prev, [wc]: !prev[wc] }));
  }, []);

  const handleDragOverPrevWeek = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!weekChangeTimerRef.current) {
      weekChangeTimerRef.current = window.setTimeout(() => {
        setWindowStart((current) => addDays(current, -DAY_COUNT));
        weekChangeTimerRef.current = null;
      }, 700);
    }
  }, []);

  const handleDragOverNextWeek = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (!weekChangeTimerRef.current) {
      weekChangeTimerRef.current = window.setTimeout(() => {
        setWindowStart((current) => addDays(current, DAY_COUNT));
        weekChangeTimerRef.current = null;
      }, 700);
    }
  }, []);

  const handleDragLeaveWeekButtons = React.useCallback(() => {
    if (weekChangeTimerRef.current) {
      window.clearTimeout(weekChangeTimerRef.current);
      weekChangeTimerRef.current = null;
    }
  }, []);

  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  React.useEffect(() => {
    setLocalJobs(jobs);
    setInitialJobs(jobs);
    setHasChanges(false);
    setLocalJobsHistory([]);
  }, [jobs]);

  const handleSnackbarClose = React.useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleCancel = () => {
    if (localJobsHistory.length > 0) {
      const historyEntry = localJobsHistory[localJobsHistory.length - 1];
      const previousState = historyEntry.state;
      const storedIds = historyEntry.affectedJobIds;

      const newHistory = localJobsHistory.slice(0, -1);
      setLocalJobsHistory(newHistory);
      setLocalJobs(previousState);

      // Highlight only the specific jobs that were affected by the action
      if (storedIds.length > 0) {
        const changedIds = new Set<number>(storedIds);
        setHighlightedJobIds(changedIds);
        window.setTimeout(() => {
          setHighlightedJobIds((prev) => {
            const next = new Set(prev);
            changedIds.forEach((id) => next.delete(id));
            return next;
          });
        }, 1000);
      }

      if (newHistory.length === 0) {
        setHasChanges(false);
      }

      setSnackbar({
        open: true,
        message: 'ย้อนกลับการทำรายการล่าสุดเรียบร้อยแล้ว (Undo)',
        severity: 'info',
      });
    } else {
      setLocalJobs(initialJobs);
      setHasChanges(false);
      setSnackbar({
        open: true,
        message: 'คืนค่าเป็นแผนเริ่มต้นเรียบร้อยแล้ว (Undo ทั้งหมด)',
        severity: 'info',
      });
    }
  };

  const handleSave = async () => {
    const initMap = new Map(initialJobs.map((j) => [j.id, j]));
    const changed = localJobs.filter((job) => {
      const init = initMap.get(job.id);
      return init && (
        init.stdate !== job.stdate ||
        init.findate !== job.findate ||
        init.arbpl !== job.arbpl ||
        init.seqno !== job.seqno
      );
    });

    if (changed.length === 0) {
      setHasChanges(false);
      return;
    }

    const affectedWorkCenters = new Set<string>();
    for (const job of changed) {
      affectedWorkCenters.add(job.arbpl);
      const initialJob = initMap.get(job.id);
      if (initialJob) affectedWorkCenters.add(initialJob.arbpl);
    }
    const jobsToSave = localJobs.filter((job) => affectedWorkCenters.has(job.arbpl));

    setSaving(true);

    try {
      const response = await fetch('/api/jobs/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: jobsToSave.map((job) => ({
            id: job.id,
            stdate: job.stdate,
            findate: job.findate,
            arbpl: job.arbpl,
            seqno: job.seqno,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setInitialJobs(localJobs);
      setHasChanges(false);
      setLocalJobsHistory([]);
      setSnackbar({
        open: true,
        message: 'บันทึกเรียบร้อย!',
        severity: 'success',
      });
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกตารางกำลังผลิต');
    } finally {
      setSaving(false);
    }
  };

  const days = React.useMemo(
    () => Array.from({ length: DAY_COUNT }, (_, index) => addDays(windowStart, index)),
    [windowStart],
  );
  const windowEnd = days.at(-1) ?? windowStart;

  const lacquerColorMap = React.useMemo(() => {
    const jobsList = localJobs.filter(Boolean);

    // Build a reverse lookup: lacquerKey → first matching job's zpg3d
    const keyToGroup3 = new Map<string, string | null>();
    for (const job of jobsList) {
      const key = getLacquerKey(job);
      if (!keyToGroup3.has(key)) {
        keyToGroup3.set(key, job.zpg3d);
      }
    }

    const lacquerKeys = Array.from(keyToGroup3.keys()).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
    const map = new Map<string, LacquerColor>();
    lacquerKeys.forEach((key, index) => {
      map.set(key, getLacquerColorByGroup3(keyToGroup3.get(key) ?? null, index));
    });
    return map;
  }, [localJobs]);

  const handleDropJob = React.useCallback((jobId: number, targetWorkCenter: string, targetDay: string) => {
    pushToHistory([jobId]);
    setLocalJobs((current) => {
      const draggedJob = current.find((j) => j.id === jobId);
      if (!draggedJob) return current;

      const duration = daysBetween(draggedJob.stdate || targetDay, draggedJob.findate || targetDay);
      const newStartDate = targetDay;
      const newFinishDate = addDays(newStartDate, duration);

      const updatedJob = {
        ...draggedJob,
        arbpl: targetWorkCenter,
        stdate: newStartDate,
        findate: newFinishDate,
      };

      const targetCellJobs = current
        .filter((j) => j.arbpl === targetWorkCenter && j.stdate === targetDay && j.id !== jobId)
        .sort((a, b) => a.seqno - b.seqno || a.id - b.id);
      const resequencedTargetJobs = [...targetCellJobs, updatedJob].map((job, index) => ({
        ...job,
        seqno: index + 1,
      }));

      let resequencedSourceJobs: PlanningJob[] = [];
      if (draggedJob.arbpl !== targetWorkCenter || draggedJob.stdate !== targetDay) {
        resequencedSourceJobs = current
          .filter((j) => j.arbpl === draggedJob.arbpl && j.stdate === draggedJob.stdate && j.id !== jobId)
          .sort((a, b) => a.seqno - b.seqno || a.id - b.id)
          .map((job, index) => ({ ...job, seqno: index + 1 }));
      }

      const targetJobsById = new Map(resequencedTargetJobs.map((job) => [job.id, job]));
      const sourceJobsById = new Map(resequencedSourceJobs.map((job) => [job.id, job]));
      const updatedList = current.map((job) => (
        targetJobsById.get(job.id) ?? sourceJobsById.get(job.id) ?? job
      ));
      setHasChanges(true);
      return resequenceWorkCentersBySchedule(
        updatedList,
        new Set([draggedJob.arbpl, targetWorkCenter]),
      );
    });
    triggerDropHighlight([jobId]);
  }, [triggerDropHighlight]);

  const handleDropJobOnTarget = React.useCallback((draggedId: number, targetJob: PlanningJob, position: 'before' | 'after') => {
    setDragOverState(null);
    pushToHistory([draggedId]);
    setLocalJobs((current) => {
      const draggedJob = current.find((j) => j.id === draggedId);
      if (!draggedJob) return current;

      const targetDay = targetJob.stdate || '';
      const targetWorkCenter = targetJob.arbpl;

      const duration = daysBetween(draggedJob.stdate || targetDay, draggedJob.findate || targetDay);
      const newStartDate = targetDay;
      const newFinishDate = addDays(newStartDate, duration);

      const updatedDraggedJob = {
        ...draggedJob,
        arbpl: targetWorkCenter,
        stdate: newStartDate,
        findate: newFinishDate,
      };

      const targetCellJobs = current
        .filter((j) => j.arbpl === targetWorkCenter && j.stdate === targetDay && j.id !== draggedId)
        .sort((a, b) => a.seqno - b.seqno || a.id - b.id);

      const targetIdx = targetCellJobs.findIndex((j) => j.id === targetJob.id);
      let insertionIdx = targetIdx;
      if (targetIdx !== -1 && position === 'after') {
        insertionIdx = targetIdx + 1;
      }
      const insertionIdxFinal = targetIdx === -1 ? targetCellJobs.length : insertionIdx;

      const newCellJobs = [...targetCellJobs];
      newCellJobs.splice(insertionIdxFinal, 0, updatedDraggedJob);

      const resequencedCellJobs = newCellJobs.map((j, idx) => ({
        ...j,
        seqno: idx + 1,
      }));

      let sourceCellJobs: PlanningJob[] = [];
      if (draggedJob.stdate !== targetDay || draggedJob.arbpl !== targetWorkCenter) {
        const sourceOps = current
          .filter((j) => j.arbpl === draggedJob.arbpl && j.stdate === draggedJob.stdate && j.id !== draggedId)
          .sort((a, b) => a.seqno - b.seqno || a.id - b.id);
        sourceCellJobs = sourceOps.map((j, idx) => ({
          ...j,
          seqno: idx + 1,
        }));
      }

      const updatedList = current.map((j) => {
        const inTarget = resequencedCellJobs.find((r) => r.id === j.id);
        if (inTarget) return inTarget;

        const inSource = sourceCellJobs.find((s) => s.id === j.id);
        if (inSource) return inSource;

        if (j.id === draggedId) return updatedDraggedJob;

        return j;
      });

      setHasChanges(true);
      return resequenceWorkCentersBySchedule(
        updatedList,
        new Set([draggedJob.arbpl, targetWorkCenter]),
      );
    });
    triggerDropHighlight([draggedId]);
  }, [triggerDropHighlight]);

  const capacityData = React.useMemo(() => {
    const map = new Map<string, number>();
    localJobs.forEach((job) => {
      if (job.stdate && job.findate && job.optime > 0) {
        const start = parseIsoDate(job.stdate);
        const end = parseIsoDate(job.findate);
        const durationDays = daysBetween(job.stdate, job.findate) + 1;
        const hoursPerDay = job.optime / durationDays;

        for (let i = 0; i < durationDays; i++) {
          const currentDayStr = addDays(job.stdate, i);
          const key = `${job.arbpl}|${currentDayStr}`;
          map.set(key, (map.get(key) ?? 0) + hoursPerDay);
        }
      }
    });
    return map;
  }, [localJobs]);

  const currentChangeovers = React.useMemo(() => calculateChangeovers(localJobs), [localJobs]);
  const initialChangeovers = React.useMemo(() => calculateChangeovers(initialJobs), [initialJobs]);

  const currentOverloads = React.useMemo(() => countOverloadDays(localJobs), [localJobs]);
  const initialOverloads = React.useMemo(() => countOverloadDays(initialJobs), [initialJobs]);

  const filteredJobs = React.useMemo(
    () => localJobs.filter((job) => {
      const matchWindow = job.stdate && job.findate &&
        !(job.findate < windowStart || job.stdate > windowEnd);
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(job.text1?.toUpperCase() || 'NOT START');
      const matchWorkCenter = selectedWorkCenter === 'ALL' || job.arbpl === selectedWorkCenter;
      const matchOrder = !orderSearch.trim() || job.aufnr.toLowerCase().includes(orderSearch.trim().toLowerCase());
      return matchWindow && matchStatus && matchWorkCenter && matchOrder;
    }),
    [localJobs, selectedStatuses, selectedWorkCenter, windowEnd, windowStart, orderSearch],
  );

  const visibleWorkCenters = selectedWorkCenter === 'ALL' ? workCenters : [selectedWorkCenter];

  const lanesData = React.useMemo(() => {
    return visibleWorkCenters.map((wc) => {
      const wcJobs = filteredJobs.filter((job) => job.arbpl === wc);
      wcJobs.sort((a, b) => (a.stdate || '').localeCompare(b.stdate || '') || a.seqno - b.seqno || a.id - b.id);

      const allocatedTracks: { startMs: number; endMs: number; trackIndex: number }[] = [];
      const jobsWithPosition = wcJobs.map((job) => {
        const pos = calculateGanttPosition(job.stdate || '', job.findate || '', windowStart, windowEnd);
        if (!pos) return null;

        const startMs = parseIsoDate(job.stdate || '').getTime();
        const endMs = parseIsoDate(job.findate || '').getTime() + 86400000;

        const usedTrackIndices = new Set<number>();
        for (const allocated of allocatedTracks) {
          const overlap = !(allocated.endMs <= startMs || allocated.startMs >= endMs);
          if (overlap) {
            usedTrackIndices.add(allocated.trackIndex);
          }
        }

        let trackIndex = 0;
        while (usedTrackIndices.has(trackIndex)) {
          trackIndex++;
        }

        allocatedTracks.push({ startMs, endMs, trackIndex });

        return {
          job,
          trackIndex,
          ...pos,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      // Calculate changeovers for this work center
      let changeovers = 0;
      for (let i = 0; i < wcJobs.length - 1; i++) {
        if (getLacquerKey(wcJobs[i]) !== getLacquerKey(wcJobs[i + 1])) {
          changeovers++;
        }
      }

      const isCollapsed = collapsedWCs[wc] || false;
      const maxTrackIndex = jobsWithPosition.reduce((max, item) => Math.max(max, item.trackIndex), -1);
      const totalTracks = Math.max(1, maxTrackIndex + 1);
      const laneHeight = isCollapsed ? 48 : (totalTracks * 76 + 20);

      return {
        wc,
        wcJobs,
        jobsWithPosition,
        isCollapsed,
        laneHeight,
        changeovers,
      };
    });
  }, [visibleWorkCenters, filteredJobs, collapsedWCs, windowStart, windowEnd]);

  return (
    <Box sx={{ pb: 6 }}>
      <Stack spacing={3}>
        {/* Header Action Row */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3.5, border: '1px solid rgba(15,23,42,0.06)' }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: '#0f172a', fontWeight: 950, fontSize: '1.2rem' }}>
                Gantt Capacity Scheduler
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.75 }}>
                <Chip
                  icon={<span>🎨</span>}
                  label={`สลับสี L/Q: ${currentChangeovers} ครั้ง`}
                  sx={{
                    color: '#c2410c',
                    bgcolor: '#fff7ed',
                    border: '1px solid #ffedd5',
                    fontWeight: 900,
                    fontSize: '0.74rem',
                    height: 24,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              </Stack>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, flexWrap: 'wrap' }}>
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setWindowStart((current) => addDays(current, -DAY_COUNT))}
                  onDragOver={handleDragOverPrevWeek}
                  onDragLeave={handleDragLeaveWeekButtons}
                  sx={{ minWidth: 34, px: 0.7, borderRadius: 1.5 }}
                >
                  <ArrowLeft2 size="16" color="currentColor" />
                </Button>
                <Button size="small" variant="outlined" onClick={() => setWindowStart(startOfMondayWeek(initialDate))} sx={{ borderRadius: 1.5, fontWeight: 850 }}>
                  สัปดาห์นี้
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setWindowStart((current) => addDays(current, DAY_COUNT))}
                  onDragOver={handleDragOverNextWeek}
                  onDragLeave={handleDragLeaveWeekButtons}
                  sx={{ minWidth: 34, px: 0.7, borderRadius: 1.5 }}
                >
                  <ArrowRight2 size="16" color="currentColor" />
                </Button>
              </Stack>

              <TextField
                size="small"
                placeholder="ค้นหาเลขที่ Order..."
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                slotProps={{
                  input: {
                    endAdornment: orderSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setOrderSearch('')} edge="end" sx={{ color: '#94a3b8' }}>
                          <CloseCircle size="16" variant="Linear" color="currentColor" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
                sx={{
                  minWidth: 160,
                  '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.8rem', fontWeight: 650, bgcolor: '#ffffff', pr: 1 },
                }}
              />

              <FormControl size="small" sx={{ minWidth: 145 }}>
                <Select MenuProps={{ disableScrollLock: true }} value={selectedWorkCenter} onChange={(event) => setSelectedWorkCenter(event.target.value)} sx={{ borderRadius: 1.5, fontSize: '0.82rem', fontWeight: 800 }}>
                  <MenuItem value="ALL">ทุก Work center</MenuItem>
                  {workCenters.map((wc) => <MenuItem key={wc} value={wc}>WC {wc}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 155 }}>
                <Select
                  multiple
                  MenuProps={{ disableScrollLock: true }}
                  value={selectedStatuses}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedStatuses(typeof value === 'string' ? value.split(',') : value as string[]);
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 4) return 'ทุกสถานะ';
                    if (selected.length === 0) return 'ไม่มีสถานะ';
                    return selected.join(', ');
                  }}
                  sx={{ borderRadius: 1.5, fontSize: '0.82rem', fontWeight: 800, bgcolor: '#ffffff' }}
                >
                  {['NOT START', 'START', 'WAIT', 'DONE'].map((st) => (
                    <MenuItem key={st} value={st} sx={{ fontSize: '0.82rem', fontWeight: 700, py: 0.25 }}>
                      <Checkbox checked={selectedStatuses.indexOf(st) > -1} size="small" sx={{ py: 0, mr: 0.5 }} />
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{st}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                size="small"
                onClick={handleAutoSequence}
                disabled={saving || isDefaultSettingProcessing}
                startIcon={isDefaultSettingProcessing && <CircularProgress size={12} color="inherit" />}
                sx={{
                  height: 38,
                  px: 1.5,
                  borderRadius: 1.5,
                  borderColor: '#4f46e5',
                  bgcolor: 'rgba(79, 70, 229, 0.04)',
                  color: '#4f46e5',
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  textTransform: 'none',
                  '&:hover': { bgcolor: 'rgba(79, 70, 229, 0.08)' },
                }}
              >
                {isDefaultSettingProcessing ? 'กำลังจัดลำดับ...' : 'DEFAULT SETTING'}
              </Button>

              <Tooltip title={allCollapsed ? 'ขยายทุกเครื่อง' : 'ยุบทุกเครื่อง'} arrow>
                <IconButton
                  size="small"
                  aria-label={allCollapsed ? 'ขยายทุกเครื่อง' : 'ยุบทุกเครื่อง'}
                  onClick={handleToggleAllWCs}
                  sx={{
                    width: 38,
                    height: 38,
                    border: '1px solid #cbd5e1',
                    borderRadius: 1.5,
                    bgcolor: '#ffffff',
                    color: '#475569',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
                  }}
                >
                  {allCollapsed
                    ? <ArrowDown2 size="18" color="currentColor" />
                    : <ArrowUp2 size="18" color="currentColor" />}
                </IconButton>
              </Tooltip>

              {/* Color Mode dropdown removed */}
            </Stack>
          </Stack>
        </Paper>



        {/* Top Half: Capacity / Load Analytics Bar Charts */}
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3.5, border: '1px solid rgba(15,23,42,0.06)', bgcolor: '#ffffff' }}>
          <Stack direction="row" spacing={1} sx={{ mb: 3, alignItems: 'center' }}>
            <Typography sx={{ color: '#0f172a', fontWeight: 950, fontSize: '0.96rem', display: 'flex', alignItems: 'center', gap: 1 }}>
              วิเคราะห์กำลังการผลิตรวมของแต่ละเครื่องจักร
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `170px repeat(${DAY_COUNT}, minmax(0, 1fr))`,
              borderBottom: '1px solid #cbd5e1',
              pb: 1,
              minHeight: 160,
              position: 'relative',
            }}
          >
            {/* Horizontal Capacity Limit Guideline (24h) */}
            <Box
              sx={{
                position: 'absolute',
                top: '25%',
                left: 170,
                right: 0,
                height: 0,
                borderTop: '1.5px dashed #ef4444',
                zIndex: 2,
                pointerEvents: 'none',
                '&::after': {
                  content: '"ความจุสูงสุด 24.0 ชม."',
                  position: 'absolute',
                  right: 8,
                  top: -15,
                  fontSize: '0.58rem',
                  color: '#ef4444',
                  fontWeight: 900,
                  bgcolor: '#ffffff',
                  px: 0.5,
                  borderRadius: 0.5,
                }
              }}
            />

            {/* Y-Axis scale indicators */}
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 130, pr: 2, borderRight: '1px solid #cbd5e1' }}>
              <Typography sx={{ fontSize: '0.62rem', color: '#64748b', textAlign: 'right', fontWeight: 800 }}>32.0 ชม.</Typography>
              <Typography sx={{ fontSize: '0.62rem', color: '#ef4444', textAlign: 'right', fontWeight: 800 }}>24.0 ชม.</Typography>
              <Typography sx={{ fontSize: '0.62rem', color: '#64748b', textAlign: 'right', fontWeight: 800 }}>12.0 ชม.</Typography>
              <Typography sx={{ fontSize: '0.62rem', color: '#64748b', textAlign: 'right', fontWeight: 800 }}>0.0 ชม.</Typography>
            </Box>

            {/* Bar columns */}
            {days.map((day) => {
              return (
                <Box key={day} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '4px', px: 1, height: 130, position: 'relative' }}>
                  {visibleWorkCenters.map((wc) => {
                    const loadHours = capacityData.get(`${wc}|${day}`) ?? 0.0;
                    const heightPercent = Math.min(100, (loadHours / 32.0) * 100);
                    const isOverloaded = loadHours > MACHINE_CAPACITY_LIMIT;

                    let barColor = 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)';
                    if (isOverloaded) {
                      barColor = 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)';
                    } else if (loadHours > 16.0) {
                      barColor = 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)';
                    }

                    return (
                      <Tooltip
                        key={wc}
                        title={
                          <Box sx={{ p: 0.5, minWidth: 155 }}>
                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 950, color: '#4f46e5', mb: 0.5 }}>
                              Machine: WC {wc}
                            </Typography>
                            <Typography sx={{ fontSize: '0.74rem', color: '#1e293b', fontWeight: 800 }}>
                              กำลังผลิตรวม: {numberFormatter.format(Number(loadHours.toFixed(1)))} / 24.0 ชม.
                            </Typography>
                            {isOverloaded && (
                              <Typography sx={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 950, mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                ⚠️ โหลดงานเกินขีดจำกัด!
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                        placement="top"
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: '#ffffff',
                              color: '#1e293b',
                              border: '1px solid rgba(15,23,42,0.12)',
                              boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
                              borderRadius: 2,
                              p: 1.15,
                            }
                          },
                          arrow: {
                            sx: {
                              color: '#ffffff',
                              '&::before': {
                                border: '1px solid rgba(15,23,42,0.12)',
                              }
                            }
                          }
                        }}
                      >
                        <Stack
                          spacing={0.5}
                          sx={{
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                            width: 10,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: `calc((${heightPercent} / 100) * (100% - 14px))`,
                              borderRadius: '4px 4px 0 0',
                              background: barColor,
                              transition: 'height 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                              cursor: 'pointer',
                              zIndex: 3,
                              '&:hover': {
                                filter: 'brightness(0.9)',
                                transform: 'scaleX(1.15)',
                              }
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.52rem',
                              fontWeight: 900,
                              color: '#64748b',
                              lineHeight: 1,
                              cursor: 'default',
                            }}
                          >
                            {wc.slice(-2)}
                          </Typography>
                        </Stack>
                      </Tooltip>
                    );
                  })}
                </Box>
              );
            })}
          </Box>

          {/* X-Axis labels */}
          <Box sx={{ display: 'grid', gridTemplateColumns: `170px repeat(${DAY_COUNT}, minmax(0, 1fr))`, mt: 0.75 }}>
            <Box />
            {days.map((day) => (
              <Typography key={day} suppressHydrationWarning sx={{ fontSize: '0.72rem', color: '#475569', fontWeight: 900, textAlign: 'center' }}>
                {dayFormatter.format(parseIsoDate(day))}
              </Typography>
            ))}
          </Box>
        </Paper>

        {/* Bottom Half: Gantt Timeline Lanes */}
        <Paper className="gantt-board-container" elevation={0} sx={{ borderRadius: 3.5, border: '1px solid rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ width: '100%', position: 'relative' }}>

              {/* Board header row */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `170px repeat(${DAY_COUNT}, minmax(0, 1fr))`,
                  bgcolor: '#f8fafc',
                  borderBottom: '1px solid #cbd5e1',
                  position: 'sticky',
                  top: 0,
                  zIndex: 9,
                }}
              >
                <Box sx={{ position: 'sticky', left: 0, top: 0, zIndex: 10, p: 1.5, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1' }}>
                  <Typography sx={{ color: '#475569', fontSize: '0.76rem', fontWeight: 950 }}>WORK CENTER</Typography>
                </Box>
                {days.map((day) => {
                  const isToday = day === initialDate;
                  return (
                    <Box key={day} sx={{ p: 1.25, textAlign: 'center', bgcolor: isToday ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
                      <Typography suppressHydrationWarning sx={{ color: isToday ? '#1d4ed8' : '#475569', fontSize: '0.78rem', fontWeight: 950 }}>
                        {dayFormatter.format(parseIsoDate(day))}
                      </Typography>
                      {isToday && <Typography sx={{ color: '#2563eb', fontSize: '0.62rem', fontWeight: 900, mt: 0.1 }}>TODAY</Typography>}
                    </Box>
                  );
                })}
              </Box>

              {/* Board lane rows */}
              {lanesData.map(({ wc, wcJobs, jobsWithPosition, isCollapsed, laneHeight, changeovers }) => {

                return (
                  <Box
                    key={wc}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: `170px 1fr`,
                      borderBottom: '1px solid #e2e8f0',
                      position: 'relative',
                      minHeight: laneHeight,
                      height: laneHeight,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Work Center label cell */}
                    <Box
                      onClick={() => toggleWCCollapse(wc)}
                      sx={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 8,
                        p: 1.5,
                        bgcolor: '#ffffff',
                        borderRight: '1px solid #cbd5e1',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        boxShadow: '4px 0 8px rgba(15,23,42,0.02)',
                        userSelect: 'none',
                        transition: 'background-color 100ms ease',
                        '&:hover': {
                          bgcolor: '#f8fafc',
                        }
                      }}
                    >
                      <Box>
                        <Typography sx={{ color: '#0f172a', fontSize: '0.94rem', fontWeight: 950 }}>WC {wc}</Typography>
                        {!isCollapsed && (
                          <>
                            <Typography sx={{ mt: 0.1, color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>
                              {wcJobs.length} OP Scheduled
                            </Typography>
                            <Typography sx={{ mt: 0.1, color: '#c2410c', fontSize: '0.68rem', fontWeight: 800 }}>
                              สลับสี L/Q: {changeovers} ครั้ง
                            </Typography>
                          </>
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 900, ml: 1 }}>
                        {isCollapsed ? '▼' : '▲'}
                      </Typography>
                    </Box>

                    {/* Timeline Lane Area (Drop grid background + overlay job bars) */}
                    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>

                      {/* 1. Grid Drop-Zone cells in background */}
                      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 1 }}>
                        {days.map((day) => (
                          <Box
                            key={day}
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                              event.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.08)';
                            }}
                            onDragLeave={(event) => {
                              event.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.currentTarget.style.backgroundColor = 'transparent';
                              const jobId = Number(event.dataTransfer.getData('text/plain'));
                              if (!isNaN(jobId)) {
                                handleDropJob(jobId, wc, day);
                              }
                            }}
                            sx={{
                              flex: 1,
                              height: '100%',
                              borderRight: '1px dashed rgba(226, 232, 240, 0.9)',
                              bgcolor: 'transparent',
                              transition: 'background-color 150ms ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: isCollapsed ? '0.72rem' : '1.15rem',
                                fontWeight: 950,
                                color: 'rgba(15, 23, 42, 0.095)',
                                userSelect: 'none',
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                lineHeight: 1.2,
                              }}
                            >
                              {(() => {
                                const d = parseIsoDate(day);
                                const dayNumber = d.getDate();
                                const daysMap = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
                                const monthsMap = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                                const yearShort = (d.getFullYear() + 543) % 100;
                                return (
                                  <>
                                    {daysMap[d.getDay()]}
                                    {!isCollapsed && (
                                      <Box component="span" sx={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, mt: 0.25, opacity: 0.85 }}>
                                        {dayNumber} {monthsMap[d.getMonth()]} {yearShort}
                                      </Box>
                                    )}
                                  </>
                                );
                              })()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* 2. Absolute Job Bars floating on top */}
                      {!isCollapsed && jobsWithPosition.map((pos) => {
                        if (!pos) return null;
                        return (
                          <GanttBarItem
                            key={pos.job.id}
                            job={pos.job}
                            daysFromStart={pos.daysFromStart}
                            durationDays={pos.durationDays}
                            isClippedLeft={pos.isClippedLeft}
                            isClippedRight={pos.isClippedRight}
                            trackIndex={pos.trackIndex}
                            onOpenDetail={setSelectedJobForModal}
                            onDragStartAny={() => { }}
                            onDragEndAny={() => {
                              setDragOverState(null);
                              if (weekChangeTimerRef.current) {
                                window.clearTimeout(weekChangeTimerRef.current);
                                weekChangeTimerRef.current = null;
                              }
                            }}
                            onDragOverJob={(event, targetJob, position) => {
                              if (dragOverState?.id !== targetJob.id || dragOverState?.position !== position) {
                                setDragOverState({ id: targetJob.id, position });
                              }
                            }}
                            onDragLeaveJob={() => {
                              setDragOverState(null);
                            }}
                            onDropOnJob={(event, targetJob, position) => {
                              setDragOverState(null);
                              const draggedId = Number(event.dataTransfer.getData('text/plain'));
                              if (!isNaN(draggedId) && draggedId !== targetJob.id) {
                                handleDropJobOnTarget(draggedId, targetJob, position);
                              }
                            }}
                            isDragOver={dragOverState?.id === pos.job.id}
                            dropPosition={dragOverState?.id === pos.job.id ? dragOverState.position : null}
                            lacquerColorMap={lacquerColorMap}
                            isHighlighted={
                              highlightedJobIds.has(pos.job.id) ? 'undo'
                              : droppedJobIds.has(pos.job.id) ? 'drop'
                              : false
                            }
                          />
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      </Stack>

      {/* Floating Save/Reset Action Bar */}
      {hasChanges && (
        <PlanningActionBar
          isSaving={saving || isDefaultSettingProcessing}
          onReset={handleCancel}
          resetLabel="UNDO"
          onSave={handleSave}
        />
      )}

      {/* Snackbar notification */}
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        onClose={handleSnackbarClose}
        severity={snackbar.severity}
      />

      {/* Job Details Modal */}
      <JobDetailDialog
        fallbackLacquerColor={fallbackLacquerColor}
        job={selectedJobForModal}
        lacquerColorMap={lacquerColorMap}
        onClose={() => setSelectedJobForModal(null)}
        onQuickMove={handleDropJob}
        workCenters={workCenters}
      />
    </Box>
  );
}
