'use client';

import * as React from 'react';
import Link from 'next/link';
import NotificationSnackbar from './NotificationSnackbar';
import WorkCenterCard from './WorkCenterCard';
import SequenceChangesDialog from './SequenceChangesDialog';
import type { SequenceChange } from './PlanningGroupTable';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  Book,
  Category,
  Clock,
  Data,
  HambergerMenu,
  Refresh,
  Setting2,
  StatusUp,
  TaskSquare,
} from 'iconsax-react';
import { getJobGroupId, getJobGroupSortOrder, cleanZpg2d, sortJobsWithZpg3dTransition } from '@/lib/zpg1d-helpers';
import type { PlanningDashboardData, PlanningJob } from '@/lib/planning';

type Props = {
  data: PlanningDashboardData;
};

const numberFormatter = new Intl.NumberFormat('th-TH');
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dragAutoScrollEdgePx = 180;
const dragAutoScrollMaxSpeed = 54;
const dragWheelScrollMultiplier = 1.35;

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return dateFormatter.format(new Date(value));
}

function WorkCenterTableSkeleton({ workCenter }: { workCenter: string }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2 }}
      >
        <Box sx={{ minWidth: 240 }}>
          <Typography variant="h6" sx={{ fontWeight: 850 }}>
            Work center {workCenter}
          </Typography>
          <Skeleton variant="text" width={260} height={24} />
        </Box>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={120} height={32} />
          <Skeleton variant="rounded" width={112} height={32} />
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {[0, 1, 2].map((groupIndex) => (
        <Box key={groupIndex} sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: 'rgba(15, 23, 42, 0.035)',
              borderLeft: '5px solid rgba(79, 70, 229, 0.28)',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="rounded" width={54} height={20} />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <Skeleton variant="text" width={90} />
              <Skeleton variant="text" width={110} />
              <Skeleton variant="text" width={96} />
            </Stack>
          </Box>
          <Box sx={{ mt: 1, border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
            {[0, 1, 2, 3, 4].map((rowIndex) => (
              <Box
                key={rowIndex}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '56px minmax(140px, 1fr) 96px 96px',
                    md: '72px minmax(220px, 1fr) 120px 130px 130px 130px 96px 190px 110px 110px 96px 100px',
                  },
                  gap: 1.25,
                  alignItems: 'center',
                  px: 1.5,
                  py: 1.25,
                  borderTop: rowIndex === 0 ? 0 : '1px solid rgba(15, 23, 42, 0.05)',
                }}
              >
                <Skeleton variant="rounded" width={38} height={22} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="rounded" width={58} height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="rounded" width={72} height={30} sx={{ display: { xs: 'none', md: 'block' } }} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Paper>
  );
}

function MetricCardsSkeleton() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
        gap: 1.5,
      }}
    >
      {[0, 1, 2, 3, 4].map((item) => (
        <Paper
          key={item}
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 1.5,
            borderColor: 'rgba(15, 23, 42, 0.08)',
            boxShadow: 'none',
          }}
        >
          <Stack spacing={1}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="68%" height={18} />
            <Skeleton variant="text" width="52%" height={30} />
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

function LoadSummariesSkeleton() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr 0.75fr' }, gap: 2 }}>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={190} height={28} sx={{ mb: 1 }} />
        <Stack spacing={1.5}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Box key={item}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Skeleton variant="text" width={72} height={22} />
                <Skeleton variant="text" width={58} height={22} />
              </Stack>
              <Skeleton variant="rounded" width="100%" height={8} sx={{ borderRadius: 999 }} />
            </Box>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={210} height={28} sx={{ mb: 1 }} />
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((item) => (
            <Stack key={item} direction="row" sx={{ justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="76%" height={22} />
                <Skeleton variant="text" width="48%" height={18} />
              </Box>
              <Skeleton variant="rounded" width={64} height={24} />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function groupByWorkCenter(jobs: PlanningJob[]) {
  return jobs.reduce<Record<string, PlanningJob[]>>((acc, job) => {
    acc[job.arbpl] ??= [];
    acc[job.arbpl].push(job);
    return acc;
  }, {});
}

function buildSequenceChangeMap(initialJobs: PlanningJob[], jobs: PlanningJob[]) {
  const initialById = new Map<number, {
    seq: number;
    workCenter: string;
    group: string | null;
  }>();
  const currentById = new Map<number, {
    seq: number;
    workCenter: string;
    group: string | null;
  }>();

  Object.entries(groupByWorkCenter(initialJobs)).forEach(([workCenter, workCenterJobs]) => {
    workCenterJobs.forEach((job, index) => {
      initialById.set(job.id, {
        seq: index + 1,
        workCenter,
        group: job.zpg1d,
      });
    });
  });

  Object.entries(groupByWorkCenter(jobs)).forEach(([workCenter, workCenterJobs]) => {
    workCenterJobs.forEach((job, index) => {
      currentById.set(job.id, {
        seq: index + 1,
        workCenter,
        group: job.zpg1d,
      });
    });
  });

  const changes = new Map<number, SequenceChange>();

  currentById.forEach((current, jobId) => {
    const initial = initialById.get(jobId);
    if (!initial) return;

    if (
      initial.seq !== current.seq ||
      initial.workCenter !== current.workCenter ||
      initial.group !== current.group
    ) {
      changes.set(jobId, {
        previousSeq: initial.seq,
        currentSeq: current.seq,
        previousWorkCenter: initial.workCenter,
        currentWorkCenter: current.workCenter,
        previousGroup: initial.group,
        currentGroup: current.group,
      });
    }
  });

  return changes;
}

function calculateChangeovers(jobs: PlanningJob[]) {
  let count = 0;
  for (let index = 0; index < jobs.length - 1; index += 1) {
    if (getLacquerKey(jobs[index]) !== getLacquerKey(jobs[index + 1])) {
      count += 1;
    }
  }
  return count;
}

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

const lacquerBaseColorCache = new Map<number, { bg: string; chipBg: string; text: string; border: string }>();

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

  if (group3.includes('ทอง')) {
    // Rich Gold / Amber theme
    return goldTheme;
  }

  if (group3.includes('ขาว') || group3.includes('White') || group3.includes('Plain')) {
    // Clean Solid White theme
    return whiteTheme;
  }

  if (group3.includes('บรอนด์') || group3.includes('บรอนซ์') || group3.includes('Bronze') || group3.includes('เงิน') || group3.includes('Silver')) {
    // Metallic Silver / Bronze theme
    return metallicTheme;
  }

  return createLacquerColor(indexFallback);
}

function sortableDate(value: string | null) {
  return value || '9999-12-31';
}

function jobDueDate(job: PlanningJob) {
  return sortableDate(job.findate || job.stdate);
}

function materialGroupText(value: string | null) {
  return value?.trim() || 'ไม่ระบุ';
}

function processingHours(job: PlanningJob) {
  return job.optime > 0 ? job.optime : 0.01;
}

function daysBetween(startDate: string, finishDate: string) {
  if (startDate === '9999-12-31' || finishDate === '9999-12-31') return Number.POSITIVE_INFINITY;

  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const finish = new Date(`${finishDate}T00:00:00Z`).getTime();

  if (Number.isNaN(start) || Number.isNaN(finish)) return Number.POSITIVE_INFINITY;

  return Math.max(0, (finish - start) / 86_400_000);
}

function criticalRatio(job: PlanningJob, scheduleStartDate: string) {
  return daysBetween(scheduleStartDate, jobDueDate(job)) / Math.max(processingHours(job) / 24, 0.01);
}

function compareMaterialGroups(a: PlanningJob, b: PlanningJob) {
  const group1OrderCompare = getJobGroupSortOrder(a.zpg1d) - getJobGroupSortOrder(b.zpg1d);
  if (group1OrderCompare !== 0) return group1OrderCompare;

  const group1Compare = materialGroupText(a.zpg1d).localeCompare(materialGroupText(b.zpg1d), 'th', { numeric: true });
  if (group1Compare !== 0) return group1Compare;

  const zpg2dCompare = cleanZpg2d(a.zpg2d).localeCompare(cleanZpg2d(b.zpg2d), 'th', { numeric: true });
  if (zpg2dCompare !== 0) return zpg2dCompare;

  return materialGroupText(a.zpg3d).localeCompare(materialGroupText(b.zpg3d), 'th', { numeric: true });
}

const isNearOrOverdueForSort = (findateStr: string | null) => {
  if (!findateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = findateStr.split('-').map(Number);
  const finishDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  const diffMs = finishDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const inclusiveDays = diffDays + 1;
  
  return inclusiveDays <= 3;
};

function sortJobsWithZpg1dGroups(targetJobs: PlanningJob[]) {
  return sortJobsWithZpg3dTransition(targetJobs, { prioritizeUrgent: true });
}


const THAI_MONTHS = [
  { value: 1, label: 'มกราคม' },
  { value: 2, label: 'กุมภาพันธ์' },
  { value: 3, label: 'มีนาคม' },
  { value: 4, label: 'เมษายน' },
  { value: 5, label: 'พฤษภาคม' },
  { value: 6, label: 'มิถุนายน' },
  { value: 7, label: 'กรกฎาคม' },
  { value: 8, label: 'สิงหาคม' },
  { value: 9, label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' },
];


export default function PlanningDashboard({ data }: Props) {
  const [jobs, setJobs] = React.useState(data.jobs);
  const [initialJobs, setInitialJobs] = React.useState(data.jobs);
  const sortedWorkCenters = React.useMemo(
    () => [...data.workCenters].sort((a, b) => a.arbpl.localeCompare(b.arbpl, 'th', { numeric: true })),
    [data.workCenters],
  );
  const defaultWorkCenter = sortedWorkCenters[0]?.arbpl ?? 'ALL';
  const [selectedWorkCenter, setSelectedWorkCenter] = React.useState(defaultWorkCenter);
  const deferredWorkCenter = React.useDeferredValue(selectedWorkCenter);
  const [startDateFilter, setStartDateFilter] = React.useState<Dayjs | null>(null);
  const deferredStartDate = React.useDeferredValue(startDateFilter);
  const [finishDateFilter, setFinishDateFilter] = React.useState<Dayjs | null>(null);
  const deferredFinishDate = React.useDeferredValue(finishDateFilter);
  
  const [selectedYear, setSelectedYear] = React.useState<number | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = React.useState<number | 'ALL'>('ALL');
  const [includeNextMonth, setIncludeNextMonth] = React.useState<boolean>(false);
  const [showOverdue, setShowOverdue] = React.useState<boolean>(false);
  const deferredShowOverdue = React.useDeferredValue(showOverdue);
  const [lqFilter, setLqFilter] = React.useState<string | null>(null);
  const deferredLqFilter = React.useDeferredValue(lqFilter);
  const [savingWorkCenter, setSavingWorkCenter] = React.useState<string | null>(null);

  const yearOptions = React.useMemo(() => {
    const years = new Set<number>();
    for (const job of data.jobs) {
      const date = job.findate || job.stdate;
      if (date) {
        const yr = dayjs(date).year();
        if (!isNaN(yr)) years.add(yr);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [data.jobs]);

  React.useEffect(() => {
    // Only run on client mount to prevent hydration mismatch
    setSelectedYear(dayjs().year());
    setSelectedMonth(dayjs().month() + 1);
  }, []);

  React.useEffect(() => {
    if (selectedYear === 'ALL' || selectedMonth === 'ALL') {
      return;
    }

    const start = dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
    let end = start.endOf('month');
    if (includeNextMonth) {
      end = start.add(1, 'month').endOf('month');
    }

    setStartDateFilter(start);
    setFinishDateFilter(end);
  }, [selectedYear, selectedMonth, includeNextMonth]);
  const isWorkCenterPending =
    selectedWorkCenter !== deferredWorkCenter ||
    startDateFilter !== deferredStartDate ||
    finishDateFilter !== deferredFinishDate ||
    lqFilter !== deferredLqFilter ||
    showOverdue !== deferredShowOverdue;
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const [selectedJobIds, setSelectedJobIds] = React.useState<Set<number>>(new Set());
  const [savingAll, setSavingAll] = React.useState(false);
  const [allChangesOpen, setAllChangesOpen] = React.useState(false);

  const selectedJobIdsRef = React.useRef(selectedJobIds);
  React.useEffect(() => {
    selectedJobIdsRef.current = selectedJobIds;
  }, [selectedJobIds]);

  const handleToggleSelect = React.useCallback((jobId: number) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAllGroup = React.useCallback((jobIds: number[], selectAll: boolean) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      for (const id of jobIds) {
        if (selectAll) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  const toggleGroupCollapse = React.useCallback((key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleSnackbarClose = React.useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleWorkCenterChange = React.useCallback((newWorkCenter: string) => {
    setSelectedWorkCenter(newWorkCenter);
    const targetJobs = newWorkCenter === 'ALL'
      ? jobs
      : jobs.filter((job) => job.arbpl === newWorkCenter);
    const newLqOptions = Array.from(new Set(targetJobs.map(getLacquerKey))).filter(Boolean);
    if (lqFilter && !newLqOptions.includes(lqFilter)) {
      React.startTransition(() => {
        setLqFilter(null);
      });
    }
  }, [jobs, lqFilter]);

  const draggingJobIdRef = React.useRef<number | null>(null);
  const dragOverRowRef = React.useRef<HTMLTableRowElement | null>(null);
  const dragOverRowRectRef = React.useRef<DOMRect | null>(null);
  const dragDropPositionRef = React.useRef<'before' | 'after'>('before');
  const dragAutoScrollFrameRef = React.useRef<number | null>(null);
  const dragAutoScrollPointerYRef = React.useRef<number | null>(null);
  const dragAutoScrollListenerRef = React.useRef<((event: DragEvent) => void) | null>(null);
  const dragWheelScrollListenerRef = React.useRef<((event: WheelEvent) => void) | null>(null);
  const dropConfirmTimerRef = React.useRef<number | null>(null);
  const dropConfirmRowRef = React.useRef<HTMLTableRowElement | null>(null);
  const dropConfirmFrameRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(false);
  const startDateKey = deferredStartDate?.format('YYYY-MM-DD') ?? '';
  const finishDateKey = deferredFinishDate?.format('YYYY-MM-DD') ?? '';

  React.useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (dropConfirmFrameRef.current !== null) {
        window.cancelAnimationFrame(dropConfirmFrameRef.current);
        dropConfirmFrameRef.current = null;
      }
      if (dropConfirmTimerRef.current) {
        window.clearTimeout(dropConfirmTimerRef.current);
        dropConfirmTimerRef.current = null;
      }
      dropConfirmRowRef.current?.classList.remove('drop-confirm-row', 'drop-confirm-before', 'drop-confirm-after');
      dropConfirmRowRef.current = null;
      if (dragAutoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(dragAutoScrollFrameRef.current);
        dragAutoScrollFrameRef.current = null;
      }
      if (dragAutoScrollListenerRef.current) {
        window.removeEventListener('dragover', dragAutoScrollListenerRef.current, true);
        document.removeEventListener('dragover', dragAutoScrollListenerRef.current, true);
        dragAutoScrollListenerRef.current = null;
      }
      if (dragWheelScrollListenerRef.current) {
        window.removeEventListener('wheel', dragWheelScrollListenerRef.current, true);
        document.removeEventListener('wheel', dragWheelScrollListenerRef.current, true);
        dragWheelScrollListenerRef.current = null;
      }
    };
  }, []);

  const lacquerCounts = React.useMemo(() => {
    const targetJobs = deferredWorkCenter === 'ALL'
      ? jobs
      : jobs.filter((job) => job.arbpl === deferredWorkCenter);
    const counts: Record<string, number> = {};
    for (const job of targetJobs) {
      const key = getLacquerKey(job);
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return counts;
  }, [jobs, deferredWorkCenter]);

  const lacquerOptions = React.useMemo(() => {
    return Object.keys(lacquerCounts).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
  }, [lacquerCounts]);

  const filteredJobs = React.useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    return jobs.filter((job) => {
      const jobStart = job.stdate || '';
      const jobFinish = job.findate || jobStart;

      if (deferredLqFilter && getLacquerKey(job) !== deferredLqFilter) return false;

      // Check if the job's finish date is in the past relative to the selected start date (or today if none selected)
      const thresholdDate = startDateKey || todayStr;
      const isOverdue = jobFinish < thresholdDate;

      if (isOverdue) {
        // If it is in the past:
        // 1. If we are not showing overdue jobs, hide it.
        if (!deferredShowOverdue) return false;
        // 2. If it is already DONE, hide it (not relevant for active scheduling).
        if (job.text1 === 'DONE') return false;
        // Otherwise, show it (bypassing start/finish range filters below)
      } else {
        // Normal date range checks for current/future jobs
        if (startDateKey && jobFinish < startDateKey) return false;
        if (finishDateKey && jobStart > finishDateKey) return false;
      }

      return true;
    });
  }, [finishDateKey, jobs, startDateKey, deferredLqFilter, deferredShowOverdue]);
  const lacquerColorMap = React.useMemo(() => {
    const lacquerKeys = Array.from(new Set(jobs.map(getLacquerKey))).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));

    const map = new Map<string, ReturnType<typeof createLacquerColor>>();
    lacquerKeys.forEach((key, index) => {
      const matchingJob = jobs.find((job) => getLacquerKey(job) === key);
      const group3 = matchingJob ? matchingJob.zpg3d : null;
      map.set(key, getLacquerColorByGroup3(group3, index));
    });
    return map;
  }, [jobs]);
  const groupedJobs = React.useMemo(() => groupByWorkCenter(filteredJobs), [filteredJobs]);
  const scopedJobs = React.useMemo(
    () =>
      deferredWorkCenter === 'ALL'
        ? filteredJobs
        : filteredJobs.filter((job) => job.arbpl === deferredWorkCenter),
    [filteredJobs, deferredWorkCenter],
  );
  const scopedGroups = React.useMemo(() => groupByWorkCenter(scopedJobs), [scopedJobs]);
  const totalChangeovers = React.useMemo(
    () => Object.values(scopedGroups).reduce((sum, group) => sum + calculateChangeovers(group), 0),
    [scopedGroups],
  );
  const visibleJobCount = scopedJobs.length;
  const selectedSummary = React.useMemo(
    () => sortedWorkCenters.find((item) => item.arbpl === selectedWorkCenter),
    [selectedWorkCenter, sortedWorkCenters],
  );
  const visibleWorkCenters = React.useMemo(
    () =>
      deferredWorkCenter === 'ALL'
        ? sortedWorkCenters
        : sortedWorkCenters.filter((item) => item.arbpl === deferredWorkCenter),
    [deferredWorkCenter, sortedWorkCenters],
  );
  const dirtyWorkCenters = React.useMemo(() => {
    const currentGroups = groupByWorkCenter(jobs);
    const initialGroups = groupByWorkCenter(initialJobs);
    const dirtyMap = new Map<string, boolean>();

    for (const item of sortedWorkCenters) {
      const workCenter = item.arbpl;
      const currentJobs = currentGroups[workCenter] ?? [];
      const initialJobsList = initialGroups[workCenter] ?? [];
      const isDirty =
        currentJobs.length !== initialJobsList.length ||
        currentJobs.some((job, index) => {
          const initJob = initialJobsList[index];
          return !initJob || job.id !== initJob.id || job.zpg1d !== initJob.zpg1d;
        });

      dirtyMap.set(workCenter, isDirty);
    }

    return dirtyMap;
  }, [initialJobs, jobs, sortedWorkCenters]);

  const dirtyList = React.useMemo(() => {
    return Array.from(dirtyWorkCenters.entries())
      .filter(([_, dirty]) => dirty)
      .map(([wc]) => wc);
  }, [dirtyWorkCenters]);

  const sequenceChanges = React.useMemo(
    () => buildSequenceChangeMap(initialJobs, jobs),
    [initialJobs, jobs],
  );
  const allChangedJobs = React.useMemo(
    () =>
      jobs
        .map((job) => {
          const change = sequenceChanges.get(job.id);
          return change ? { job, change } : null;
        })
        .filter((item): item is { job: PlanningJob; change: SequenceChange } => Boolean(item))
        .sort((a, b) => {
          const workCenterCompare = a.change.currentWorkCenter.localeCompare(b.change.currentWorkCenter, 'th', { numeric: true });
          if (workCenterCompare !== 0) return workCenterCompare;
          return a.change.currentSeq - b.change.currentSeq;
        }),
    [jobs, sequenceChanges],
  );

  const saveAllDirty = React.useCallback(async () => {
    if (dirtyList.length === 0) return;
    setSavingAll(true);
    setSnackbar({ open: false, message: '', severity: 'success' });

    const itemsToSave: Array<{ id: number; seqno: number; zpg1d: string | null }> = [];

    for (const wc of dirtyList) {
      const wcJobs = jobs.filter((j) => j.arbpl === wc);
      wcJobs.forEach((job, index) => {
        itemsToSave.push({
          id: job.id,
          seqno: index + 1,
          zpg1d: job.zpg1d,
        });
      });
    }

    try {
      const response = await fetch('/api/jobs/resequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave }),
      });

      if (!isMountedRef.current) return;
      setSavingAll(false);

      if (!response.ok) {
        setSnackbar({
          open: true,
          message: `บันทึกลำดับคิวล้มเหลว`,
          severity: 'error',
        });
        return;
      }

      setInitialJobs(jobs);
      setSelectedJobIds(new Set());
      setSnackbar({
        open: true,
        message: `บันทึกลำดับคิวทั้งหมดลงฐานข้อมูลสำเร็จ (${dirtyList.join(', ')})`,
        severity: 'success',
      });
    } catch (err) {
      if (isMountedRef.current) {
        setSavingAll(false);
        setSnackbar({
          open: true,
          message: `เกิดข้อผิดพลาดในการบันทึก: ${err instanceof Error ? err.message : String(err)}`,
          severity: 'error',
        });
      }
    }
  }, [dirtyList, jobs]);
  const filteredTotals = React.useMemo(
    () => ({
      jobs: filteredJobs.length,
      waitJobs: filteredJobs.filter((job) => job.text1?.toUpperCase() === 'WAIT').length,
      optime: Number(filteredJobs.reduce((sum, job) => sum + job.optime, 0).toFixed(1)),
      quantity: filteredJobs.reduce((sum, job) => sum + job.mgvrg, 0),
    }),
    [filteredJobs],
  );
  const scopedTotals = React.useMemo(
    () => ({
      jobs: scopedJobs.length,
      waitJobs: scopedJobs.filter((job) => job.text1?.toUpperCase() === 'WAIT').length,
      optime: Number(scopedJobs.reduce((sum, job) => sum + job.optime, 0).toFixed(1)),
      quantity: scopedJobs.reduce((sum, job) => sum + job.mgvrg, 0),
    }),
    [scopedJobs],
  );
  const scopedDailyLoads = React.useMemo(() => {
    const byDay = new Map<string, { date: string; arbpl: string; jobs: number; waitJobs: number; optime: number; mgvrg: number }>();

    for (const job of scopedJobs) {
      const date = job.stdate || 'ไม่ระบุวันที่';
      const key = `${date}|${job.arbpl}`;
      const current =
        byDay.get(key) ??
        {
          date,
          arbpl: job.arbpl,
          jobs: 0,
          waitJobs: 0,
          optime: 0,
          mgvrg: 0,
        };

      current.jobs += 1;
      current.waitJobs += job.text1?.toUpperCase() === 'WAIT' ? 1 : 0;
      current.optime += job.optime;
      current.mgvrg += job.mgvrg;
      byDay.set(key, current);
    }

    return Array.from(byDay.values())
      .map((item) => ({ ...item, optime: Number(item.optime.toFixed(1)) }))
      .sort((a, b) => b.optime - a.optime)
      .slice(0, 8);
  }, [scopedJobs]);
  const metricScopeLabel = selectedWorkCenter === 'ALL' ? 'รวมทุก Work center' : `Work center ${selectedWorkCenter}`;

  const showDropConfirmation = React.useCallback((jobIds: number | number[], placement: 'before' | 'after') => {
    const clearDropConfirmation = () => {
      document.querySelectorAll('.drop-confirm-row').forEach(row => {
        row.classList.remove('drop-confirm-row', 'drop-confirm-before', 'drop-confirm-after');
      });
    };

    clearDropConfirmation();

    if (dropConfirmTimerRef.current) {
      window.clearTimeout(dropConfirmTimerRef.current);
      dropConfirmTimerRef.current = null;
    }

    if (dropConfirmFrameRef.current !== null) {
      window.cancelAnimationFrame(dropConfirmFrameRef.current);
    }

    dropConfirmFrameRef.current = window.requestAnimationFrame(() => {
      dropConfirmFrameRef.current = null;
      const ids = Array.isArray(jobIds) ? jobIds : [jobIds];
      const rows: HTMLTableRowElement[] = [];

      ids.forEach(id => {
        const row = document.querySelector<HTMLTableRowElement>(`tr[data-job-id="${id}"]`);
        if (row) {
          row.classList.add('drop-confirm-row', placement === 'after' ? 'drop-confirm-after' : 'drop-confirm-before');
          rows.push(row);
        }
      });

      if (rows.length > 0) {
        dropConfirmTimerRef.current = window.setTimeout(() => {
          clearDropConfirmation();
          dropConfirmTimerRef.current = null;
        }, 1100);
      }
    });
  }, []);

  const reorderJob = React.useCallback((
    workCenter: string,
    draggedJobIds: number[],
    targetJobId: number,
    position: 'before' | 'after'
  ) => {
    if (draggedJobIds.includes(targetJobId)) return;

    let reordered = false;

    setJobs((current) => {
      const targetJobObj = current.find((j) => j.id === targetJobId);
      if (!targetJobObj) return current;

      const draggedJobs = current.filter((j) => draggedJobIds.includes(j.id));
      if (draggedJobs.length === 0) return current;

      const next = current.map((job) => {
        if (draggedJobIds.includes(job.id)) {
          return { ...job, zpg1d: targetJobObj.zpg1d };
        }
        return job;
      });

      const workCenterIndexes = next
        .map((job, index) => ({ job, index }))
        .filter((item) => item.job.arbpl === workCenter);

      const targetLocalIndex = workCenterIndexes.findIndex((item) => item.job.id === targetJobId);
      if (targetLocalIndex < 0) return current;

      const wcJobs = workCenterIndexes.map(item => item.job);
      const filteredWcJobs = wcJobs.filter(job => !draggedJobIds.includes(job.id));

      const newTargetIndex = filteredWcJobs.findIndex(job => job.id === targetJobId);
      if (newTargetIndex < 0) return current;

      const insertIndex = newTargetIndex + (position === 'after' ? 1 : 0);

      const orderedDraggedJobs = [...draggedJobs].map(job => {
        return { ...job, zpg1d: targetJobObj.zpg1d, arbpl: workCenter };
      }).sort((a, b) => {
        return current.findIndex(j => j.id === a.id) - current.findIndex(j => j.id === b.id);
      });

      filteredWcJobs.splice(insertIndex, 0, ...orderedDraggedJobs);

      const withoutDragged = next.filter(job => !draggedJobIds.includes(job.id));
      const firstWcIndex = withoutDragged.findIndex(job => job.arbpl === workCenter);
      const withoutWcJobs = withoutDragged.filter(job => job.arbpl !== workCenter);

      const newJobsList: typeof current = [];
      if (firstWcIndex >= 0) {
        newJobsList.push(...withoutWcJobs.slice(0, firstWcIndex));
        newJobsList.push(...filteredWcJobs);
        newJobsList.push(...withoutWcJobs.slice(firstWcIndex));
      } else {
        newJobsList.push(...withoutWcJobs);
        newJobsList.push(...filteredWcJobs);
      }

      reordered = true;
      return newJobsList;
    });

    if (reordered) {
      setSnackbar((prev) => (prev.open ? { ...prev, open: false } : prev));
      showDropConfirmation(draggedJobIds, position);
    }
  }, [showDropConfirmation]);

  const moveJobOneStep = React.useCallback((
    workCenter: string,
    jobId: number,
    direction: 'up' | 'down',
  ) => {
    let moved = false;
    let targetIds: number[] = [];

    setSnackbar((prev) => (prev.open ? { ...prev, open: false } : prev));
    setJobs((current) => {
      const workCenterJobs = current.filter((job) => job.arbpl === workCenter);
      
      if (selectedJobIdsRef.current.has(jobId)) {
        targetIds = Array.from(selectedJobIdsRef.current);
      } else {
        targetIds = [jobId];
      }

      const targetIndices = targetIds
        .map(id => workCenterJobs.findIndex(j => j.id === id))
        .filter(idx => idx >= 0)
        .sort((a, b) => a - b);

      if (targetIndices.length === 0) return current;

      const firstIdx = targetIndices[0];
      const lastIdx = targetIndices[targetIndices.length - 1];

      if (direction === 'up') {
        if (firstIdx === 0) return current;
        
        const targetJobs = targetIndices.map(idx => ({ ...workCenterJobs[idx] }));
        const remainingJobs = workCenterJobs.filter(job => !targetIds.includes(job.id));
        
        remainingJobs.splice(firstIdx - 1, 0, ...targetJobs);
        
        const neighborJob = remainingJobs[firstIdx];
        if (neighborJob) {
          targetJobs.forEach(job => {
            job.zpg1d = neighborJob.zpg1d;
          });
        }

        const queue = [...remainingJobs];
        moved = true;
        return current.map((job) => (job.arbpl === workCenter ? queue.shift() ?? job : job));
      } else {
        if (lastIdx === workCenterJobs.length - 1) return current;

        const targetJobs = targetIndices.map(idx => ({ ...workCenterJobs[idx] }));
        const itemBelow = workCenterJobs[lastIdx + 1];
        const remainingJobs = workCenterJobs.filter(job => !targetIds.includes(job.id));
        
        const itemBelowIndex = remainingJobs.findIndex(job => job.id === itemBelow.id);
        if (itemBelowIndex < 0) return current;

        remainingJobs.splice(itemBelowIndex + 1, 0, ...targetJobs);

        targetJobs.forEach(job => {
          job.zpg1d = itemBelow.zpg1d;
        });

        const queue = [...remainingJobs];
        moved = true;
        return current.map((job) => (job.arbpl === workCenter ? queue.shift() ?? job : job));
      }
    });

    if (moved && targetIds.length > 0) {
      showDropConfirmation(targetIds, direction === 'up' ? 'before' : 'after');
    }
  }, [showDropConfirmation]);

  const autoArrange = React.useCallback((workCenter?: string, scopedJobIds?: number[]) => {
    setSnackbar((prev) => ({ ...prev, open: false }));
    setJobs((current) => {
      if (!workCenter) {
        const grouped = groupByWorkCenter(current);
        return Object.keys(grouped)
          .sort()
          .flatMap((key) => sortJobsWithZpg1dGroups(grouped[key]));
      }

      const targetJobs = current.filter((job) => job.arbpl === workCenter && (!scopedJobIds || scopedJobIds.includes(job.id)));
      const sortedGroup = sortJobsWithZpg1dGroups(targetJobs);
      const queue = [...sortedGroup];
      return current.map((job) =>
        job.arbpl === workCenter && (!scopedJobIds || scopedJobIds.includes(job.id)) ? queue.shift() ?? job : job,
      );
    });
  }, []);

  const saveSequence = React.useCallback(async (workCenter: string) => {
    setSavingWorkCenter(workCenter);
    setSnackbar((prev) => ({ ...prev, open: false }));

    const workCenterJobs = jobs.filter((job) => job.arbpl === workCenter);
    const items = workCenterJobs.map((job, index) => ({
      id: job.id,
      seqno: index + 1,
      zpg1d: job.zpg1d,
    }));

    const response = await fetch('/api/jobs/resequence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!isMountedRef.current) return;

    setSavingWorkCenter(null);

    if (!response.ok) {
      setSnackbar({
        open: true,
        message: `บันทึกลำดับของ ${workCenter} ไม่สำเร็จ`,
        severity: 'error',
      });
      return;
    }

    setInitialJobs((prev) => {
      const otherJobs = prev.filter((job) => job.arbpl !== workCenter);
      const updatedJobs = workCenterJobs.map((job, index) => ({
        ...job,
        seqno: index + 1,
      }));
      return [...otherJobs, ...updatedJobs];
    });
    setSelectedJobIds(new Set());

    setSnackbar({
      open: true,
      message: `บันทึกลำดับของ ${workCenter} ลงฐานข้อมูลแล้ว`,
      severity: 'success',
    });
  }, [jobs]);

  const clearDragClasses = React.useCallback(() => {
    dragOverRowRef.current?.classList.remove('drop-target-row', 'drop-before-row', 'drop-after-row');
    dragOverRowRef.current?.removeAttribute('data-drop-label');
    dragOverRowRef.current = null;
    dragOverRowRectRef.current = null;
  }, []);

  const runDragAutoScroll = React.useCallback(function tickDragAutoScroll() {
    const pointerY = dragAutoScrollPointerYRef.current;
    const scrollElement = document.scrollingElement ?? document.documentElement;

    if (pointerY !== null && scrollElement) {
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const maxScrollTop = scrollElement.scrollHeight - viewportHeight;
      const topDistance = pointerY;
      const bottomDistance = viewportHeight - pointerY;
      let scrollDelta = 0;

      if (topDistance < dragAutoScrollEdgePx && scrollTop > 0) {
        const intensity = (dragAutoScrollEdgePx - topDistance) / dragAutoScrollEdgePx;
        scrollDelta = -Math.ceil(intensity * dragAutoScrollMaxSpeed);
      } else if (bottomDistance < dragAutoScrollEdgePx && scrollTop < maxScrollTop) {
        const intensity = (dragAutoScrollEdgePx - bottomDistance) / dragAutoScrollEdgePx;
        scrollDelta = Math.ceil(intensity * dragAutoScrollMaxSpeed);
      }

      if (scrollDelta !== 0) {
        scrollElement.scrollTop += scrollDelta;
      }
    }

    dragAutoScrollFrameRef.current = window.requestAnimationFrame(tickDragAutoScroll);
  }, []);

  const startDragAutoScroll = React.useCallback((event: React.DragEvent<HTMLTableRowElement>) => {
    dragAutoScrollPointerYRef.current = event.clientY;

    if (!dragAutoScrollListenerRef.current) {
      dragAutoScrollListenerRef.current = (dragEvent: DragEvent) => {
        dragAutoScrollPointerYRef.current = dragEvent.clientY;
      };
      window.addEventListener('dragover', dragAutoScrollListenerRef.current, { capture: true });
      document.addEventListener('dragover', dragAutoScrollListenerRef.current, { capture: true });
    }

    if (!dragWheelScrollListenerRef.current) {
      dragWheelScrollListenerRef.current = (wheelEvent: WheelEvent) => {
        if (draggingJobIdRef.current === null) return;
        const scrollElement = document.scrollingElement ?? document.documentElement;
        wheelEvent.preventDefault();
        scrollElement.scrollTop += wheelEvent.deltaY * dragWheelScrollMultiplier;
        scrollElement.scrollLeft += wheelEvent.deltaX;
      };
      window.addEventListener('wheel', dragWheelScrollListenerRef.current, { capture: true, passive: false });
      document.addEventListener('wheel', dragWheelScrollListenerRef.current, { capture: true, passive: false });
    }

    if (dragAutoScrollFrameRef.current === null) {
      dragAutoScrollFrameRef.current = window.requestAnimationFrame(runDragAutoScroll);
    }
  }, [runDragAutoScroll]);

  const stopDragAutoScroll = React.useCallback(() => {
    dragAutoScrollPointerYRef.current = null;

    if (dragAutoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(dragAutoScrollFrameRef.current);
      dragAutoScrollFrameRef.current = null;
    }

    if (dragAutoScrollListenerRef.current) {
      window.removeEventListener('dragover', dragAutoScrollListenerRef.current, true);
      document.removeEventListener('dragover', dragAutoScrollListenerRef.current, true);
      dragAutoScrollListenerRef.current = null;
    }

    if (dragWheelScrollListenerRef.current) {
      window.removeEventListener('wheel', dragWheelScrollListenerRef.current, true);
      document.removeEventListener('wheel', dragWheelScrollListenerRef.current, true);
      dragWheelScrollListenerRef.current = null;
    }
  }, []);

  const handleDragStart = React.useCallback((event: React.DragEvent<HTMLTableRowElement>, jobId: number) => {
    event.currentTarget.classList.add('dragging-row');
    event.dataTransfer.effectAllowed = 'move';
    draggingJobIdRef.current = jobId;
    startDragAutoScroll(event);

    let idsToDrag = [jobId];
    setSelectedJobIds((prev) => {
      if (prev.has(jobId)) {
        idsToDrag = Array.from(prev);
        return prev;
      } else {
        idsToDrag = [jobId];
        return new Set([jobId]);
      }
    });

    event.dataTransfer.setData('text/plain', idsToDrag.join(','));
    // Highlight all dragging rows in the DOM
    idsToDrag.forEach(id => {
      const row = document.querySelector(`tr[data-job-id="${id}"]`);
      if (row) row.classList.add('dragging-row');
    });
  }, [startDragAutoScroll]);

  const handleDrag = React.useCallback((event: React.DragEvent<HTMLTableRowElement>) => {
    if (event.clientY > 0) {
      dragAutoScrollPointerYRef.current = event.clientY;
    }
  }, []);

  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLTableRowElement>, jobId: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    dragAutoScrollPointerYRef.current = event.clientY;

    if (draggingJobIdRef.current === jobId) return;

    let rect = dragOverRowRectRef.current;
    if (dragOverRowRef.current !== event.currentTarget) {
      rect = event.currentTarget.getBoundingClientRect();
      dragOverRowRectRef.current = rect;
    }

    if (!rect) return;

    const position = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
    const positionClass = position === 'after' ? 'drop-after-row' : 'drop-before-row';

    if (
      dragOverRowRef.current !== event.currentTarget ||
      dragDropPositionRef.current !== position
    ) {
      clearDragClasses();
      event.currentTarget.classList.add('drop-target-row', positionClass);
      dragOverRowRef.current = event.currentTarget;
      dragDropPositionRef.current = position;
    }
  }, [clearDragClasses]);

  const handleDragLeave = React.useCallback((event: React.DragEvent<HTMLTableRowElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      event.currentTarget.classList.remove('drop-target-row', 'drop-before-row', 'drop-after-row');
      event.currentTarget.removeAttribute('data-drop-label');
      if (dragOverRowRef.current === event.currentTarget) {
        dragOverRowRef.current = null;
      }
    }
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent<HTMLTableRowElement>, targetJobId: number, workCenter: string) => {
    event.preventDefault();
    const dataStr = event.dataTransfer.getData('text/plain');
    let draggedIds = (dataStr || '')
      .split(',')
      .map(Number)
      .filter(Number.isFinite);

    if (draggedIds.length === 0 && draggingJobIdRef.current !== null) {
      draggedIds = [draggingJobIdRef.current];
    }

    if (draggedIds.length > 0) {
      reorderJob(workCenter, draggedIds, targetJobId, dragDropPositionRef.current);
    }
    event.currentTarget.classList.remove('drop-target-row', 'drop-before-row', 'drop-after-row');
    event.currentTarget.removeAttribute('data-drop-label');
    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
  }, [reorderJob, clearDragClasses, stopDragAutoScroll]);

  const handleDragEnd = React.useCallback((event: React.DragEvent<HTMLTableRowElement>) => {
    event.currentTarget.classList.remove('dragging-row');
    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    document.querySelectorAll('.dragging-row').forEach(row => {
      row.classList.remove('dragging-row');
    });
  }, [clearDragClasses, stopDragAutoScroll]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', py: 4 }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'flex-start', lg: 'center' }, justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1.5,
                      bgcolor: 'primary.main',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Category size="22" color="#ffffff" variant="Bold" />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 850 }}>
                      PSC Planing
                    </Typography>

                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', lg: 'auto' } }}>
                  <Button
                    component={Link}
                    href="/guide"
                    size="small"
                    variant="text"
                    startIcon={<Book size="17" color="#475569" />}
                    sx={{ color: 'text.secondary', px: 1.5 }}
                  >
                    คู่มือการใช้งาน
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Refresh size="17" color="#475569" />}
                    onClick={() => autoArrange()}
                    sx={{ color: 'text.secondary', px: 1.5 }}
                  >
                    จัดเรียงทั้งหมด
                  </Button>
                  <Button
                    component={Link}
                    href="/upload"
                    size="small"
                    variant="text"
                    startIcon={<Data size="17" color="#475569" />}
                    sx={{ color: 'text.secondary', px: 1.5 }}
                  >
                    Upload Excel
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '320px 1fr' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              {/* Left Column - Sticky Filters */}
              <Box
                sx={{
                  position: { xs: 'static', lg: 'sticky' },
                  top: { lg: 24 },
                  zIndex: { lg: 100 },
                }}
              >

                {/* Card 1: Filters */}
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850 }}>
                      ตัวกรองข้อมูล (Filters)
                    </Typography>

                    {/* Year/Month Select Filters */}
                    <Stack direction="row" spacing={1}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="year-filter-label">ปีแผนงาน (พ.ศ.)</InputLabel>
                        <Select
                          labelId="year-filter-label"
                          id="year-filter"
                          value={selectedYear}
                          label="ปีแผนงาน (พ.ศ.)"
                          onChange={(e) => setSelectedYear(e.target.value as number | 'ALL')}
                        >
                          <MenuItem value="ALL">ทั้งหมด</MenuItem>
                          {yearOptions.map((yr) => (
                            <MenuItem key={yr} value={yr}>
                              {yr + 543}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="month-filter-label">เดือน</InputLabel>
                        <Select
                          labelId="month-filter-label"
                          id="month-filter"
                          value={selectedMonth}
                          label="เดือน"
                          onChange={(e) => setSelectedMonth(e.target.value as number | 'ALL')}
                        >
                          <MenuItem value="ALL">ทั้งหมด</MenuItem>
                          {THAI_MONTHS.map((m) => (
                            <MenuItem key={m.value} value={m.value}>
                              {m.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>

                    <Stack spacing={0.25} sx={{ mt: -0.5 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={includeNextMonth}
                            onChange={(e) => setIncludeNextMonth(e.target.checked)}
                            disabled={selectedYear === 'ALL' || selectedMonth === 'ALL'}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                            รวมแผนงานของเดือนถัดไป
                          </Typography>
                        }
                        sx={{ my: -0.25 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={showOverdue}
                            onChange={(e) => setShowOverdue(e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                            แสดงงานค้างส่งในอดีต (Overdue)
                          </Typography>
                        }
                        sx={{ my: -0.25 }}
                      />
                    </Stack>

                    <Divider sx={{ my: 0.5 }} />

                    <DatePicker
                      label="เริ่มวันที่"
                      value={startDateFilter}
                      format="DD/MM/YYYY"
                      maxDate={finishDateFilter ?? undefined}
                      onChange={(value) => {
                        setStartDateFilter(value);
                        setSelectedYear('ALL');
                        setSelectedMonth('ALL');
                      }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker
                      label="ถึงวันที่"
                      value={finishDateFilter}
                      format="DD/MM/YYYY"
                      minDate={startDateFilter ?? undefined}
                      onChange={(value) => {
                        setFinishDateFilter(value);
                        setSelectedYear('ALL');
                        setSelectedMonth('ALL');
                      }}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <Autocomplete
                      size="small"
                      options={lacquerOptions}
                      value={lqFilter}
                      onChange={(_event, newValue) => setLqFilter(newValue)}
                      renderInput={(params) => <TextField {...params} label="L/Q (Lacquer)" />}
                      renderOption={(props, option) => {
                        const count = lacquerCounts[option] || 0;
                        const { key, ...optionProps } = props;
                        return (
                          <Box
                            component="li"
                            key={key}
                            {...optionProps}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              width: '100%',
                              py: '4px !important',
                            }}
                          >
                            <Typography variant="body2" sx={{ fontSize: '0.825rem' }}>
                              {option}
                            </Typography>
                            <Chip
                              size="small"
                              label={`${count} งาน`}
                              sx={{
                                height: 18,
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(15, 23, 42, 0.06)',
                                color: 'text.secondary',
                                ml: 1.5,
                              }}
                            />
                          </Box>
                        );
                      }}
                      sx={{ width: '100%' }}
                    />
                    <Divider />
                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        disabled={
                          !startDateFilter &&
                          !finishDateFilter &&
                          !lqFilter &&
                          selectedWorkCenter === defaultWorkCenter &&
                          selectedYear === 'ALL' &&
                          selectedMonth === 'ALL' &&
                          !showOverdue
                        }
                        onClick={() => {
                          setStartDateFilter(null);
                          setFinishDateFilter(null);
                          setLqFilter(null);
                          setSelectedWorkCenter(defaultWorkCenter);
                          setSelectedYear('ALL');
                          setSelectedMonth('ALL');
                          setIncludeNextMonth(false);
                          setShowOverdue(false);
                        }}
                      >
                        ล้างตัวกรอง
                      </Button>
                      {isWorkCenterPending ? (
                        <Skeleton variant="text" width={150} height={20} sx={{ mx: 'auto' }} />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                          แสดง {formatNumber(visibleJobCount)} จาก {formatNumber(jobs.length)} งาน
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </Box>

              {/* Right Column - Scrollable Content */}
              <Stack spacing={3}>
                {/* Status Metrics Paper */}
                <Paper sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
                          สถานะงานตามขอบเขตที่เลือก
                        </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {metricScopeLabel} หลังกรองข้อมูล
                      </Typography>
                    </Box>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`แสดง ${formatNumber(scopedTotals.jobs)} / ${formatNumber(filteredTotals.jobs)} งานในช่วงวันที่`}
                        sx={{ opacity: isWorkCenterPending ? 0.65 : 1, transition: 'opacity 150ms ease-in-out' }}
                      />
                    </Stack>

                    <Box
                      sx={{
                        opacity: isWorkCenterPending ? 0.65 : 1,
                        pointerEvents: isWorkCenterPending ? 'none' : 'auto',
                        transition: 'opacity 150ms ease-in-out',
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
                        gap: 1.5,
                      }}
                    >
                      {[
                        { label: 'งานทั้งหมด', value: formatNumber(scopedTotals.jobs), icon: <TaskSquare size="22" color="#4f46e5" />, accent: '#4f46e5' },
                        { label: 'สถานะ WAIT', value: formatNumber(scopedTotals.waitJobs), icon: <Clock size="22" color="#d97706" />, accent: '#d97706' },
                        { label: 'ชั่วโมงผลิต', value: formatNumber(scopedTotals.optime), icon: <StatusUp size="22" color="#0891b2" />, accent: '#0891b2' },
                        { label: 'จำนวนผลิต', value: formatNumber(scopedTotals.quantity), icon: <Data size="22" color="#059669" />, accent: '#059669' },
                        { label: 'เปลี่ยน L/Q', value: `${formatNumber(totalChangeovers)} ครั้ง`, icon: <Setting2 size="22" color="#dc2626" />, accent: '#dc2626' },
                      ].map((metric) => (
                        <Paper
                          key={metric.label}
                          variant="outlined"
                          sx={{
                            p: 1.75,
                            borderRadius: 1.5,
                            borderColor: 'rgba(15, 23, 42, 0.08)',
                            boxShadow: 'none',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              inset: '0 auto 0 0',
                              width: 4,
                              bgcolor: metric.accent,
                            },
                          }}
                        >
                          <Stack spacing={1}>
                            <Box>{metric.icon}</Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>
                              {metric.label}
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                              {metric.value}
                            </Typography>
                          </Stack>
                        </Paper>
                      ))}
                    </Box>
                  </Stack>
                </Paper>

                {data.totals.jobs === 0 && (
                  <Alert severity="warning">
                    ยังไม่มีข้อมูลในฐานข้อมูล ให้รัน `npm run db:push` แล้วตามด้วย `npm run db:seed`
                  </Alert>
                )}

                {/* Load Summaries */}
                <Box
                  sx={{
                    opacity: isWorkCenterPending ? 0.65 : 1,
                    pointerEvents: isWorkCenterPending ? 'none' : 'auto',
                    transition: 'opacity 150ms ease-in-out',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', lg: '1.25fr 0.75fr' },
                    gap: 2,
                  }}
                >
                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 1 }}>
                      โหลดงานตาม Work center
                    </Typography>
                    <Stack spacing={1.5}>
                      {sortedWorkCenters.map((item) => {
                        const filteredGroup = groupedJobs[item.arbpl] ?? [];
                        const percent = filteredTotals.jobs > 0 ? (filteredGroup.length / filteredTotals.jobs) * 100 : 0;
                        return (
                          <Box key={item.arbpl}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 750 }}>
                                {item.arbpl}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {formatNumber(filteredGroup.length)} งาน
                              </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={Math.min(percent, 100)} sx={{ height: 8, borderRadius: 999 }} />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Paper>

                  <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 850, mb: 1 }}>
                      วันที่โหลดสูงในขอบเขตที่เลือก
                    </Typography>
                    <Stack spacing={1}>
                      {scopedDailyLoads.map((item) => (
                        <Stack key={`${item.date}-${item.arbpl}`} direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 750 }}>
                              {formatDate(item.date)} / {item.arbpl}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatNumber(item.jobs)} งาน, WAIT {formatNumber(item.waitJobs)}
                            </Typography>
                          </Box>
                          <Chip size="small" label={`${formatNumber(item.optime)} ชม.`} />
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                </Box>
              </Stack>
            </Box>

            {/* Work Center Card Selector Row (Full Width, above tables) */}
            <Stack
              direction="row"
              spacing={2}
              sx={{
                overflowX: 'auto',
                pb: 1.5,
                width: '100%',
                scrollSnapType: 'x mandatory',
                '&::-webkit-scrollbar': {
                  height: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: 'rgba(15, 23, 42, 0.1)',
                  borderRadius: 4,
                },
                mb: 1,
              }}
            >
              {/* "ดูทั้งหมด" Card */}
              {(() => {
                const isSelected = selectedWorkCenter === 'ALL';
                const totalHours = filteredJobs.reduce((sum, job) => sum + Number(job.optime || 0), 0);
                return (
                  <Button
                    onClick={() => handleWorkCenterChange('ALL')}
                    sx={{
                      flex: '0 0 auto',
                      minWidth: 160,
                      p: 2,
                      borderRadius: 2,
                      textAlign: 'left',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: '1px solid',
                      borderColor: isSelected ? '#b45309' : 'rgba(15, 23, 42, 0.08)',
                      bgcolor: isSelected ? 'rgba(180, 83, 9, 0.04)' : 'background.paper',
                      boxShadow: isSelected ? '0 4px 12px rgba(180, 83, 9, 0.08)' : 'none',
                      color: isSelected ? '#b45309' : 'text.primary',
                      textTransform: 'none',
                      transition: 'all 200ms ease',
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(180, 83, 9, 0.1)' : 'rgba(15, 23, 42, 0.03)',
                        borderColor: isSelected ? '#b45309' : 'rgba(15, 23, 42, 0.16)',
                      },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 0.5 }}>
                      ภาพรวมเครื่องจักร
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 900, mb: 1, color: isSelected ? '#b45309' : 'text.primary' }}>
                      ดูทั้งหมด
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={`${filteredJobs.length} งาน`}
                        sx={{
                          height: 18,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: isSelected ? '#b45309' : 'rgba(15, 23, 42, 0.08)',
                          color: isSelected ? '#ffffff' : 'text.secondary',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        {totalHours.toFixed(1)} ชม.
                      </Typography>
                    </Stack>
                  </Button>
                );
              })()}

              {sortedWorkCenters.map((item) => {
                const isSelected = selectedWorkCenter === item.arbpl;
                const filteredGroup = groupedJobs[item.arbpl] ?? [];
                const hours = filteredGroup.reduce((sum, job) => sum + Number(job.optime || 0), 0);
                return (
                  <Button
                    key={item.arbpl}
                    onClick={() => handleWorkCenterChange(item.arbpl)}
                    sx={{
                      flex: '0 0 auto',
                      minWidth: 160,
                      p: 2,
                      borderRadius: 2,
                      textAlign: 'left',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'rgba(15, 23, 42, 0.08)',
                      bgcolor: isSelected ? 'rgba(79, 70, 229, 0.04)' : 'background.paper',
                      boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.08)' : 'none',
                      color: isSelected ? 'primary.main' : 'text.primary',
                      textTransform: 'none',
                      transition: 'all 200ms ease',
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'rgba(15, 23, 42, 0.03)',
                        borderColor: isSelected ? 'primary.main' : 'rgba(15, 23, 42, 0.16)',
                      },
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', mb: 0.5 }}>
                      เครื่องจักร
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 900, mb: 1, color: isSelected ? 'primary.main' : 'text.primary' }}>
                      {item.arbpl}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={`${filteredGroup.length} งาน`}
                        sx={{
                          height: 18,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          bgcolor: isSelected ? 'primary.main' : 'rgba(15, 23, 42, 0.08)',
                          color: isSelected ? '#ffffff' : 'text.secondary',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                        {hours.toFixed(1)} ชม.
                      </Typography>
                    </Stack>
                  </Button>
                );
              })}
            </Stack>

            <Stack
              spacing={2}
              sx={{
                opacity: isWorkCenterPending ? 0.55 : 1,
                pointerEvents: isWorkCenterPending ? 'none' : 'auto',
                transition: 'all 180ms ease-in-out',
              }}
            >
              {isWorkCenterPending && (
                <LinearProgress sx={{ height: 4, borderRadius: 2, mb: 1 }} />
              )}
              {visibleWorkCenters.map((item) => {
                const workCenter = item.arbpl;
                const group = groupedJobs[workCenter];
                if (!group) return null;

                return (
                  <Box key={workCenter}>
                    <WorkCenterCard
                      workCenter={workCenter}
                      group={group}
                      isDirty={dirtyWorkCenters.get(workCenter) ?? false}
                      isSaving={savingWorkCenter === workCenter}
                      lacquerColorMap={lacquerColorMap}
                      collapsedGroups={collapsedGroups}
                      selectedJobIds={selectedJobIds}
                      sequenceChanges={sequenceChanges}
                      onToggleSelect={handleToggleSelect}
                      onToggleSelectAllGroup={handleToggleSelectAllGroup}
                      onAutoArrange={autoArrange}
                      onSave={saveSequence}
                      onToggleCollapse={toggleGroupCollapse}
                      onDragStart={handleDragStart}
                      onDrag={handleDrag}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      onMoveJobOneStep={moveJobOneStep}
                    />
                  </Box>
                );
              })}
            </Stack>

            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
              แสดง {formatNumber(visibleJobCount)} แถว / อัปเดตข้อมูลหน้าเว็บ {new Date(data.generatedAt).toLocaleString('th-TH')}
            </Typography>
          </Stack>
        </Container>

        {/* Floating Save Balloon */}
        {dirtyList.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 1100,
              animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '@keyframes slideUp': {
                '0%': { transform: 'translateY(100px) scale(0.9)', opacity: 0 },
                '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
              },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: '10px 12px 10px 20px',
                borderRadius: '999px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'rgba(79, 70, 229, 0.15)',
                boxShadow: '0 20px 40px rgba(79, 70, 229, 0.12), 0 8px 16px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                backdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 0 rgba(79, 70, 229, 0.4)',
                    animation: 'pulse 2s infinite ease-in-out',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(79, 70, 229, 0.5)' },
                      '70%': { transform: 'scale(1)', boxShadow: '0 0 0 8px rgba(79, 70, 229, 0)' },
                      '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(79, 70, 229, 0)' },
                    },
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.875rem', letterSpacing: '-0.01em' }}>
                  พบการจัดคิวใหม่
                </Typography>
              </Box>
              <Tooltip title="ดูการเปลี่ยนแปลงทั้งหมด" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={allChangedJobs.length === 0}
                    onClick={() => setAllChangesOpen(true)}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '1px solid rgba(245, 158, 11, 0.32)',
                      bgcolor: 'rgba(245, 158, 11, 0.1)',
                      color: '#92400e',
                      '&:hover': {
                        bgcolor: 'rgba(245, 158, 11, 0.18)',
                      },
                      '&.Mui-disabled': {
                        borderColor: 'rgba(15, 23, 42, 0.08)',
                        bgcolor: 'rgba(15, 23, 42, 0.04)',
                      },
                    }}
                  >
                    <TaskSquare size="18" color="currentColor" variant="Bold" />
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="contained"
                disabled={savingAll}
                onClick={saveAllDirty}
                sx={{
                  borderRadius: '999px',
                  fontWeight: 850,
                  px: 3,
                  py: 1,
                  fontSize: '0.825rem',
                  bgcolor: 'primary.main',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {savingAll ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
              </Button>
            </Paper>
          </Box>
        )}
      </Box>
      <SequenceChangesDialog
        open={allChangesOpen}
        onClose={() => setAllChangesOpen(false)}
        changes={allChangedJobs}
        title="การเปลี่ยนแปลงทั้งหมด"
        description="รายการที่จะถูกบันทึกเมื่อกดบันทึกทั้งหมด"
        showWorkCenter
      />
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </LocalizationProvider>
  );
}
