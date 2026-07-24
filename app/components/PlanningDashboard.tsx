'use client';
'use client';

import * as React from 'react';
import NotificationSnackbar from './NotificationSnackbar';
import WorkCenterCard from './WorkCenterCard';
import RoutingBoard from './RoutingBoard';
import RoutingMatrix from './RoutingMatrix';
import PlanningActionButtons from './PlanningActionButtons';
import PlanningActionBar from './PlanningActionBar';
import type { SequenceChange } from './PlanningGroupTable';
import InteractiveDonutChart from './InteractiveDonutChart';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
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
  Category,
  Clock,
  Data,
  HambergerMenu,
  Setting2,
  StatusUp,
  TaskSquare,
} from 'iconsax-react';
import {
  cleanZpg2d,
  getJobGroupId,
  getJobGroupSortOrder,
  getQueueGroupId,
  getQueueGroupSortOrder,
  sortJobsWithZpg3dTransition,
} from '@/lib/zpg1d-helpers';
import type { PlanningDashboardData, PlanningJob } from '@/lib/planning';
import { movePlanningJobs } from '@/lib/planning-move';
import { findOperationPrecedenceViolation, formatOperationPrecedenceError } from '@/lib/operation-precedence';
import {
  rebaseHistoryAfterPartialSave,
  rebaseJobsAfterPartialSave,
  planningJobsStateEqual,
  undoPlanningHistory,
  type PlanningHistoryEntry,
} from '@/lib/planning-history';

const TARGET_WORK_CENTER_IDS = new Set(['111001', '111002', '111003', '111004', '111005']);
const STATUS_FILTER_OPTIONS = ['NOT START', 'START', 'WAIT'] as const;
const WORK_CENTER_QTY_COLORS: Record<string, string> = {
  '111001': '#1e3a8a',
  '111002': '#0e7490',
  '111003': '#6d28d9',
  '111004': '#78716c',
  '111005': '#334155',
};

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

function formatHoursAndMinutes(hours: number) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return `${formatNumber(wholeHours)} ชั่วโมง ${formatNumber(remainingMinutes)} นาที`;
}

function getStatusLabel(value: string | null) {
  return value?.trim().toUpperCase() || 'NOT START';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'START':
      return { color: '#1d4ed8', bgcolor: '#dbeafe', borderColor: '#3b82f6' };
    case 'WAIT':
      return { color: '#854d0e', bgcolor: '#fef9c3', borderColor: '#eab308' };
    case 'DONE':
      return { color: '#166534', bgcolor: '#dcfce7', borderColor: '#22c55e' };
    case 'NOT START':
      return { color: '#475569', bgcolor: '#f1f5f9', borderColor: '#94a3b8' };
    default:
      return { color: '#6d28d9', bgcolor: '#ede9fe', borderColor: '#ddd6fe' };
  }
}

