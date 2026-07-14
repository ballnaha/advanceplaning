'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import NotificationSnackbar from './NotificationSnackbar';
import WorkCenterCard from './WorkCenterCard';
import RoutingBoard from './RoutingBoard';
import RoutingMatrix from './RoutingMatrix';
import PlanningActionButtons from './PlanningActionButtons';
import PlanningActionBar from './PlanningActionBar';
import type { SequenceChange } from './PlanningGroupTable';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
  Setting2,
  StatusUp,
  TaskSquare,
} from 'iconsax-react';
import { getJobGroupId, getJobGroupSortOrder, getQueueGroupId, getQueueGroupSortOrder, cleanZpg2d, sortJobsWithZpg3dTransition } from '@/lib/zpg1d-helpers';
import type { PlanningDashboardData, PlanningJob } from '@/lib/planning';

const PlanningAiAssistant = dynamic(() => import('./PlanningAiAssistant'), { ssr: false });
const TARGET_WORK_CENTER_IDS = new Set(['111001', '111002', '111003', '111004', '111005']);

type Props = {
  data: PlanningDashboardData;
  initialYear: number;
  initialMonth: number;
};

const numberFormatter = new Intl.NumberFormat('th-TH');
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
const dragAutoScrollEdgePx = 120;
const dragAutoScrollMaxSpeed = 22;
const dragWheelScrollMultiplier = 1;