function getOperationPrecedenceError(jobs: PlanningJob[], affectedJobIds?: number[]) {
  const affectedOrders = affectedJobIds
    ? new Set(jobs.filter((job) => affectedJobIds.includes(job.id)).map((job) => job.aufnr))
    : null;
  const validationJobs = affectedOrders
    ? jobs.filter((job) => affectedOrders.has(job.aufnr))
    : jobs;
  const violation = findOperationPrecedenceViolation(validationJobs);
  return violation ? formatOperationPrecedenceError(violation) : null;
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

function applyQuickMoveToJobs(
  current: PlanningJob[],
  jobId: number,
  targetWorkCenter: string,
  targetStartDate: string,
  targetFinishDate: string,
) {
  const currentJob = current.find((job) => job.id === jobId);
  if (!currentJob) return { jobs: current, affectedWorkCenters: new Set<string>() };

  const moveResult = movePlanningJobs({
    jobs: current,
    draggedJobIds: [jobId],
    targetWorkCenter,
    resequence: false,
    validatePrecedence: false,
    patchJob: (job) => ({
      ...job,
      stdate: targetStartDate,
      findate: targetFinishDate,
    }),
  });
  const { affectedWorkCenters } = moveResult;
  const reordered = moveResult.jobs;

  // Use the exact same setup-aware sorter as Default Setting. Sorting only by
  // date and the previous sequence can place a moved job differently from the
  // production planning logic (material, dimensions, color, and L/Q grouping).
  const sortedQueuesByWorkCenter = new Map<string, PlanningJob[]>();
  for (const workCenter of affectedWorkCenters) {
    const queue = sortJobsWithZpg3dTransition(
      reordered.filter((job) => job.arbpl === workCenter),
    )
      .map((job, index) => ({ ...job, seqno: index + 1 }));
    sortedQueuesByWorkCenter.set(workCenter, queue);
  }

  // Replace each affected Work Center in display order as well as updating its
  // seqno. The dashboard groups jobs by their array order, so only changing the
  // number would leave the moved job visually at the end of the queue.
  const jobs = reordered.map((job) => {
    const queue = sortedQueuesByWorkCenter.get(job.arbpl);
    return queue?.shift() ?? job;
  });

  const violation = findOperationPrecedenceViolation(
    jobs.filter((job) => job.aufnr === currentJob.aufnr),
  );
  if (violation) {
    return {
      jobs: current,
      affectedWorkCenters: new Set<string>(),
      validationError: formatOperationPrecedenceError(violation),
    };
  }

  return { jobs, affectedWorkCenters };
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
  const [isDefaultSettingProcessing, setIsDefaultSettingProcessing] = React.useState(false);
  const [jobsHistory, setJobsHistory] = React.useState<PlanningHistoryEntry[]>([]);
  const [highlightedJobIds, setHighlightedJobIds] = React.useState<Set<number>>(new Set());
  const [droppedJobIds, setDroppedJobIds] = React.useState<Set<number>>(new Set());

  const jobsRef = React.useRef(jobs);
  React.useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const pushToHistory = React.useCallback((affectedJobIds: number[] = []) => {
    setJobsHistory((prev) => [...prev, { state: jobsRef.current, affectedJobIds }]);
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

  // Sync state if prop changes
  React.useEffect(() => {
    jobsRef.current = filteredRawJobs;
    setJobs(filteredRawJobs);
    setInitialJobs(filteredRawJobs);
    setJobsHistory([]);
  }, [filteredRawJobs]);

  const sortedWorkCenters = React.useMemo(
    () => [...filteredRawWorkCenters].sort((a, b) => a.arbpl.localeCompare(b.arbpl, 'th', { numeric: true })),
    [filteredRawWorkCenters],
  );
  const quickMoveWorkCenters = React.useMemo(
    () => sortedWorkCenters.map((workCenter) => workCenter.arbpl),
    [sortedWorkCenters],
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
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>(() => [...STATUS_FILTER_OPTIONS]);
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
  const deferredStatuses = React.useDeferredValue(selectedStatuses);
  const deferredOrderSearch = React.useDeferredValue(orderSearch);

  const isWorkCenterPending =
    selectedWorkCenter !== deferredWorkCenter ||
    normalizedSelectedYear !== deferredYear ||
    normalizedSelectedMonth !== deferredMonth ||
    selectedStatuses !== deferredStatuses ||
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

  const handleQuickMove = React.useCallback((
    jobId: number,
    targetWorkCenter: string,
    targetStartDate: string,
    targetFinishDate: string,
  ) => {
    const previousJobs = jobsRef.current;
    const previousJob = previousJobs.find((job) => job.id === jobId);
    if (!previousJob) throw new Error('Job not found');

    const quickMove = applyQuickMoveToJobs(
      previousJobs,
      jobId,
      targetWorkCenter,
      targetStartDate,
      targetFinishDate,
    );
    const optimisticJobs = quickMove.jobs;
    if (quickMove.validationError) {
      setSnackbar({
        open: true,
        message: quickMove.validationError,
        severity: 'error',
      });
      return false;
    }
    if (planningJobsStateEqual(previousJobs, optimisticJobs)) return true;
    const movedJob = optimisticJobs.find((job) => job.id === jobId);
    pushToHistory([jobId]);
    jobsRef.current = optimisticJobs;
    setJobs(optimisticJobs);
    setLastMovedJobIds([jobId]);
    triggerDropHighlight([jobId]);
    setSnackbar({
      open: true,
      message: previousJob.arbpl === targetWorkCenter
        ? `จัด Seq ใหม่เป็น ${movedJob?.seqno ?? '-'} ตาม Start Date แล้ว — กรุณากดบันทึกเพื่อยืนยัน`
        : `ย้าย Order ${previousJob.aufnr} ไป Work Center ${targetWorkCenter} และจัด Seq ใหม่เป็น ${movedJob?.seqno ?? '-'} แล้ว — กรุณากดบันทึกเพื่อยืนยัน`,
      severity: 'info',
    });
    return true;
  }, [pushToHistory, triggerDropHighlight]);

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
  const dropConfirmRowsRef = React.useRef<HTMLElement[]>([]);
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
      dropConfirmRowsRef.current.forEach((row) => {
        row.classList.remove('drop-confirm-row', 'drop-confirm-before', 'drop-confirm-after');
      });
      dropConfirmRowsRef.current = [];
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
      document.body.classList.remove('planning-drag-active');
    };
  }, []);

  const dateAndOrderFilteredJobs = React.useMemo(() => {
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

      return true;
    });
  }, [jobs, deferredYear, deferredMonth, deferredOrderSearch]);
  const filteredJobs = React.useMemo(() => {
    const selectedStatusSet = new Set(deferredStatuses);
    return dateAndOrderFilteredJobs.filter((job) => selectedStatusSet.has(getStatusLabel(job.text1)));
  }, [dateAndOrderFilteredJobs, deferredStatuses]);

  const lacquerColorMap = React.useMemo(() => {
    const group3ByLacquerKey = new Map<string, string | null>();
    initialJobs.forEach((job) => {
      const key = getLacquerKey(job);
      if (!group3ByLacquerKey.has(key)) group3ByLacquerKey.set(key, job.zpg3d);
    });
    const lacquerKeys = Array.from(group3ByLacquerKey.keys()).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));

    const map = new Map<string, ReturnType<typeof createLacquerColor>>();
    lacquerKeys.forEach((key, index) => {
      map.set(key, getLacquerColorByGroup3(group3ByLacquerKey.get(key) ?? null, index));
    });
    return map;
  }, [initialJobs]);
  const routingOperationsByOrder = React.useMemo(() => {
    if (deferredPlanningView !== 'table') return new Map<string, PlanningJob[]>();

    const byOrder = new Map<string, PlanningJob[]>();
    for (const job of [...jobs, ...externalRoutingJobs]) {
      const operations = byOrder.get(job.aufnr);
      if (operations) {
        operations.push(job);
      } else {
        byOrder.set(job.aufnr, [job]);
      }
    }
    for (const operations of byOrder.values()) {
      operations.sort((a, b) => {
        const operationCompare = (a.vornr ?? '').localeCompare(b.vornr ?? '', 'th', { numeric: true });
        return operationCompare !== 0 ? operationCompare : a.sourceRow - b.sourceRow;
      });
    }
    return byOrder;
  }, [deferredPlanningView, externalRoutingJobs, jobs]);
  const externalRoutingJobIds = React.useMemo(
    () => new Set(externalRoutingJobs.map((job) => job.id)),
    [externalRoutingJobs],
  );
  const groupedJobs = React.useMemo(() => groupByWorkCenter(filteredJobs), [filteredJobs]);
  const matrixOrderSequence = React.useMemo(() => {
    const initialGroups = groupByWorkCenter(initialJobs);
    const seenOrders = new Set<string>();
    const sequence: string[] = [];

    for (const workCenter of sortedWorkCenters) {
      for (const job of initialGroups[workCenter.arbpl] ?? []) {
        if (seenOrders.has(job.aufnr)) continue;
        seenOrders.add(job.aufnr);
        sequence.push(job.aufnr);
      }
    }

    return sequence;
  }, [initialJobs, sortedWorkCenters]);
  const scopedJobs = React.useMemo(
    () =>
      deferredWorkCenter === 'ALL'
        ? filteredJobs
        : filteredJobs.filter((job) => job.arbpl === deferredWorkCenter),
    [filteredJobs, deferredWorkCenter],
  );
  const statusScopeJobs = React.useMemo(
    () =>
      deferredWorkCenter === 'ALL'
        ? dateAndOrderFilteredJobs
        : dateAndOrderFilteredJobs.filter((job) => job.arbpl === deferredWorkCenter),
    [dateAndOrderFilteredJobs, deferredWorkCenter],
  );
  const scopedGroups = React.useMemo(() => groupByWorkCenter(scopedJobs), [scopedJobs]);
  const totalChangeovers = React.useMemo(
    () => Object.values(scopedGroups).reduce((sum, group) => sum + calculateChangeovers(group), 0),
    [scopedGroups],
  );
  const visibleJobCount = scopedJobs.length;
  const machineTabIndex = React.useMemo(() => {
    if (selectedWorkCenter === 'ALL') return 0;
    const workCenterIndex = sortedWorkCenters.findIndex((item) => item.arbpl === selectedWorkCenter);
    return workCenterIndex >= 0 ? workCenterIndex + 1 : 0;
  }, [selectedWorkCenter, sortedWorkCenters]);
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
            job.queueGroup !== initJob.queueGroup ||
            job.stdate !== initJob.stdate ||
            job.findate !== initJob.findate ||
            job.seqno !== initJob.seqno;
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
    setLastMovedJobIds(jobIds);
  }, []);

  const saveAllDirty = React.useCallback(async () => {
    const workCentersToSave = dirtyList.length > 0
      ? dirtyList
      : sortedWorkCenters.map((item) => item.arbpl);
    if (workCentersToSave.length === 0) return;

    setSavingAll(true);
    setSnackbar({ open: false, message: '', severity: 'success' });

    const itemsToSave: Array<{ id: number; seqno: number; zpg1d: string | null; queueGroup: string | null; arbpl: string; stdate: string | null; findate: string | null }> = [];

    for (const wc of workCentersToSave) {
      const wcJobs = jobs.filter((j) => j.arbpl === wc);
      wcJobs.forEach((job, index) => {
        itemsToSave.push({
          id: job.id,
          seqno: index + 1,
          zpg1d: job.zpg1d,
          queueGroup: job.queueGroup,
          arbpl: job.arbpl,
          stdate: job.stdate,
          findate: job.findate,
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
        const result = await response.json().catch(() => null) as { error?: string } | null;
        setSnackbar({
          open: true,
          message: result?.error || 'บันทึกลำดับคิวล้มเหลว',
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

      jobsRef.current = savedJobs;
      setJobs(savedJobs);
      setJobsHistory([]); // Clear history on save
      setInitialJobs(savedJobs);
      setSelectedJobIds(new Set());
      setLastMovedJobIds([]);
      setSnackbar({
        open: true,
        message: `บันทึกเรียบร้อย! (${workCentersToSave.join(', ')})`,
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
      optime: Number(filteredJobs.reduce((sum, job) => sum + job.optime, 0).toFixed(1)),
      quantity: filteredJobs.reduce((sum, job) => sum + job.mgvrg, 0),
    }),
    [filteredJobs],
  );
  const scopedTotals = React.useMemo(
    () => ({
      jobs: scopedJobs.length,
      optime: Number(scopedJobs.reduce((sum, job) => sum + job.optime, 0).toFixed(1)),
      quantity: scopedJobs.reduce((sum, job) => sum + job.mgvrg, 0),
    }),
    [scopedJobs],
  );
  const statusBreakdown = React.useMemo(() => {
    const counts = new Map<string, number>([
      ['NOT START', 0],
      ['START', 0],
      ['WAIT', 0],
    ]);
    statusScopeJobs.forEach((job) => {
      const status = getStatusLabel(job.text1);
      if (counts.has(status)) counts.set(status, (counts.get(status) ?? 0) + 1);
    });

    const preferredOrder = new Map([
      ['NOT START', 0],
      ['START', 1],
      ['WAIT', 2],
    ]);
    return Array.from(counts, ([status, count]) => ({ status, count }))
      .sort((a, b) =>
        (preferredOrder.get(a.status) ?? Number.MAX_SAFE_INTEGER) -
        (preferredOrder.get(b.status) ?? Number.MAX_SAFE_INTEGER) ||
        a.status.localeCompare(b.status, 'th', { numeric: true }),
      );
  }, [statusScopeJobs]);

  const metricScopeLabel = selectedWorkCenter === 'ALL' ? 'รวมทุก Work center' : `Work center ${selectedWorkCenter}`;
  const showDropConfirmation = React.useCallback((jobIds: number | number[], placement: 'before' | 'after') => {
    const clearDropConfirmation = () => {
      dropConfirmRowsRef.current.forEach((row) => {
        row.classList.remove('drop-confirm-row', 'drop-confirm-before', 'drop-confirm-after');
      });
      dropConfirmRowsRef.current = [];
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
          const indicator = row.querySelector<HTMLElement>('[data-drop-indicator]');
          if (indicator) indicator.textContent = 'เพิ่งวางตรงนี้';
          rows.push(row);
        }
      });

      if (rows.length > 0) {
        dropConfirmRowsRef.current = rows;
        dropConfirmTimerRef.current = window.setTimeout(() => {
          clearDropConfirmation();
          dropConfirmTimerRef.current = null;
        }, 750);
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

    const moveResult = movePlanningJobs({
      jobs: jobsRef.current,
      draggedJobIds,
      targetWorkCenter: workCenter,
      targetJobId,
      position,
      patchJob: (job, targetJob) => ({
        ...job,
        queueGroup: targetJob && getQueueGroupId(targetJob) !== getJobGroupId(job.zpg1d)
          ? targetJob.queueGroup?.trim() || targetJob.zpg1d
          : null,
      }),
    });
    if (moveResult.validationError) {
      setSnackbar({ open: true, message: moveResult.validationError, severity: 'error' });
      return;
    }
    if (!moveResult.moved || planningJobsStateEqual(jobsRef.current, moveResult.jobs)) return;

    pushToHistory(draggedJobIds);
    jobsRef.current = moveResult.jobs;
    setJobs(moveResult.jobs);

    showDropConfirmation(draggedJobIds, position);
    triggerDropHighlight(draggedJobIds);
  }, [showDropConfirmation, triggerDropHighlight]);

  const moveJobOneStep = React.useCallback((
    workCenter: string,
    jobId: number,
    direction: 'up' | 'down',
  ) => {
    const targetIds = selectedJobIdsRef.current.has(jobId)
      ? Array.from(selectedJobIdsRef.current)
      : [jobId];
    setSnackbar((prev) => (prev.open ? { ...prev, open: false } : prev));
    const current = jobsRef.current;
    const workCenterJobs = current.filter((job) => job.arbpl === workCenter);
    const targetIndices = targetIds
      .map((id) => workCenterJobs.findIndex((job) => job.id === id))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);
    if (targetIndices.length === 0) return;
    const movedJobIds = targetIndices.map((index) => workCenterJobs[index].id);

    const firstIndex = targetIndices[0];
    const lastIndex = targetIndices[targetIndices.length - 1];
    if ((direction === 'up' && firstIndex === 0) ||
        (direction === 'down' && lastIndex === workCenterJobs.length - 1)) {
      setSnackbar({ open: true, message: 'ไม่สามารถเลื่อนต่อได้ เนื่องจากงานอยู่สุดขอบคิวแล้ว', severity: 'info' });
      return;
    }

    const targetJobs = targetIndices.map((index) => ({ ...workCenterJobs[index] }));
    const remainingJobs = workCenterJobs.filter((job) => !movedJobIds.includes(job.id));
    if (direction === 'up') {
      remainingJobs.splice(firstIndex - 1, 0, ...targetJobs);
      const neighborJob = remainingJobs[firstIndex];
      if (neighborJob) {
        targetJobs.forEach((job) => {
          job.queueGroup = getQueueGroupId(neighborJob) === getJobGroupId(job.zpg1d)
            ? null
            : neighborJob.queueGroup?.trim() || neighborJob.zpg1d;
        });
      }
    } else {
      const itemBelow = workCenterJobs[lastIndex + 1];
      const itemBelowIndex = remainingJobs.findIndex((job) => job.id === itemBelow.id);
      if (itemBelowIndex < 0) return;
      remainingJobs.splice(itemBelowIndex + 1, 0, ...targetJobs);
      targetJobs.forEach((job) => {
        job.queueGroup = getQueueGroupId(itemBelow) === getJobGroupId(job.zpg1d)
          ? null
          : itemBelow.queueGroup?.trim() || itemBelow.zpg1d;
      });
    }

    const queue = [...remainingJobs];
    const nextJobs = current.map((job) => (job.arbpl === workCenter ? queue.shift() ?? job : job));
    const validationError = getOperationPrecedenceError(nextJobs, movedJobIds);
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: 'error' });
      return;
    }
    if (planningJobsStateEqual(current, nextJobs)) return;

    pushToHistory(movedJobIds);
    jobsRef.current = nextJobs;
    setJobs(nextJobs);
    markLastMovedJobs(movedJobIds);
    showDropConfirmation(movedJobIds, direction === 'up' ? 'before' : 'after');
  }, [markLastMovedJobs, showDropConfirmation]);

  const applyAutoSequence = React.useCallback((workCenters: string[]) => {
    if (isDefaultSettingProcessing) return;

    setIsDefaultSettingProcessing(true);
    setSnackbar({
      open: true,
      message: 'กำลังจัดลำดับเริ่มต้นคิวงานทุกเครื่องจักร...',
      severity: 'info',
    });

    window.setTimeout(() => {
      try {
        pushToHistory();  // DEFAULT SETTING affects all jobs
        setJobs((current) => {
          const initialMap = new Map(initialJobs.map((j) => [j.id, j]));

          // 1. Restore all jobs to initial Excel database/uploaded values
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

          // 2. Group restored jobs by Work Center
          const byArbpl: Record<string, PlanningJob[]> = {};
          restored.forEach((job) => {
            byArbpl[job.arbpl] ??= [];
            byArbpl[job.arbpl].push(job);
          });

          // 3. Sort each Work Center using the transition sort helper
          const updatedJobs: PlanningJob[] = [];
          Object.keys(byArbpl).forEach((wc) => {
            const wcJobs = byArbpl[wc];
            const sorted = sortJobsWithZpg3dTransition(wcJobs);
            const resequenced = sorted.map((job, idx) => ({
              ...job,
              seqno: idx + 1,
            }));
            updatedJobs.push(...resequenced);
          });

          const wcJobIds = new Set(updatedJobs.map((j) => j.id));
          const remainingJobs = restored.filter((j) => !wcJobIds.has(j.id));

          return [...updatedJobs, ...remainingJobs];
        });

        setSnackbar({
          open: true,
          message: 'จัดเรียงคิวอัตโนมัติสำเร็จ! คืนค่าการจัดตำแหน่งและเครื่องจักรเริ่มต้นตาม Excel ทุกเครื่องจักร',
          severity: 'success',
        });
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
          stdate: job.stdate,
          findate: job.findate,
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
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setSnackbar({
        open: true,
        message: result?.error || `บันทึกลำดับของ ${workCenter} ไม่สำเร็จ`,
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
    const nextInitialJobs = rebaseJobsAfterPartialSave(
      initialJobs,
      savedJobs,
      affectedWorkCenters,
    );

    jobsRef.current = savedJobs;
    setJobs(savedJobs);
    setJobsHistory((history) => rebaseHistoryAfterPartialSave(
      history,
      savedJobs,
      affectedWorkCenters,
    ));
    setInitialJobs(nextInitialJobs);
    setSelectedJobIds(new Set());
    setLastMovedJobIds([]);

    setSnackbar({
      open: true,
      message: affectedList.length > 1
        ? `บันทึกการย้ายงานระหว่าง ${affectedList.join(' → ')} แล้ว`
        : `บันทึกลำดับของ ${workCenter} ลงฐานข้อมูลแล้ว`,
      severity: 'success',
    });
  }, [initialJobs, jobs, sequenceChanges]);

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
    document.body.classList.remove('planning-drag-active');
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
        dragOverRowRectRef.current = null;
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
        dragOverRowRectRef.current = null;
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
    document.body.classList.add('planning-drag-active');
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
      const moveResult = movePlanningJobs({
        jobs: jobsRef.current,
        draggedJobIds: draggedIds,
        targetWorkCenter: workCenter,
      });
      if (moveResult.validationError) {
        setSnackbar({ open: true, message: moveResult.validationError, severity: 'error' });
        draggingJobIdRef.current = null;
        stopDragAutoScroll();
        clearDragClasses();
        clearDraggingElements();
        return;
      }
      if (!moveResult.moved || planningJobsStateEqual(jobsRef.current, moveResult.jobs)) {
        draggingJobIdRef.current = null;
        stopDragAutoScroll();
        clearDragClasses();
        clearDraggingElements();
        return;
      }

      markLastMovedJobs(draggedIds);
      pushToHistory(draggedIds);
      jobsRef.current = moveResult.jobs;
      setJobs(moveResult.jobs);
      showDropConfirmation(draggedIds, 'after');
      triggerDropHighlight(draggedIds);
    }

    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    clearDraggingElements();
  }, [clearDragClasses, clearDraggingElements, markLastMovedJobs, showDropConfirmation, stopDragAutoScroll, triggerDropHighlight]);

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
      const current = jobsRef.current;
      const draggedIdSet = new Set(draggedIds);
      const draggedJobs = current.filter((job) => draggedIdSet.has(job.id));
      if (draggedJobs.length === 0) {
        draggingJobIdRef.current = null;
        stopDragAutoScroll();
        clearDragClasses();
        clearDraggingElements();
        return;
      }

      const remaining = current.filter((job) => !draggedIdSet.has(job.id));
      const targetWorkCenterJobs = remaining.filter((job) => job.arbpl === workCenter);
      const targetGroupId = getJobGroupId(groupLabel);
      const targetGroupOrder = getJobGroupSortOrder(groupLabel);
      const lastJobInGroup = targetWorkCenterJobs.reduce(
        (lastIndex, job, index) => getQueueGroupId(job) === targetGroupId ? index : lastIndex,
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
      const nextJobs = [...jobsOutsideTarget];
      nextJobs.splice(insertAt, 0, ...targetWorkCenterJobs);
      const validationError = getOperationPrecedenceError(nextJobs, draggedIds);
      if (validationError) {
        setSnackbar({ open: true, message: validationError, severity: 'error' });
        draggingJobIdRef.current = null;
        stopDragAutoScroll();
        clearDragClasses();
        clearDraggingElements();
        return;
      }
      if (planningJobsStateEqual(current, nextJobs)) {
        draggingJobIdRef.current = null;
        stopDragAutoScroll();
        clearDragClasses();
        clearDraggingElements();
        return;
      }

      pushToHistory(draggedIds);
      jobsRef.current = nextJobs;
      setJobs(nextJobs);
      markLastMovedJobs(draggedIds);
      showDropConfirmation(draggedIds, 'after');
      triggerDropHighlight(draggedIds);
    }

    draggingJobIdRef.current = null;
    stopDragAutoScroll();
    clearDragClasses();
    clearDraggingElements();
  }, [clearDragClasses, clearDraggingElements, markLastMovedJobs, showDropConfirmation, stopDragAutoScroll, triggerDropHighlight]);

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

                <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '0.02em' }}>
                  เครื่องจักร (Machines):
                </Typography>
              </Stack>

              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  flex: 1,
                  minWidth: 0,
                  gap: 0.5,
                  bgcolor: '#e9edf3',
                  p: 0.5,
                  borderRadius: '14px',
                  border: '1px solid rgba(15, 23, 42, 0.06)',
                  boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.08)',
                  overflowX: 'auto',
                  width: '100%',
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'smooth',
                  '&::-webkit-scrollbar': {
                    height: 0, // hide scrollbar for tabs
                  },
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: 132,
                    borderRadius: '10px',
                    bgcolor: '#4f46e5',
                    boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
                    transform: `translateX(${machineTabIndex * 136}px)`,
                    transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease, box-shadow 260ms ease',
                    willChange: 'transform',
                  }}
                />
                {/* "ดูทั้งหมด" Tab */}
                {(() => {
                  const isSelected = selectedWorkCenter === 'ALL';
                  return (
                    <Button
                      disableRipple
                      aria-pressed={isSelected}
                      onClick={() => handleWorkCenterChange('ALL')}
                      startIcon={<StatusUp size="16" variant={isSelected ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        zIndex: 1,
                        flex: '0 0 132px',
                        minWidth: 132,
                        px: 1,
                        py: 0.85,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 850,
                        fontSize: '0.85rem',
                        scrollSnapAlign: 'center',
                        transition: 'color 220ms ease, transform 160ms ease',
                        boxShadow: 'none !important',
                        bgcolor: 'transparent',
                        color: isSelected ? '#ffffff' : 'text.secondary',
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: isSelected ? '#ffffff' : 'text.primary',
                        },
                        '&:active': { transform: 'scale(0.97)' },
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
                      disableRipple
                      aria-pressed={isSelected}
                      onClick={() => handleWorkCenterChange(item.arbpl)}
                      startIcon={
                        <Box
                          component="img"
                          src="/machine.svg"
                          alt="machine"
                          sx={{
                            width: 20,
                            height: 20,
                            display: 'block',
                            opacity: isSelected ? 1 : 0.65,
                            filter: isSelected ? 'brightness(0) invert(1)' : 'none',
                          }}
                        />
                      }
                      sx={{
                        zIndex: 1,
                        flex: '0 0 132px',
                        minWidth: 132,
                        px: 1,
                        py: 0.85,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 850,
                        fontSize: '0.85rem',
                        scrollSnapAlign: 'center',
                        transition: 'color 220ms ease, transform 160ms ease',
                        boxShadow: 'none !important',
                        bgcolor: 'transparent',
                        color: isSelected ? '#ffffff' : 'text.secondary',
                        '&:hover': {
                          bgcolor: 'transparent',
                          color: isSelected ? '#ffffff' : 'text.primary',
                        },
                        '&:active': { transform: 'scale(0.97)' },
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
              elevation={0}
              sx={{
                borderRadius: 0,
                border: 0,
                bgcolor: 'transparent',
                boxShadow: 'none',
                overflow: 'visible',
              }}
            >
              <Stack spacing={1.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                    px: 0.25,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      สถานะงานตามขอบเขตที่เลือก
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {metricScopeLabel} ตามปี เดือน และ Order ที่เลือก
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`แสดง ${formatNumber(scopedTotals.jobs)} / ${formatNumber(filteredTotals.jobs)} งานในแผน`}
                    sx={{
                      opacity: isWorkCenterPending ? 0.65 : 1,
                      transition: 'opacity 150ms ease-in-out',
                      borderRadius: '8px',
                      fontWeight: 800,
                      color: '#4338ca',
                      bgcolor: '#eef2ff',
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    opacity: isWorkCenterPending ? 0.65 : 1,
                    transform: isWorkCenterPending ? 'translateY(4px)' : 'translateY(0)',
                    pointerEvents: isWorkCenterPending ? 'none' : 'auto',
                    transition: 'opacity 240ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                    gap: { xs: 1, md: 1.25 },
                    bgcolor: 'transparent',
                  }}
                >
                  {[
                    { label: 'งานทั้งหมด', value: formatNumber(scopedTotals.jobs), detail: undefined, statuses: undefined, icon: <TaskSquare size="20" color="#4f46e5" />, accent: '#4f46e5', bg: 'rgba(99, 102, 241, 0.03)', iconBg: 'rgba(99, 102, 241, 0.08)' },
                    { label: 'STATUS', value: '', detail: undefined, statuses: statusBreakdown, icon: <Clock size="20" color="#d97706" />, accent: '#d97706', bg: 'rgba(217, 119, 6, 0.03)', iconBg: 'rgba(217, 119, 6, 0.08)' },
                    { label: 'OP TIME', value: `${formatNumber(scopedTotals.optime)} ชม.`, detail: formatHoursAndMinutes(scopedTotals.optime), statuses: undefined, icon: <StatusUp size="20" color="#0891b2" />, accent: '#0891b2', bg: 'rgba(8, 145, 178, 0.03)', iconBg: 'rgba(8, 145, 178, 0.08)' },
                    { label: 'ORDER QTY', value: formatNumber(scopedTotals.quantity), detail: undefined, statuses: undefined, icon: <Data size="20" color="#059669" />, accent: '#059669', bg: 'rgba(5, 150, 105, 0.03)', iconBg: 'rgba(5, 150, 105, 0.08)' },
                    { label: 'เปลี่ยน L/Q', value: `${formatNumber(totalChangeovers)} ครั้ง`, detail: undefined, statuses: undefined, icon: <Setting2 size="20" color="#dc2626" />, accent: '#dc2626', bg: 'rgba(220, 38, 38, 0.03)', iconBg: 'rgba(220, 38, 38, 0.08)' },
                  ].map((metric) => (
                    <Paper
                      key={metric.label}
                      elevation={0}
                      sx={{
                        position: 'relative',
                        gridColumn: {
                          xs: 'span 12',
                          sm: metric.label === 'เปลี่ยน L/Q' ? 'span 12' : 'span 6',
                          lg: metric.label === 'งานทั้งหมด' || metric.label === 'STATUS' ? 'span 3' : 'span 2',
                        },
                        minWidth: 0,
                        minHeight: 158,
                        p: { xs: 2, md: 2.25 },
                        borderRadius: 3.5,
                        border: 0,
                        bgcolor: '#ffffff',
                        background: `radial-gradient(circle at 100% 0%, ${metric.accent}18 0%, transparent 48%), #ffffff`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%',
                        boxShadow: '0 4px 18px rgba(15, 23, 42, 0.035)',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          bgcolor: metric.accent,
                          boxShadow: `0 0 0 5px ${metric.accent}12`,
                        },
                      }}
                    >
                      <Stack spacing={1.3}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              flexShrink: 0,
                              borderRadius: 2,
                              bgcolor: metric.iconBg,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {metric.icon}
                          </Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                            {metric.label}
                          </Typography>
                        </Stack>
                        <Stack spacing={0.35}>
                          {metric.statuses ? (
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.55 }}>
                              {metric.statuses.map(({ status, count }) => {
                                const statusColor = getStatusColor(status);
                                return (
                                  <Box
                                    key={status}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: 0.5,
                                      minWidth: 0,
                                      px: 0.75,
                                      py: 0.45,
                                      color: statusColor.color,
                                      bgcolor: statusColor.bgcolor,
                                      border: 0,
                                      borderRadius: 1,
                                      boxShadow: `inset 3px 0 0 ${statusColor.borderColor}`,
                                    }}
                                  >
                                    <Typography noWrap sx={{ minWidth: 0, fontSize: '0.62rem', fontWeight: 900 }}>
                                      {status}
                                    </Typography>
                                    <Typography sx={{ flexShrink: 0, fontSize: '0.76rem', fontWeight: 950 }}>
                                      {formatNumber(count)}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          ) : (
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-0.045em', lineHeight: 1.05, fontSize: { xs: '1.65rem', lg: '1.8rem' } }}>
                                {metric.value}
                              </Typography>
                              {metric.detail && (
                                <Typography sx={{ mt: 0.45, color: '#64748b', fontSize: '0.7rem', fontWeight: 750, lineHeight: 1.3 }}>
                                  {metric.detail}
                                </Typography>
                              )}
                            </Box>
                          )}
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
                gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
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

                    <Box
                      role="group"
                      aria-labelledby="status-filter-label"
                      sx={{ p: 1.25, border: '1px solid #cbd5e1', borderRadius: '10px', bgcolor: '#ffffff' }}
                    >
                      <Typography id="status-filter-label" sx={{ mb: 0.75, color: '#475569', fontSize: '0.75rem', fontWeight: 850 }}>
                        สถานะ (Status)
                      </Typography>
                      <Box
                        component="label"
                        sx={{ display: 'flex', alignItems: 'center', width: 'fit-content', mb: 0.65, color: '#334155', cursor: 'pointer' }}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedStatuses.length === STATUS_FILTER_OPTIONS.length}
                          indeterminate={selectedStatuses.length > 0 && selectedStatuses.length < STATUS_FILTER_OPTIONS.length}
                          onChange={(event) => {
                            setSelectedStatuses(event.target.checked ? [...STATUS_FILTER_OPTIONS] : []);
                          }}
                          sx={{ p: 0.35, mr: 0.5 }}
                        />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 900 }}>ทั้งหมด</Typography>
                      </Box>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.65 }}>
                        {STATUS_FILTER_OPTIONS.map((status) => {
                          const checked = selectedStatuses.includes(status);
                          const statusColor = getStatusColor(status);
                          return (
                            <Box
                              key={status}
                              component="label"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                minWidth: 0,
                                px: 0.5,
                                py: 0.3,
                                color: checked ? statusColor.color : '#64748b',
                                bgcolor: checked ? statusColor.bgcolor : '#f8fafc',
                                border: '1px solid',
                                borderColor: checked ? statusColor.borderColor : '#e2e8f0',
                                borderRadius: 1.25,
                                cursor: 'pointer',
                                transition: 'color 160ms ease, background-color 160ms ease, border-color 160ms ease',
                              }}
                            >
                              <Checkbox
                                size="small"
                                checked={checked}
                                onChange={(event) => {
                                  setSelectedStatuses((current) => {
                                    const next = new Set(current);
                                    if (event.target.checked) next.add(status);
                                    else next.delete(status);
                                    return STATUS_FILTER_OPTIONS.filter((option) => next.has(option));
                                  });
                                }}
                                sx={{
                                  p: 0.2,
                                  mr: 0.35,
                                  color: statusColor.borderColor,
                                  '&.Mui-checked': { color: statusColor.borderColor },
                                }}
                              />
                              <Typography noWrap sx={{ minWidth: 0, fontSize: '0.68rem', fontWeight: 900 }}>
                                {status}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>

                    </Box>

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
                          selectedStatuses.length === STATUS_FILTER_OPTIONS.length &&
                          orderSearch === ''
                        }
                        onClick={() => {
                          setSelectedWorkCenter(defaultWorkCenter);
                          setSelectedYear('ALL');
                          setSelectedMonth('ALL');
                          setSelectedStatuses([...STATUS_FILTER_OPTIONS]);
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
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'text.primary' }}>
                      โหลดงานตาม Work center
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
                      เปรียบเทียบจำนวนงานและ Order Qty พร้อมสัดส่วน QTY รวมทุก Work Center
                    </Typography>
                  </Box>
                  {(() => {
                    const workCenterLoads = sortedWorkCenters.map((item) => {
                      const filteredGroup = groupedJobs[item.arbpl] ?? [];
                      return {
                        ...item,
                        jobCount: filteredGroup.length,
                        orderQuantity: filteredGroup.reduce((sum, job) => sum + job.mgvrg, 0),
                        color: WORK_CENTER_QTY_COLORS[item.arbpl] ?? '#64748b',
                      };
                    });
                    const maxJobsCount = Math.max(...workCenterLoads.map((item) => item.jobCount), 0);
                    const maxOrderQuantity = Math.max(...workCenterLoads.map((item) => item.orderQuantity), 0);
                    const totalOrderQuantity = workCenterLoads.reduce((total, item) => total + item.orderQuantity, 0);
                    return (
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: { xs: 2.5, lg: 3 } }}>
                        <Stack spacing={2}>
                          {workCenterLoads.map((item) => {
                            const jobPercent = maxJobsCount > 0 ? (item.jobCount / maxJobsCount) * 100 : 0;
                            const orderQuantityPercent = maxOrderQuantity > 0 ? (item.orderQuantity / maxOrderQuantity) * 100 : 0;

                            return (
                              <Box key={item.arbpl}>
                                <Typography variant="body2" sx={{ mb: 0.8, fontWeight: 900, color: 'text.primary' }}>
                                  เครื่องจักร {item.arbpl}
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: { xs: 1, sm: 1.5 } }}>
                                  <Box>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.45, alignItems: 'center' }}>
                                      <Typography variant="caption" sx={{ color: '#4f46e5', fontWeight: 850 }}>จำนวนงาน</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>
                                        {formatNumber(item.jobCount)} งาน
                                      </Typography>
                                    </Stack>
                                    <LinearProgress
                                      variant="determinate"
                                      value={Math.min(jobPercent, 100)}
                                      sx={{
                                        height: 9,
                                        borderRadius: 999,
                                        bgcolor: 'rgba(79, 70, 229, 0.08)',
                                        '& .MuiLinearProgress-bar': { backgroundColor: '#4f46e5', borderRadius: 999 },
                                      }}
                                    />
                                  </Box>
                                  <Box>
                                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.45, alignItems: 'center', gap: 1 }}>
                                      <Typography variant="caption" sx={{ color: '#0891b2', fontWeight: 850 }}>ORDER QTY</Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>
                                        {formatNumber(item.orderQuantity)}
                                      </Typography>
                                    </Stack>
                                    <LinearProgress
                                      variant="determinate"
                                      value={Math.min(orderQuantityPercent, 100)}
                                      sx={{
                                        height: 9,
                                        borderRadius: 999,
                                        bgcolor: 'rgba(8, 145, 178, 0.1)',
                                        '& .MuiLinearProgress-bar': { backgroundColor: '#0891b2', borderRadius: 999 },
                                      }}
                                    />
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Stack>

                        <Box sx={{ borderLeft: { lg: '1px solid #e2e8f0' }, borderTop: { xs: '1px solid #e2e8f0', lg: 0 }, pl: { lg: 3 }, pt: { xs: 2.5, lg: 0 } }}>
                          <Typography sx={{ color: '#334155', fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 1 }}>
                            สัดส่วน ORDER QTY
                          </Typography>
                          <InteractiveDonutChart
                            data={workCenterLoads.map((item) => ({
                              id: item.arbpl,
                              label: item.arbpl,
                              value: item.orderQuantity,
                              color: item.color,
                              jobCount: item.jobCount,
                            }))}
                            selectedValue={selectedWorkCenter}
                            onSelect={setSelectedWorkCenter}
                            totalValue={totalOrderQuantity}
                          />
                        </Box>
                      </Box>
                    );
                  })()}
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
                      {selectedJobIds.size > 0 && (
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Chip
                            role="status"
                            aria-live="polite"
                            label={`เลือกแล้ว ${formatNumber(selectedJobIds.size)} รายการ`}
                            size="small"
                            sx={{
                              height: 24,
                              borderRadius: 1.5,
                              bgcolor: '#eef2ff',
                              color: '#4338ca',
                              border: '1px solid #c7d2fe',
                              fontSize: '0.75rem',
                              fontWeight: 900,
                            }}
                          />
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setSelectedJobIds(new Set())}
                            sx={{
                              minWidth: 0,
                              px: 1,
                              py: 0.25,
                              color: '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'none',
                              '&:hover': {
                                color: '#dc2626',
                                bgcolor: '#fef2f2',
                              },
                            }}
                          >
                            ล้างรายการที่เลือก
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                    <Typography variant={'body2'} sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5 }}>
                      ลาก Order ขึ้นลงเพื่อจัดลำดับ หรือลากข้ามคอลัมน์เพื่อเปลี่ยน Work Center
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: { xs: 'space-between', md: 'initial' } }}>
                    <PlanningActionButtons
                      isDirty={visibleWorkCenters.some((item) => dirtyWorkCenters.get(item.arbpl) ?? false)}
                      isSaving={savingAll || savingWorkCenter !== null}
                      isSequencing={isDefaultSettingProcessing}
                      onAutoSequence={() => {
                        applyAutoSequence(visibleWorkCenters.map((item) => item.arbpl));
                      }}
                      onSave={() => {
                        if (deferredWorkCenter === 'ALL') {
                          void saveAllDirty();
                        } else {
                          void saveSequence(deferredWorkCenter);
                        }
                      }}
                      onExport={() => {
                        const params = new URLSearchParams({
                          orderSearch: deferredOrderSearch,
                          year: String(deferredYear),
                          month: String(deferredMonth),
                          statuses: deferredStatuses.join(','),
                          workCenter: deferredWorkCenter === 'ALL' ? '' : (deferredWorkCenter || ''),
                        });
                        window.location.href = `/api/jobs/export-excel?${params.toString()}`;
                      }}
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.05)' }} />

                {/* Second Row: View Switcher */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      width: { xs: '100%', sm: 500 },
                      p: 0.5,
                      bgcolor: '#e9edf3',
                      borderRadius: 3,
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.08)',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      aria-hidden
                      sx={{
                        position: 'absolute',
                        top: 4,
                        bottom: 4,
                        left: 4,
                        width: 'calc((100% - 8px) / 3)',
                        borderRadius: 2.25,
                        bgcolor:
                          planningView === 'table' ? '#334155' :
                            planningView === 'queue' ? '#4f46e5' : '#0891b2',
                        boxShadow:
                          planningView === 'table' ? '0 3px 10px rgba(51, 65, 85, 0.28)' :
                            planningView === 'queue' ? '0 3px 10px rgba(79, 70, 229, 0.3)' :
                              '0 3px 10px rgba(8, 145, 178, 0.3)',
                        transform: `translateX(${planningView === 'table' ? 0 : planningView === 'queue' ? 100 : 200}%)`,
                        transition: 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease, box-shadow 260ms ease',
                        willChange: 'transform',
                      }}
                    />
                    <Button
                      size={'small'}
                      disableRipple
                      aria-pressed={planningView === 'table'}
                      onClick={() => setPlanningView('table')}
                      startIcon={<TaskSquare size="15" variant={planningView === 'table' ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        zIndex: 1,
                        flex: 1,
                        minWidth: 0,
                        px: { xs: 0.5, sm: 1.5 },
                        py: 0.85,
                        borderRadius: 2.25,
                        fontWeight: 800,
                        fontSize: { xs: '0.7rem', sm: '0.82rem' },
                        textTransform: 'none',
                        color: planningView === 'table' ? '#ffffff' : '#64748b',
                        bgcolor: 'transparent',
                        transition: 'color 220ms ease, transform 160ms ease',
                        '&:hover': { bgcolor: 'transparent' },
                        '&:active': { transform: 'scale(0.97)' },
                      }}
                    >
                      Detailed Table
                    </Button>
                    <Button
                      size={'small'}
                      disableRipple
                      aria-pressed={planningView === 'queue'}
                      onClick={() => setPlanningView('queue')}
                      startIcon={<Category size="15" variant={planningView === 'queue' ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        zIndex: 1,
                        flex: 1,
                        minWidth: 0,
                        px: { xs: 0.5, sm: 1.5 },
                        py: 0.85,
                        borderRadius: 2.25,
                        fontWeight: 800,
                        fontSize: { xs: '0.7rem', sm: '0.82rem' },
                        textTransform: 'none',
                        color: planningView === 'queue' ? '#ffffff' : '#64748b',
                        bgcolor: 'transparent',
                        transition: 'color 220ms ease, transform 160ms ease',
                        '&:hover': { bgcolor: 'transparent' },
                        '&:active': { transform: 'scale(0.97)' },
                      }}
                    >
                      Compact Queue
                    </Button>
                    <Button
                      size={'small'}
                      disableRipple
                      aria-pressed={planningView === 'matrix'}
                      onClick={() => setPlanningView('matrix')}
                      startIcon={<Data size="15" variant={planningView === 'matrix' ? 'Bold' : 'Outline'} color="currentColor" />}
                      sx={{
                        zIndex: 1,
                        flex: 1,
                        minWidth: 0,
                        px: { xs: 0.5, sm: 1.5 },
                        py: 0.85,
                        borderRadius: 2.25,
                        fontWeight: 800,
                        fontSize: { xs: '0.7rem', sm: '0.82rem' },
                        textTransform: 'none',
                        color: planningView === 'matrix' ? '#ffffff' : '#64748b',
                        bgcolor: 'transparent',
                        transition: 'color 220ms ease, transform 160ms ease',
                        '&:hover': { bgcolor: 'transparent' },
                        '&:active': { transform: 'scale(0.97)' },
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
                transform: isWorkCenterPending || planningView !== deferredPlanningView ? 'translateY(4px)' : 'translateY(0)',
                pointerEvents: isWorkCenterPending || planningView !== deferredPlanningView ? 'none' : 'auto',
                transition: 'opacity 240ms ease, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
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
                  highlightedJobIds={highlightedJobIds}
                  droppedJobIds={droppedJobIds}
                  onQuickMove={handleQuickMove}
                  quickMoveWorkCenters={quickMoveWorkCenters}
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
                  orderSequence={matrixOrderSequence}
                  externalRoutingJobs={externalRoutingJobs}
                  selectedJobIds={selectedJobIds}
                  highlightedJobIds={highlightedJobIds}
                  droppedJobIds={droppedJobIds}
                  onQuickMove={handleQuickMove}
                  quickMoveWorkCenters={quickMoveWorkCenters}
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
                          routingOperationsByOrder={routingOperationsByOrder}
                          externalRoutingJobIds={externalRoutingJobIds}
                          lacquerColorMap={lacquerColorMap}
                          collapsedGroups={collapsedGroups}
                          selectedJobIds={selectedJobIds}
                          sequenceChanges={sequenceChanges}
                          highlightedJobIds={highlightedJobIds}
                          droppedJobIds={droppedJobIds}
                          onQuickMove={handleQuickMove}
                          workCenters={quickMoveWorkCenters}
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

        {hasDirtyChanges && showFloatingActionBar && (
          <PlanningActionBar
            isSaving={savingAll || savingWorkCenter !== null || isDefaultSettingProcessing}
            onReset={() => {
              const undoResult = undoPlanningHistory(jobsRef.current, initialJobs, jobsHistory);
              setJobsHistory(undoResult.history);
              jobsRef.current = undoResult.jobs;
              setJobs(undoResult.jobs);

              if (undoResult.affectedJobIds.length > 0) {
                  const changedIds = new Set<number>(undoResult.affectedJobIds);
                  setHighlightedJobIds(changedIds);
                  window.setTimeout(() => {
                    setHighlightedJobIds((prev) => {
                      const next = new Set(prev);
                      changedIds.forEach((id) => next.delete(id));
                      return next;
                    });
                  }, 1000);
              }

              setSnackbar({
                open: true,
                message: undoResult.changed
                  ? `ย้อนกลับการทำรายการล่าสุดแล้ว${undoResult.affectedJobIds.length > 1 ? ` (${undoResult.affectedJobIds.length} OP)` : ''}`
                  : 'ไม่มีรายการที่สามารถ Undo เพิ่มได้',
                severity: 'info',
              });
            }}
            resetLabel="UNDO"
            onSave={saveAllDirty}
          />
        )}
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