function formatNumber(value: number) {
  return numberFormatter.format(value);
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
        group: job.queueGroup?.trim() || job.zpg1d,
      });
    });
  });

  Object.entries(groupByWorkCenter(jobs)).forEach(([workCenter, workCenterJobs]) => {
    workCenterJobs.forEach((job, index) => {
      currentById.set(job.id, {
        seq: index + 1,
        workCenter,
        group: job.queueGroup?.trim() || job.zpg1d,
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

function sortJobsWithZpg1dGroups(targetJobs: PlanningJob[], prioritizeUrgent = false) {
  return sortJobsWithZpg3dTransition(targetJobs, { prioritizeUrgent });
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


export default function PlanningDashboard({ data, initialYear, initialMonth }: Props) {
  const filteredRawJobs = React.useMemo(() => {
    return data.jobs.filter((job) => TARGET_WORK_CENTER_IDS.has(job.arbpl));
  }, [data.jobs]);

  const filteredRawWorkCenters = React.useMemo(() => {
    return data.workCenters.filter((wc) => TARGET_WORK_CENTER_IDS.has(wc.arbpl));
  }, [data.workCenters]);

  const externalRoutingJobs = React.useMemo(() => {
    return data.jobs.filter((job) => !TARGET_WORK_CENTER_IDS.has(job.arbpl));
  }, [data.jobs]);

  const [jobs, setJobs] = React.useState(filteredRawJobs);
  const [initialJobs, setInitialJobs] = React.useState(filteredRawJobs);

  // Sync state if prop changes
  React.useEffect(() => {
    setJobs(filteredRawJobs);
    setInitialJobs(filteredRawJobs);
  }, [filteredRawJobs]);

  const sortedWorkCenters = React.useMemo(
    () => [...filteredRawWorkCenters].sort((a, b) => a.arbpl.localeCompare(b.arbpl, 'th', { numeric: true })),
    [filteredRawWorkCenters],
  );

  const defaultWorkCenter = 'ALL';
  const [selectedWorkCenter, setSelectedWorkCenter] = React.useState(defaultWorkCenter);
  const [planningView, setPlanningView] = React.useState<'queue' | 'matrix' | 'table'>('table');
  const deferredPlanningView = React.useDeferredValue(planningView);
  const deferredWorkCenter = React.useDeferredValue(selectedWorkCenter);


  const [selectedYear, setSelectedYear] = React.useState<number | 'ALL'>(
    Number.isInteger(initialYear) ? initialYear : 'ALL',
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number | 'ALL'>(
    Number.isInteger(initialMonth) && initialMonth >= 1 && initialMonth <= 12 ? initialMonth : 'ALL',
  );
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  const [orderSearch, setOrderSearch] = React.useState('');
  const [savingWorkCenter, setSavingWorkCenter] = React.useState<string | null>(null);

  const yearOptions = React.useMemo(() => {
    const years = new Set<number>();
    for (const job of filteredRawJobs) {
      const date = job.findate || job.stdate;
      if (date) {
        const yr = dayjs(date).year();
        if (!isNaN(yr)) years.add(yr);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [filteredRawJobs]);

  const normalizedSelectedYear = selectedYear === 'ALL' || yearOptions.includes(selectedYear)
    ? selectedYear
    : 'ALL';
  const normalizedSelectedMonth = selectedMonth === 'ALL' || (
    typeof selectedMonth === 'number' && selectedMonth >= 1 && selectedMonth <= 12
  )
    ? selectedMonth
    : 'ALL';

  React.useEffect(() => {
    if (selectedYear !== normalizedSelectedYear) {
      setSelectedYear(normalizedSelectedYear);
    }
    if (selectedMonth !== normalizedSelectedMonth) {
      setSelectedMonth(normalizedSelectedMonth);
    }
  }, [normalizedSelectedMonth, normalizedSelectedYear, selectedMonth, selectedYear]);

  const deferredYear = React.useDeferredValue(normalizedSelectedYear);
  const deferredMonth = React.useDeferredValue(normalizedSelectedMonth);
  const deferredStatus = React.useDeferredValue(selectedStatus);
  const deferredOrderSearch = React.useDeferredValue(orderSearch);

  const isWorkCenterPending =
    selectedWorkCenter !== deferredWorkCenter ||
    normalizedSelectedYear !== deferredYear ||
    normalizedSelectedMonth !== deferredMonth ||
    selectedStatus !== deferredStatus ||
    orderSearch !== deferredOrderSearch;
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
  const [lastMovedJobIds, setLastMovedJobIds] = React.useState<number[]>([]);
  const [savingAll, setSavingAll] = React.useState(false);
  const [showFloatingActionBar, setShowFloatingActionBar] = React.useState(false);

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
  }, []);

  const draggingJobIdRef = React.useRef<number | null>(null);
  const draggingElementsRef = React.useRef<HTMLElement[]>([]);
  const dragOverRowRef = React.useRef<HTMLElement | null>(null);
  const dragOverRowRectRef = React.useRef<DOMRect | null>(null);
  const dragOverLastUpdateRef = React.useRef(0);
  const dragDropPositionRef = React.useRef<'before' | 'after'>('before');
  const dragAutoScrollFrameRef = React.useRef<number | null>(null);
  const dragAutoScrollPointerYRef = React.useRef<number | null>(null);
  const dragAutoScrollListenerRef = React.useRef<((event: DragEvent) => void) | null>(null);
  const dragWheelScrollListenerRef = React.useRef<((event: WheelEvent) => void) | null>(null);
  const dropConfirmTimerRef = React.useRef<number | null>(null);
  const dropConfirmRowRef = React.useRef<HTMLElement | null>(null);
  const dropConfirmFrameRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(false);


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
        dragAutoScrollListenerRef.current = null;
      }
      if (dragWheelScrollListenerRef.current) {
        window.removeEventListener('wheel', dragWheelScrollListenerRef.current, true);
        dragWheelScrollListenerRef.current = null;
      }
      draggingElementsRef.current.forEach((element) => element.classList.remove('dragging-row'));
      draggingElementsRef.current = [];
    };
  }, []);

  const filteredJobs = React.useMemo(() => {
    const normalizedOrderSearch = deferredOrderSearch.trim().toLocaleUpperCase('th-TH');
    return jobs.filter((job) => {
      if (normalizedOrderSearch && !job.aufnr.toLocaleUpperCase('th-TH').includes(normalizedOrderSearch)) {
        return false;
      }

      // 1. Year/Month filtering
      const jobStart = job.stdate || '';
      if (!jobStart) {
        if (deferredYear !== 'ALL' || deferredMonth !== 'ALL') return false;
      } else {
        const d = dayjs(jobStart);
        if (d.isValid()) {
          const jobYear = d.year();
          const jobMonth = d.month() + 1;
          if (deferredYear !== 'ALL' && jobYear !== deferredYear) return false;
          if (deferredMonth !== 'ALL' && jobMonth !== deferredMonth) return false;
        } else {
          if (deferredYear !== 'ALL' || deferredMonth !== 'ALL') return false;
        }
      }

      // 2. Status filtering
      if (deferredStatus !== 'ALL') {
        const jobStatus = job.text1 || 'null';
        if (deferredStatus === 'null') {
          if (job.text1 && job.text1 !== '') return false;
        } else {
          if (jobStatus.toUpperCase() !== deferredStatus.toUpperCase()) return false;
        }
      }

      return true;
    });
  }, [jobs, deferredYear, deferredMonth, deferredStatus, deferredOrderSearch]);

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
          return !initJob ||
            job.id !== initJob.id ||
            job.zpg1d !== initJob.zpg1d ||
            job.queueGroup !== initJob.queueGroup;
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
  const hasDirtyChanges = dirtyList.length > 0;

  const sequenceChanges = React.useMemo(
    () => buildSequenceChangeMap(initialJobs, jobs),
    [initialJobs, jobs],
  );

  React.useEffect(() => {
    if (!hasDirtyChanges) {
      setShowFloatingActionBar(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setShowFloatingActionBar(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasDirtyChanges]);

  const markLastMovedJobs = React.useCallback((jobIds: number[]) => {
    React.startTransition(() => {
      setLastMovedJobIds(jobIds);
    });
  }, []);

  const saveAllDirty = React.useCallback(async () => {
    const workCentersToSave = dirtyList.length > 0
      ? dirtyList
      : sortedWorkCenters.map((item) => item.arbpl);
    if (workCentersToSave.length === 0) return;

    setSavingAll(true);
    setSnackbar({ open: false, message: '', severity: 'success' });

    const itemsToSave: Array<{ id: number; seqno: number; zpg1d: string | null; queueGroup: string | null; arbpl: string }> = [];

    for (const wc of workCentersToSave) {
      const wcJobs = jobs.filter((j) => j.arbpl === wc);
      wcJobs.forEach((job, index) => {
        itemsToSave.push({
          id: job.id,
          seqno: index + 1,
          zpg1d: job.zpg1d,
          queueGroup: job.queueGroup,
          arbpl: job.arbpl,
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

      const savedWorkCenterSet = new Set(workCentersToSave);
      const nextSequenceById = new Map<number, number>();
      for (const workCenter of workCentersToSave) {
        jobs
          .filter((job) => job.arbpl === workCenter)
          .forEach((job, index) => nextSequenceById.set(job.id, index + 1));
      }
      const savedJobs = jobs.map((job) => (
        savedWorkCenterSet.has(job.arbpl)
          ? { ...job, seqno: nextSequenceById.get(job.id) ?? job.seqno }
          : job
      ));

      setJobs(savedJobs);
      setInitialJobs(savedJobs);
      setSelectedJobIds(new Set());
      setLastMovedJobIds([]);
      setSnackbar({
        open: true,
        message: `บันทึก Seq. ลงฐานข้อมูลสำเร็จ (${workCentersToSave.join(', ')})`,
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
  }, [dirtyList, jobs, sortedWorkCenters]);
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

  const metricScopeLabel = selectedWorkCenter === 'ALL' ? 'รวมทุก Work center' : `Work center ${selectedWorkCenter}`;
  const aiScopeLabel = React.useMemo(() => {
    const yearLabel = deferredYear === 'ALL' ? 'ทุกปี' : `ปี ${deferredYear + 543}`;
    const monthLabel = deferredMonth === 'ALL'
      ? 'ทุกเดือน'
      : THAI_MONTHS.find((item) => item.value === deferredMonth)?.label ?? `เดือน ${deferredMonth}`;
    const orderLabel = deferredOrderSearch.trim() ? `Order: ${deferredOrderSearch.trim()}` : 'ทุก Order';
    return `${metricScopeLabel} · ${yearLabel} · ${monthLabel} · ${orderLabel}`;
  }, [deferredMonth, deferredOrderSearch, deferredYear, metricScopeLabel]);

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
      const rows: HTMLElement[] = [];

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
    const draggedIdSet = new Set(draggedJobIds);

    setJobs((current) => {
      const targetJobObj = current.find((j) => j.id === targetJobId);
      if (!targetJobObj) return current;

      const originalIndexById = new Map(current.map((job, index) => [job.id, index]));
      const draggedJobs = current.filter((j) => draggedIdSet.has(j.id));
      if (draggedJobs.length === 0) return current;

      const next = current;

      const workCenterIndexes = next
        .map((job, index) => ({ job, index }))
        .filter((item) => item.job.arbpl === workCenter);

      const targetLocalIndex = workCenterIndexes.findIndex((item) => item.job.id === targetJobId);
      if (targetLocalIndex < 0) return current;

      const wcJobs = workCenterIndexes.map(item => item.job);
      const filteredWcJobs = wcJobs.filter(job => !draggedIdSet.has(job.id));

      const newTargetIndex = filteredWcJobs.findIndex(job => job.id === targetJobId);
      if (newTargetIndex < 0) return current;

      const insertIndex = newTargetIndex + (position === 'after' ? 1 : 0);

      const orderedDraggedJobs = [...draggedJobs].map(job => {
        return {
          ...job,
          arbpl: workCenter,
          queueGroup: getQueueGroupId(targetJobObj) === getJobGroupId(job.zpg1d)
            ? null
            : targetJobObj.queueGroup?.trim() || targetJobObj.zpg1d,
        };
      }).sort((a, b) => {
        return (originalIndexById.get(a.id) ?? 0) - (originalIndexById.get(b.id) ?? 0);
      });

      filteredWcJobs.splice(insertIndex, 0, ...orderedDraggedJobs);

      const withoutDragged = next.filter(job => !draggedIdSet.has(job.id));
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
          targetJobs.forEach((job) => {
            job.queueGroup = getQueueGroupId(neighborJob) === getJobGroupId(job.zpg1d)
              ? null
              : neighborJob.queueGroup?.trim() || neighborJob.zpg1d;
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

        targetJobs.forEach((job) => {
          job.queueGroup = getQueueGroupId(itemBelow) === getJobGroupId(job.zpg1d)
            ? null
            : itemBelow.queueGroup?.trim() || itemBelow.zpg1d;
        });

        const queue = [...remainingJobs];
        moved = true;
        return current.map((job) => (job.arbpl === workCenter ? queue.shift() ?? job : job));
      }
    });

    if (moved && targetIds.length > 0) {
      markLastMovedJobs(targetIds);
      showDropConfirmation(targetIds, direction === 'up' ? 'before' : 'after');
    }
  }, [markLastMovedJobs, showDropConfirmation]);

  const prioritizeUrgentJobs = React.useCallback((scopedJobIds: number[]) => {
    const scopedIdSet = new Set(scopedJobIds);
    if (scopedIdSet.size === 0) return;

    setSnackbar((prev) => ({ ...prev, open: false }));
    setJobs((current) => {
      const scopedJobsByWorkCenter = groupByWorkCenter(
        current.filter((job) => scopedIdSet.has(job.id)),
      );
      const sortedQueues = new Map(
        Object.entries(scopedJobsByWorkCenter).map(([workCenter, workCenterJobs]) => [
          workCenter,
          sortJobsWithZpg1dGroups(workCenterJobs, true),
        ]),
      );

      return current.map((job) => {
        if (!scopedIdSet.has(job.id)) return job;
        return sortedQueues.get(job.arbpl)?.shift() ?? job;
      });
    });
  }, []);

  // DEFAULT SETTING = Discard unsaved changes, revert to last committed DB state
  const resetWorkCenterToInitial = React.useCallback((workCenter: string) => {
    setJobs((current) => {
      const otherJobs = current.filter((job) => job.arbpl !== workCenter);
      const result: PlanningJob[] = [];
      for (const job of initialJobs) {
        if (job.arbpl === workCenter) {
          result.push(job); // restore committed DB data & order
        } else if (otherJobs.find((j) => j.id === job.id)) {
          result.push(current.find((j) => j.id === job.id) ?? job);
        }
      }
      return result;
    });
    setSnackbar({
      open: true,
      message: `ล้างการเปลี่ยนแปลงของ ${workCenter} แล้ว — คืนค่าจาก DB ล่าสุด`,
      severity: 'info',
    });
  }, [initialJobs]);

  const saveSequence = React.useCallback(async (workCenter: string) => {
    setSavingWorkCenter(workCenter);
    setSnackbar((prev) => ({ ...prev, open: false }));

    const affectedWorkCenters = new Set([workCenter]);
    for (const change of sequenceChanges.values()) {
      if (change.previousWorkCenter === workCenter || change.currentWorkCenter === workCenter) {
        affectedWorkCenters.add(change.previousWorkCenter);
        affectedWorkCenters.add(change.currentWorkCenter);
      }
    }

    const affectedList = Array.from(affectedWorkCenters);
    const affectedJobs = jobs.filter((job) => affectedWorkCenters.has(job.arbpl));
    const items = affectedList.flatMap((currentWorkCenter) =>
      jobs
        .filter((job) => job.arbpl === currentWorkCenter)
        .map((job, index) => ({
          id: job.id,
          seqno: index + 1,
          zpg1d: job.zpg1d,
          queueGroup: job.queueGroup,
          arbpl: job.arbpl,
        })),
    );

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

    const nextSequenceById = new Map<number, number>();
    for (const currentWorkCenter of affectedList) {
      affectedJobs
        .filter((job) => job.arbpl === currentWorkCenter)
        .forEach((job, index) => nextSequenceById.set(job.id, index + 1));
    }
    const savedJobs = jobs.map((job) => (
      affectedWorkCenters.has(job.arbpl)
        ? { ...job, seqno: nextSequenceById.get(job.id) ?? job.seqno }
        : job
    ));

    setJobs(savedJobs);
    setInitialJobs(savedJobs);
    setSelectedJobIds(new Set());
    setLastMovedJobIds([]);

    setSnackbar({
      open: true,
      message: affectedList.length > 1
        ? `บันทึกการย้ายงานระหว่าง ${affectedList.join(' → ')} แล้ว`
        : `บันทึกลำดับของ ${workCenter} ลงฐานข้อมูลแล้ว`,
      severity: 'success',
    });
  }, [jobs, sequenceChanges]);

  const clearDragClasses = React.useCallback(() => {
    dragOverRowRef.current?.classList.remove('drop-target-row', 'drop-before-row', 'drop-after-row');
    dragOverRowRef.current?.removeAttribute('data-drop-label');
    dragOverRowRef.current?.removeAttribute('data-drop-position');
    dragOverRowRef.current = null;
    dragOverRowRectRef.current = null;
  }, []);

  const clearDraggingElements = React.useCallback(() => {
    draggingElementsRef.current.forEach((element) => element.classList.remove('dragging-row'));
    draggingElementsRef.current = [];
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

  const startDragAutoScroll = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    dragAutoScrollPointerYRef.current = event.clientY;

    if (!dragAutoScrollListenerRef.current) {
      dragAutoScrollListenerRef.current = (dragEvent: DragEvent) => {
        dragAutoScrollPointerYRef.current = dragEvent.clientY;
      };
      window.addEventListener('dragover', dragAutoScrollListenerRef.current, { capture: true });
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
      dragAutoScrollListenerRef.current = null;
    }

    if (dragWheelScrollListenerRef.current) {
      window.removeEventListener('wheel', dragWheelScrollListenerRef.current, true);
      dragWheelScrollListenerRef.current = null;
    }
  }, []);

  const handleDragStart = React.useCallback((event: React.DragEvent<HTMLElement>, jobId: number) => {
    event.dataTransfer.effectAllowed = 'move';
    draggingJobIdRef.current = jobId;
    startDragAutoScroll(event);

    let idsToDrag = [jobId];
    if (selectedJobIdsRef.current.has(jobId)) {
      idsToDrag = Array.from(selectedJobIdsRef.current);
    } else {
      idsToDrag = [jobId];
    }

    event.dataTransfer.setData('text/plain', idsToDrag.join(','));
    const dragPreview = document.createElement('div');
    dragPreview.textContent = idsToDrag.length > 1
      ? `ย้าย ${idsToDrag.length} Operations`
      : 'ย้าย Operation';
    Object.assign(dragPreview.style, {
      position: 'fixed',
      top: '-1000px',
      left: '-1000px',
      padding: '8px 12px',
      borderRadius: '8px',
      background: '#312e81',
      color: '#ffffff',
      font: '700 12px Sarabun, sans-serif',
      boxShadow: '0 10px 24px rgba(49, 46, 129, 0.24)',
      pointerEvents: 'none',
    });
    document.body.appendChild(dragPreview);
    event.dataTransfer.setDragImage(dragPreview, 18, 18);
    window.requestAnimationFrame(() => dragPreview.remove());
    const draggingElements: HTMLElement[] = [];
    idsToDrag.forEach(id => {
      document.querySelectorAll<HTMLElement>(`[data-job-id="${id}"]`).forEach((element) => {
        element.classList.add('dragging-row');
        draggingElements.push(element);
      });
    });
    draggingElementsRef.current = draggingElements;
  }, [startDragAutoScroll]);

  const handleDrag = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    if (event.clientY > 0) {
      dragAutoScrollPointerYRef.current = event.clientY;
    }
  }, []);

  const handleDragOver = React.useCallback((event: React.DragEvent<HTMLElement>, jobId: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    dragAutoScrollPointerYRef.current = event.clientY;

    if (draggingJobIdRef.current === jobId) return;

    const now = performance.now();
    if (dragOverRowRef.current === event.currentTarget && now - dragOverLastUpdateRef.current < 16) return;
    dragOverLastUpdateRef.current = now;

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

  const handleDragLeave = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      event.currentTarget.classList.remove('drop-target-row', 'drop-before-row', 'drop-after-row');
      event.currentTarget.removeAttribute('data-drop-label');
      event.currentTarget.removeAttribute('data-drop-position');
      if (dragOverRowRef.current === event.currentTarget) {
        dragOverRowRef.current = null;
      }
    }
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent<HTMLElement>, targetJobId: number, workCenter: string) => {
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
      markLastMovedJobs(draggedIds);
      reorderJob(workCenter, draggedIds, targetJobId, dragDropPositionRef.current);
    }
    event.currentTarget.classList.remove('drop-target-row', 'drop-before-row', 'drop-after-row');
    event.currentTarget.removeAttribute('data-drop-label');
    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    clearDraggingElements();
  }, [reorderJob, clearDragClasses, clearDraggingElements, markLastMovedJobs, stopDragAutoScroll]);

  const handleDropToLane = React.useCallback((event: React.DragEvent<HTMLElement>, workCenter: string) => {
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
      markLastMovedJobs(draggedIds);
      setJobs((current) => {
        const draggedJobs = current.filter((job) => draggedIds.includes(job.id));
        if (draggedJobs.length === 0) return current;

        const remaining = current.filter((job) => !draggedIds.includes(job.id));
        const targetJobs = remaining.filter((job) => job.arbpl === workCenter);
        const movedJobs = draggedJobs.map((job) => ({ ...job, arbpl: workCenter }));
        const firstTargetIndex = remaining.findIndex((job) => job.arbpl === workCenter);
        const jobsOutsideTarget = remaining.filter((job) => job.arbpl !== workCenter);
        const insertAt = firstTargetIndex < 0
          ? jobsOutsideTarget.length
          : remaining
            .slice(0, firstTargetIndex)
            .filter((job) => job.arbpl !== workCenter).length;

        const next = [...jobsOutsideTarget];
        next.splice(insertAt, 0, ...targetJobs, ...movedJobs);
        return next;
      });
      showDropConfirmation(draggedIds, 'after');
    }

    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    clearDraggingElements();
  }, [clearDragClasses, clearDraggingElements, markLastMovedJobs, showDropConfirmation, stopDragAutoScroll]);

  const handleDropToProductGroup = React.useCallback((
    event: React.DragEvent<HTMLElement>,
    workCenter: string,
    groupLabel: string,
  ) => {
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
      markLastMovedJobs(draggedIds);
      setJobs((current) => {
        const draggedIdSet = new Set(draggedIds);
        const draggedJobs = current.filter((job) => draggedIdSet.has(job.id));
        if (draggedJobs.length === 0) return current;

        const remaining = current.filter((job) => !draggedIdSet.has(job.id));
        const targetWorkCenterJobs = remaining.filter((job) => job.arbpl === workCenter);
        const targetGroupId = getJobGroupId(groupLabel);
        const targetGroupOrder = getJobGroupSortOrder(groupLabel);
        const lastJobInGroup = targetWorkCenterJobs.reduce(
          (lastIndex, job, index) => (
            getQueueGroupId(job) === targetGroupId ? index : lastIndex
          ),
          -1,
        );
        const firstLaterGroup = targetWorkCenterJobs.findIndex(
          (job) => getQueueGroupSortOrder(job) > targetGroupOrder,
        );
        const insertInWorkCenterAt = lastJobInGroup >= 0
          ? lastJobInGroup + 1
          : firstLaterGroup >= 0
            ? firstLaterGroup
            : targetWorkCenterJobs.length;
        const movedJobs = draggedJobs.map((job) => ({
          ...job,
          arbpl: workCenter,
          queueGroup: getJobGroupId(job.zpg1d) === targetGroupId ? null : groupLabel,
        }));

        targetWorkCenterJobs.splice(insertInWorkCenterAt, 0, ...movedJobs);

        const firstTargetIndex = current.findIndex((job) => job.arbpl === workCenter);
        const jobsOutsideTarget = remaining.filter((job) => job.arbpl !== workCenter);
        const insertAt = firstTargetIndex < 0
          ? jobsOutsideTarget.length
          : current
            .slice(0, firstTargetIndex)
            .filter((job) => job.arbpl !== workCenter && !draggedIdSet.has(job.id))
            .length;
        const next = [...jobsOutsideTarget];
        next.splice(insertAt, 0, ...targetWorkCenterJobs);
        return next;
      });
      showDropConfirmation(draggedIds, 'after');
    }

    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    clearDraggingElements();
  }, [clearDragClasses, clearDraggingElements, markLastMovedJobs, showDropConfirmation, stopDragAutoScroll]);

  const handleDragEnd = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    clearDraggingElements();
  }, [clearDragClasses, clearDraggingElements, stopDragAutoScroll]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box
        sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary', py: 4 }}
      >
        <Container
          maxWidth={false}
          disableGutters
          sx={{ px: { xs: 1.5, sm: 2, lg: 3, xl: 4 } }}
        >
          <Stack spacing={3}>
            <Paper
              sx={{
                p: { xs: 2, md: 3 },
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.05)',
              }}
            >
              <Stack
                direction={{ xs: 'column', lg: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'flex-start', lg: 'center' }, justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                    }}
                  >
                    <Category size="22" color="#ffffff" variant="Bold" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 950,
                        letterSpacing: '-0.03em',
                        background: 'linear-gradient(45deg, #4f46e5 30%, #06b6d4 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      PSC Planing
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, mt: 0.25, display: 'block' }}>
                      ระบบจัดตารางแผนการผลิตและลำดับคิวเครื่องจักร
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', lg: 'auto' } }}>
                  <Button
                    component={Link}
                    href="/guide"
                    size="small"
                    variant="outlined"
                    startIcon={<Book size="16" color="#4f46e5" />}
                    sx={{
                      borderRadius: '12px',
                      fontWeight: 800,
                      px: 2.25,
                      py: 1,
                      textTransform: 'none',
                    }}
                  >
                    คู่มือการใช้งาน
                  </Button>
                  <Button
                    component={Link}
                    href="/upload"
                    size="small"
                    variant="contained"
                    startIcon={<Data size="16" color="#ffffff" />}
                    sx={{
                      borderRadius: '12px',
                      fontWeight: 800,
                      px: 2.5,
                      py: 1,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    Upload Excel
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {/* Work Center Card Selector Row (Full Width, absolute top below header) */}
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{
                alignItems: { xs: 'flex-start', md: 'center' },
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 4,
                border: '1px solid rgba(15, 23, 42, 0.04)',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.01)',
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary', minWidth: 160 }}>
                <Category size="18" color="#4f46e5" variant="Bulk" />
                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.02em' }}>
                  เครื่องจักร (Machines):
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: 'flex',
                  gap: 0.75,
                  bgcolor: 'rgba(15, 23, 42, 0.03)',
                  p: 0.5,
                  borderRadius: '14px',
                  overflowX: 'auto',
                  width: { xs: '100%', md: 'auto' },
                  scrollSnapType: 'x mandatory',
                  '&::-webkit-scrollbar': {
                    height: 0, // hide scrollbar for tabs
                  },
                }}
              >
                {/* "ดูทั้งหมด" Tab */}
                {(() => {
                  const isSelected = selectedWorkCenter === 'ALL';
                  return (
                    <Button
                      onClick={() => handleWorkCenterChange('ALL')}
                      startIcon={<StatusUp size="16" variant={isSelected ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        flex: '0 0 auto',
                        px: 3,
                        py: 0.75,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 850,
                        fontSize: '0.85rem',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'none !important', // prevent theme hover lift
                        boxShadow: isSelected ? '0 2px 8px rgba(180, 83, 9, 0.12)' : 'none !important',
                        bgcolor: isSelected ? '#b45309' : 'transparent',
                        color: isSelected ? '#ffffff' : 'text.secondary',
                        '&:hover': {
                          bgcolor: isSelected ? '#9a3412' : 'rgba(15, 23, 42, 0.04)',
                          color: isSelected ? '#ffffff' : 'text.primary',
                        },
                      }}
                    >
                      ดูทั้งหมด
                    </Button>
                  );
                })()}

                {sortedWorkCenters.map((item) => {
                  const isSelected = selectedWorkCenter === item.arbpl;
                  return (
                    <Button
                      key={item.arbpl}
                      onClick={() => handleWorkCenterChange(item.arbpl)}
                      startIcon={<Setting2 size="16" variant={isSelected ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        flex: '0 0 auto',
                        px: 3,
                        py: 0.75,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 850,
                        fontSize: '0.85rem',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'none !important', // prevent theme hover lift
                        boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.16)' : 'none !important',
                        bgcolor: isSelected ? 'primary.main' : 'transparent',
                        color: isSelected ? '#ffffff' : 'text.secondary',
                        '&:hover': {
                          bgcolor: isSelected ? 'primary.dark' : 'rgba(15, 23, 42, 0.04)',
                          color: isSelected ? '#ffffff' : 'text.primary',
                        },
                      }}
                    >
                      {item.arbpl}
                    </Button>
                  );
                })}
              </Box>
            </Stack>

            {/* Status Metrics Paper (Stat Cards at the top, full width, below Work Center selectors) */}
            <Paper
              sx={{
                p: { xs: 2.25, md: 3 },
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid rgba(15, 23, 42, 0.04)',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.02)',
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      สถานะงานตามขอบเขตที่เลือก
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {metricScopeLabel} หลังกรองข้อมูล
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`แสดง ${formatNumber(scopedTotals.jobs)} / ${formatNumber(filteredTotals.jobs)} งานในแผน`}
                    sx={{
                      opacity: isWorkCenterPending ? 0.65 : 1,
                      transition: 'opacity 150ms ease-in-out',
                      borderRadius: '8px',
                      fontWeight: 800,
                      color: 'primary.main',
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(79, 70, 229, 0.04)',
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    opacity: isWorkCenterPending ? 0.65 : 1,
                    pointerEvents: isWorkCenterPending ? 'none' : 'auto',
                    transition: 'opacity 150ms ease-in-out',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
                    gap: 2,
                  }}
                >
                  {[
                    { label: 'งานทั้งหมด', value: formatNumber(scopedTotals.jobs), icon: <TaskSquare size="20" color="#4f46e5" />, accent: '#4f46e5', bg: 'rgba(99, 102, 241, 0.03)', iconBg: 'rgba(99, 102, 241, 0.08)' },
                    { label: 'STATUS', value: formatNumber(scopedTotals.waitJobs), icon: <Clock size="20" color="#d97706" />, accent: '#d97706', bg: 'rgba(217, 119, 6, 0.03)', iconBg: 'rgba(217, 119, 6, 0.08)' },
                    { label: 'OP TIME', value: `${formatNumber(scopedTotals.optime)} ชม.`, icon: <StatusUp size="20" color="#0891b2" />, accent: '#0891b2', bg: 'rgba(8, 145, 178, 0.03)', iconBg: 'rgba(8, 145, 178, 0.08)' },
                    { label: 'ORDER QTY', value: formatNumber(scopedTotals.quantity), icon: <Data size="20" color="#059669" />, accent: '#059669', bg: 'rgba(5, 150, 105, 0.03)', iconBg: 'rgba(5, 150, 105, 0.08)' },
                    { label: 'เปลี่ยน L/Q', value: `${formatNumber(totalChangeovers)} ครั้ง`, icon: <Setting2 size="20" color="#dc2626" />, accent: '#dc2626', bg: 'rgba(220, 38, 38, 0.03)', iconBg: 'rgba(220, 38, 38, 0.08)' },
                  ].map((metric) => (
                    <Paper
                      key={metric.label}
                      variant="outlined"
                      sx={{
                        p: 2.25,
                        borderRadius: 3.5, // rounded corners
                        borderColor: 'rgba(15, 23, 42, 0.06)',
                        bgcolor: metric.bg,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 24px -10px ${metric.accent}24`,
                          borderColor: metric.accent,
                        },
                      }}
                    >
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '12px',
                            bgcolor: metric.iconBg,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {metric.icon}
                        </Box>
                        <Stack spacing={0.25}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {metric.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            {metric.value}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Box>
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
                {/* Card 1: Filters */}
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: '1px solid rgba(15, 23, 42, 0.04)',
                    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.02)',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '0.01em' }}>
                      ตัวกรองข้อมูล (Filters)
                    </Typography>

                    <TextField
                      fullWidth
                      size="small"
                      type="search"
                      label="ค้นหา Order Number"
                      placeholder="เช่น 45000123"
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                      slotProps={{
                        htmlInput: {
                          autoComplete: 'off',
                          inputMode: 'search',
                          'aria-label': 'ค้นหาด้วย Order Number',
                        },
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#ffffff' } }}
                    />

                    {/* Year/Month Select Filters */}
                    <Stack direction="row" spacing={1.5}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="year-filter-label">ปีแผนงาน (พ.ศ.)</InputLabel>
                        <Select
                          labelId="year-filter-label"
                          id="year-filter"
                          value={normalizedSelectedYear}
                          label="ปีแผนงาน (พ.ศ.)"
                          onChange={(e) => setSelectedYear(e.target.value as number | 'ALL')}
                          sx={{ borderRadius: '10px' }}
                          MenuProps={{
                            disableScrollLock: true,
                          }}
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
                          value={normalizedSelectedMonth}
                          label="เดือน"
                          onChange={(e) => setSelectedMonth(e.target.value as number | 'ALL')}
                          sx={{ borderRadius: '10px' }}
                          MenuProps={{
                            disableScrollLock: true,
                          }}
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

                    <FormControl size="small" fullWidth>
                      <InputLabel id="status-filter-label">สถานะ (Status)</InputLabel>
                      <Select
                        labelId="status-filter-label"
                        id="status-filter"
                        value={selectedStatus}
                        label="สถานะ (Status)"
                        onChange={(e) => setSelectedStatus(e.target.value as string)}
                        sx={{ borderRadius: '10px' }}
                        MenuProps={{
                          disableScrollLock: true,
                        }}
                      >
                        <MenuItem value="ALL">ทั้งหมด</MenuItem>
                        <MenuItem value="null">NOT START</MenuItem>
                        <MenuItem value="START">START</MenuItem>
                        <MenuItem value="WAIT">WAIT</MenuItem>
                        <MenuItem value="DONE">DONE</MenuItem>
                      </Select>
                    </FormControl>

                    <Divider sx={{ my: 0.5 }} />
                    <Stack spacing={1.5}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        disabled={
                          selectedWorkCenter === defaultWorkCenter &&
                          normalizedSelectedYear === 'ALL' &&
                          normalizedSelectedMonth === 'ALL' &&
                          selectedStatus === 'ALL' &&
                          orderSearch === ''
                        }
                        onClick={() => {
                          setSelectedWorkCenter(defaultWorkCenter);
                          setSelectedYear('ALL');
                          setSelectedMonth('ALL');
                          setSelectedStatus('ALL');
                          setOrderSearch('');
                        }}
                        sx={{
                          borderRadius: '10px',
                          fontWeight: 800,
                          py: 1,
                        }}
                      >
                        ล้างตัวกรอง
                      </Button>
                      {isWorkCenterPending ? (
                        <Skeleton variant="text" width={150} height={20} sx={{ mx: 'auto' }} />
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', fontWeight: 700 }}>
                          แสดง {formatNumber(visibleJobCount)} จาก {formatNumber(jobs.length)} งาน
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </Paper>
              </Box>

              {/* Right Column - Scrollable Content */}
              <Stack spacing={3}>
                {data.totals.jobs === 0 && (
                  <Alert severity="warning">
                    ยังไม่มีข้อมูลในฐานข้อมูล ให้รัน `npm run db:push` แล้วตามด้วย `npm run db:seed`
                  </Alert>
                )}

                {/* Load Summaries */}
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: '1px solid rgba(15, 23, 42, 0.04)',
                    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.02)',
                    opacity: isWorkCenterPending ? 0.65 : 1,
                    pointerEvents: isWorkCenterPending ? 'none' : 'auto',
                    transition: 'opacity 150ms ease-in-out',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
                    โหลดงานตาม Work center
                  </Typography>
                  <Stack spacing={2}>
                    {(() => {
                      const maxJobsCount = Math.max(
                        ...sortedWorkCenters.map((item) => (groupedJobs[item.arbpl] ?? []).length),
                        0
                      );

                      return sortedWorkCenters.map((item) => {
                        const filteredGroup = groupedJobs[item.arbpl] ?? [];
                        const jobCount = filteredGroup.length;
                        const percent = maxJobsCount > 0 ? (jobCount / maxJobsCount) * 100 : 0;

                        return (
                          <Box key={item.arbpl}>
                            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75, alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                เครื่องจักร {item.arbpl}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                {formatNumber(jobCount)} งาน ({percent.toFixed(0)}%)
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(percent, 100)}
                              sx={{
                                height: 10,
                                borderRadius: 999,
                                bgcolor: 'rgba(15, 23, 42, 0.05)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: 'primary.main',
                                  borderRadius: 999,
                                },
                              }}
                            />
                          </Box>
                        );
                      });
                    })()}
                  </Stack>
                </Paper>
              </Stack>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 4,
                border: '1px solid rgba(15, 23, 42, 0.06)',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.015)',
              }}
            >
              <Stack spacing={2}>
                {/* First Row: Title & Actions */}
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
                >
                  <Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant={'h6'} sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Production Routing
                      </Typography>
                      <Chip
                        icon={
                          planningView === 'queue' ? (
                            <Category size="13" variant="Bold" color="currentColor" />
                          ) : planningView === 'matrix' ? (
                            <Data size="13" variant="Bold" color="currentColor" />
                          ) : (
                            <TaskSquare size="13" variant="Bold" color="currentColor" />
                          )
                        }
                        label={
                          planningView === 'queue' ? 'Compact Queue' :
                            planningView === 'matrix' ? 'Routing Matrix' : 'Detailed Table'
                        }
                        size="small"
                        sx={{
                          bgcolor:
                            planningView === 'queue' ? 'rgba(79, 70, 229, 0.08)' :
                              planningView === 'matrix' ? 'rgba(8, 145, 178, 0.08)' : 'rgba(51, 65, 85, 0.08)',
                          color:
                            planningView === 'queue' ? '#4f46e5' :
                              planningView === 'matrix' ? '#0891b2' : '#334155',
                          fontWeight: 900,
                          fontSize: '0.72rem',
                          height: 22,
                          borderRadius: 1.5,
                          '& .MuiChip-icon': {
                            color: 'currentColor',
                            marginLeft: '4px',
                            marginRight: '-4px',
                          },
                        }}
                      />
                    </Stack>
                    <Typography variant={'body2'} sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                      ลาก Order ขึ้นลงเพื่อจัดลำดับ หรือลากข้ามคอลัมน์เพื่อเปลี่ยน Work Center
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', md: 'initial' } }}>
                    <Box sx={{ borderRight: '1px solid rgba(15, 23, 42, 0.08)', pr: 2, mr: 1, display: { xs: 'none', sm: 'block' } }}>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        จัดการแผน
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: '#172033', fontWeight: 900 }}>
                        {deferredWorkCenter === 'ALL' ? 'ทุก Work Center' : 'WC ' + deferredWorkCenter}
                      </Typography>
                    </Box>
                    <PlanningActionButtons
                      isDirty={visibleWorkCenters.some((item) => dirtyWorkCenters.get(item.arbpl) ?? false)}
                      isSaving={savingAll || savingWorkCenter !== null}
                      onAutoArrange={() => {
                        prioritizeUrgentJobs(scopedJobs.map((job) => job.id));
                      }}
                      onReset={() => {
                        visibleWorkCenters.forEach((item) => resetWorkCenterToInitial(item.arbpl));
                      }}
                      onSave={() => {
                        if (deferredWorkCenter === 'ALL') {
                          void saveAllDirty();
                        } else {
                          void saveSequence(deferredWorkCenter);
                        }
                      }}
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.05)' }} />

                {/* Second Row: View Switcher */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', p: 0.5, bgcolor: '#f1f5f9', borderRadius: 2.5, gap: 0.5, border: '1px solid rgba(15, 23, 42, 0.03)' }}>
                    <Button
                      size={'small'}
                      onClick={() => setPlanningView('table')}
                      startIcon={<TaskSquare size="15" variant={planningView === 'table' ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        px: 2.5,
                        py: 0.75,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        textTransform: 'none',
                        color: planningView === 'table' ? '#ffffff' : '#64748b',
                        bgcolor: planningView === 'table' ? '#334155' : 'transparent',
                        boxShadow: planningView === 'table' ? '0 4px 12px rgba(51, 65, 85, 0.18)' : 'none',
                        transition: 'all 200ms ease',
                        '&:hover': { bgcolor: planningView === 'table' ? '#1e293b' : 'rgba(15, 23, 42, 0.04)' },
                      }}
                    >
                      Detailed Table
                    </Button>
                    <Button
                      size={'small'}
                      onClick={() => setPlanningView('queue')}
                      startIcon={<Category size="15" variant={planningView === 'queue' ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        px: 2.5,
                        py: 0.75,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        textTransform: 'none',
                        color: planningView === 'queue' ? '#ffffff' : '#64748b',
                        bgcolor: planningView === 'queue' ? '#4f46e5' : 'transparent',
                        boxShadow: planningView === 'queue' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                        transition: 'all 200ms ease',
                        '&:hover': { bgcolor: planningView === 'queue' ? '#4338ca' : 'rgba(15, 23, 42, 0.04)' },
                      }}
                    >
                      Compact Queue
                    </Button>
                    <Button
                      size={'small'}
                      onClick={() => setPlanningView('matrix')}
                      startIcon={<Data size="15" variant={planningView === 'matrix' ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        px: 2.5,
                        py: 0.75,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        textTransform: 'none',
                        color: planningView === 'matrix' ? '#ffffff' : '#64748b',
                        bgcolor: planningView === 'matrix' ? '#0891b2' : 'transparent',
                        boxShadow: planningView === 'matrix' ? '0 4px 12px rgba(8, 145, 178, 0.2)' : 'none',
                        transition: 'all 200ms ease',
                        '&:hover': { bgcolor: planningView === 'matrix' ? '#0e7490' : 'rgba(15, 23, 42, 0.04)' },
                      }}
                    >
                      Routing Matrix
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            {/* Persistent Alert Info for sequence changes */}
            {(() => {
              const activeChanges = lastMovedJobIds
                .map((jobId) => ({ jobId, change: sequenceChanges.get(jobId) }))
                .filter((item): item is { jobId: number; change: SequenceChange } => Boolean(item.change));

              if (activeChanges.length === 0) return null;

              return (
                <Alert
                  severity="info"
                  variant="outlined"
                  sx={{
                    mb: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(2, 136, 209, 0.03)',
                    borderColor: 'rgba(2, 136, 209, 0.25)',
                    '& .MuiAlert-icon': { color: '#0288d1' },
                  }}
                >
                  <AlertTitle sx={{ fontWeight: 850, color: '#0288d1', mb: 1, fontSize: '0.92rem' }}>
                    รายการปรับปรุงลำดับคิวล่าสุด (ยังไม่ได้บันทึก)
                  </AlertTitle>
                  <Stack spacing={0.75} sx={{ pl: 1 }}>
                    {activeChanges.map(({ jobId, change }) => {
                      const job = jobs.find((j) => j.id === jobId);
                      if (!job) return null;

                      const initialJob = initialJobs.find((j) => j.id === jobId) || job;
                      const prevOp = initialJob.vornr || '-';
                      const prevWc = change.previousWorkCenter;

                      const wcJobs = jobs.filter((j) => j.arbpl === change.currentWorkCenter);
                      const currentIndex = wcJobs.findIndex((j) => j.id === jobId);

                      let relationText = '';
                      if (wcJobs.length <= 1) {
                        relationText = `ท้ายคิวของ WC ${change.currentWorkCenter}`;
                      } else if (currentIndex === 0) {
                        const nextJob = wcJobs[1];
                        relationText = `ด้านบน Order ${nextJob.aufnr} OP ${nextJob.vornr || '-'} WC ${change.currentWorkCenter}`;
                      } else {
                        const prevJob = wcJobs[currentIndex - 1];
                        relationText = `ด้านล่าง Order ${prevJob.aufnr} OP ${prevJob.vornr || '-'} WC ${change.currentWorkCenter}`;
                      }

                      return (
                        <Box
                          key={jobId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            fontSize: '0.82rem',
                            color: '#01579b',
                            fontWeight: 700,
                          }}
                        >
                          <span style={{ color: '#64748b' }}>•</span>
                          <strong>Order {job.aufnr} OP {prevOp} WC {prevWc}</strong>
                          <span style={{ color: '#0288d1', fontWeight: 800 }}>➔</span>
                          <span style={{ color: '#0f172a' }}>{relationText}</span>
                        </Box>
                      );
                    })}
                  </Stack>
                </Alert>
              );
            })()}

            <Box
              sx={{
                opacity: isWorkCenterPending || planningView !== deferredPlanningView ? 0.6 : 1,
                pointerEvents: isWorkCenterPending || planningView !== deferredPlanningView ? 'none' : 'auto',
                transition: 'opacity 150ms ease-in-out',
              }}
            >
              {(isWorkCenterPending || planningView !== deferredPlanningView) && (
                <LinearProgress sx={{ height: 4, borderRadius: 2, mb: 1.5 }} />
              )}

              {deferredPlanningView === 'queue' ? (
                <RoutingBoard
                  workCenters={visibleWorkCenters}
                  groupedJobs={groupedJobs}
                  dirtyWorkCenters={dirtyWorkCenters}
                  selectedJobIds={selectedJobIds}
                  lacquerColorMap={lacquerColorMap}
                  collapsedGroups={collapsedGroups}
                  onToggleGroup={toggleGroupCollapse}
                  onToggleSelect={handleToggleSelect}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragOverJob={handleDragOver}
                  onDragLeaveJob={handleDragLeave}
                  onDropOnJob={handleDrop}
                  onDropToGroup={handleDropToProductGroup}
                  onDropToLane={handleDropToLane}
                  onDragEnd={handleDragEnd}
                />
              ) : deferredPlanningView === 'matrix' ? (
                <RoutingMatrix
                  workCenters={visibleWorkCenters}
                  groupedJobs={groupedJobs}
                  externalRoutingJobs={externalRoutingJobs}
                  selectedJobIds={selectedJobIds}
                  lacquerColorMap={lacquerColorMap}
                  collapsedGroups={collapsedGroups}
                  onToggleGroup={toggleGroupCollapse}
                  onToggleSelect={handleToggleSelect}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragOverJob={handleDragOver}
                  onDragLeaveJob={handleDragLeave}
                  onDropOnJob={handleDrop}
                  onDropToLane={handleDropToLane}
                  onDragEnd={handleDragEnd}
                />
              ) : (
                <Stack spacing={2}>
                  {visibleWorkCenters.map((item) => {
                    const workCenter = item.arbpl;
                    const group = groupedJobs[workCenter];
                    if (!group) return null;

                    return (
                      <Box key={workCenter}>
                        <WorkCenterCard
                          workCenter={workCenter}
                          group={group}
                          lacquerColorMap={lacquerColorMap}
                          collapsedGroups={collapsedGroups}
                          selectedJobIds={selectedJobIds}
                          sequenceChanges={sequenceChanges}
                          onToggleSelect={handleToggleSelect}
                          onToggleSelectAllGroup={handleToggleSelectAllGroup}
                          onToggleCollapse={toggleGroupCollapse}
                          onDragStart={handleDragStart}
                          onDrag={handleDrag}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onDropToGroup={handleDropToProductGroup}
                          onDragEnd={handleDragEnd}
                          onMoveJobOneStep={moveJobOneStep}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'right' }}>
              แสดง {formatNumber(visibleJobCount)} แถว / อัปเดตข้อมูลหน้าเว็บ {new Date(data.generatedAt).toLocaleString('th-TH')}
            </Typography>
          </Stack>
        </Container>

        {/* Floating Action Bar */}
        {hasDirtyChanges && showFloatingActionBar && (
          <PlanningActionBar
            isSaving={savingAll || savingWorkCenter !== null}
            onAutoArrange={() => {
              prioritizeUrgentJobs(scopedJobs.map((job) => job.id));
            }}
            onReset={() => {
              visibleWorkCenters.forEach((item) => resetWorkCenterToInitial(item.arbpl));
            }}
            onSave={saveAllDirty}
          />
        )}
        <PlanningAiAssistant jobs={scopedJobs} scopeLabel={aiScopeLabel} />
      </Box>
      <NotificationSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={handleSnackbarClose}
      />
    </LocalizationProvider>
  );
}
