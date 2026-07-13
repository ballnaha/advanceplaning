'use client';

import * as React from 'react';
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Clock, HambergerMenu } from 'iconsax-react';
import { ZPG1D_GROUPS, cleanZpg2d, getJobGroupId } from '@/lib/zpg1d-helpers';
import type { PlanningJob, WorkCenterSummary } from '@/lib/planning';
import JobDetailDialog from './JobDetailDialog';

type LacquerColor = { bg: string; chipBg: string; text: string; border: string };

type RoutingBoardProps = {
  workCenters: WorkCenterSummary[];
  groupedJobs: Record<string, PlanningJob[]>;
  dirtyWorkCenters: Map<string, boolean>;
  selectedJobIds: Set<number>;
  lacquerColorMap: Map<string, LacquerColor>;
  onToggleSelect: (jobId: number) => void;
  onDragStart: (event: React.DragEvent<HTMLElement>, jobId: number) => void;
  onDrag: (event: React.DragEvent<HTMLElement>) => void;
  onDragOverJob: (event: React.DragEvent<HTMLElement>, jobId: number) => void;
  onDragLeaveJob: (event: React.DragEvent<HTMLElement>) => void;
  onDropOnJob: (event: React.DragEvent<HTMLElement>, targetJobId: number, workCenter: string) => void;
  onDropToLane: (event: React.DragEvent<HTMLElement>, workCenter: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLElement>) => void;
};

const fallbackLacquerColor: LacquerColor = {
  bg: 'rgba(100, 116, 139, 0.06)',
  chipBg: 'rgba(100, 116, 139, 0.1)',
  text: '#475569',
  border: 'rgba(100, 116, 139, 0.24)',
};

const numberFormatter = new Intl.NumberFormat('th-TH');
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : '-';
}

function getStatusStyle(status: string | null) {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return { label: 'DONE', color: '#047857', bgcolor: '#ecfdf5', borderColor: '#a7f3d0' };
    case 'START':
      return { label: 'START', color: '#0369a1', bgcolor: '#f0f9ff', borderColor: '#bae6fd' };
    case 'WAIT':
      return { label: 'WAIT', color: '#b45309', bgcolor: '#fffbeb', borderColor: '#fde68a' };
    default:
      return { label: status || 'NOT START', color: '#64748b', bgcolor: '#f8fafc', borderColor: '#e2e8f0' };
  }
}

function isUrgent(value: string | null) {
  if (!value) return false;
  const finish = new Date(`${value}T00:00:00`).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return finish - today.getTime() <= 3 * 86_400_000;
}

const RoutingOrderCard = React.memo(function RoutingOrderCard({
  job,
  index,
  selected,
  lacquerColor,
  onToggleSelect,
  onOpen,
  onDragStart,
  onDrag,
  onDragOverJob,
  onDragLeaveJob,
  onDropOnJob,
  onDragEnd,
}: {
  job: PlanningJob;
  index: number;
  selected: boolean;
  lacquerColor: LacquerColor;
  onToggleSelect: (jobId: number) => void;
  onOpen: (job: PlanningJob) => void;
  onDragStart: RoutingBoardProps['onDragStart'];
  onDrag: RoutingBoardProps['onDrag'];
  onDragOverJob: RoutingBoardProps['onDragOverJob'];
  onDragLeaveJob: RoutingBoardProps['onDragLeaveJob'];
  onDropOnJob: RoutingBoardProps['onDropOnJob'];
  onDragEnd: RoutingBoardProps['onDragEnd'];
}) {
  const status = getStatusStyle(job.text1);
  const group = ZPG1D_GROUPS.find((item) => item.id === getJobGroupId(job.zpg1d));
  const urgent = isUrgent(job.findate);

  return (
    <Paper
      data-job-id={job.id}
      draggable
      onDragStart={(event) => onDragStart(event, job.id)}
      onDrag={onDrag}
      onDragOver={(event) => {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY > rect.top + rect.height / 2 ? 'after' : 'before';
        if (event.currentTarget.dataset.dropPosition !== position) {
          event.currentTarget.dataset.dropPosition = position;
          const indicator = event.currentTarget.querySelector<HTMLElement>('[data-drop-indicator]');
          const nextLabel = position === 'after'
            ? `แทรกหลังลำดับ ${String(index + 1).padStart(2, '0')}`
            : `แทรกก่อนลำดับ ${String(index + 1).padStart(2, '0')}`;
          if (indicator) indicator.textContent = nextLabel;
        }
        onDragOverJob(event, job.id);
      }}
      onDragLeave={onDragLeaveJob}
      onDrop={(event) => {
        event.stopPropagation();
        onDropOnJob(event, job.id, job.arbpl);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(job)}
      elevation={0}
      sx={{
        position: 'relative',
        contentVisibility: 'auto',
        containIntrinsicSize: '150px',
        willChange: 'transform, opacity',
        overflow: 'visible',
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: selected ? '#818cf8' : 'rgba(15, 23, 42, 0.09)',
        bgcolor: selected ? '#f5f7ff' : '#ffffff',
        boxShadow: selected
          ? '0 0 0 2px rgba(99, 102, 241, 0.1), 0 8px 20px rgba(15, 23, 42, 0.08)'
          : '0 4px 12px rgba(15, 23, 42, 0.045)',
        transition: 'border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease, opacity 150ms ease',
        '&:hover': {
          borderColor: 'rgba(79, 70, 229, 0.34)',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.09)',
          transform: 'translateY(-1px)',
        },
        '&.dragging-row': { opacity: 0.36, transform: 'scale(0.98)' },
        '&.drop-target-row': { borderColor: '#4f46e5', bgcolor: '#f5f7ff', transform: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.12)' },
        '&.drop-before-row::before, &.drop-after-row::after': {
          content: '""',
          position: 'absolute',
          left: -3,
          right: -3,
          height: 3,
          zIndex: 5,
          borderRadius: 999,
          bgcolor: '#4f46e5',
          boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.12)',
        },
        '&.drop-before-row::before': { top: -7 },
        '&.drop-after-row::after': { bottom: -7 },
        '& .drop-position-indicator': {
          display: 'none',
          position: 'absolute',
          left: 10,
          zIndex: 8,
          px: 1,
          py: 0.35,
          borderRadius: 1,
          bgcolor: '#4f46e5',
          color: '#ffffff',
          fontSize: '0.68rem',
          lineHeight: 1.2,
          fontWeight: 900,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 6px 16px rgba(79, 70, 229, 0.28)',
        },
        '&.drop-target-row .drop-position-indicator': { display: 'block' },
        '&.drop-before-row .drop-position-indicator': { top: -17 },
        '&.drop-after-row .drop-position-indicator': { bottom: -17 },
        '&.drop-confirm-row': { animation: 'dropConfirmRow 1100ms ease-out' },
      }}
    >
      <Box data-drop-indicator className="drop-position-indicator" />
      <Box sx={{ display: 'grid', gridTemplateColumns: '5px minmax(0, 1fr)', minHeight: 138 }}>
        <Box sx={{ bgcolor: lacquerColor.text, borderRadius: '8px 0 0 8px' }} />
        <Box sx={{ p: 1.25 }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Checkbox
                size="small"
                checked={selected}
                onClick={(event) => event.stopPropagation()}
                onChange={() => onToggleSelect(job.id)}
                sx={{ p: 0.25, ml: -0.35 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 850 }}>
                  #{String(index + 1).padStart(2, '0')}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 950, lineHeight: 1.15, color: '#172033' }}>
                  {job.aufnr}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Chip
                label={status.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.64rem',
                  fontWeight: 900,
                  color: status.color,
                  bgcolor: status.bgcolor,
                  border: '1px solid',
                  borderColor: status.borderColor,
                }}
              />
              <Tooltip title="ลากเพื่อจัดลำดับหรือย้าย Work Center" arrow>
                <IconButton
                  size="small"
                  onClick={(event) => event.stopPropagation()}
                  sx={{ p: 0.35, cursor: 'grab', color: '#94a3b8', '&:active': { cursor: 'grabbing' } }}
                >
                  <HambergerMenu size="17" color="currentColor" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.65, color: '#64748b', fontWeight: 700 }}>
            {job.zptkx || '-'}
          </Typography>

          <Stack direction="row" spacing={0.5} sx={{ mt: 0.55, alignItems: 'center', minWidth: 0 }}>
            <Typography variant="caption" sx={{ flex: '0 0 auto', color: '#94a3b8', fontWeight: 900 }}>OP</Typography>
            <Typography variant="caption" noWrap sx={{ minWidth: 0, color: '#334155', fontWeight: 850 }}>
              {[job.vornr, job.ltxa1].filter(Boolean).join(' ') || '-'}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ mt: 0.65, minWidth: 0, overflow: 'hidden' }}>
            <Chip
              size="small"
              label={job.zpg2d ? cleanZpg2d(job.zpg2d) : group?.label || '-'}
              sx={{ height: 21, maxWidth: '45%', color: '#4f46e5', bgcolor: '#eef2ff', fontWeight: 850 }}
            />
            <Chip
              size="small"
              label={job.zltkx || '-'}
              sx={{
                height: 21,
                maxWidth: '55%',
                color: lacquerColor.text,
                bgcolor: lacquerColor.chipBg,
                border: `1px solid ${lacquerColor.border}`,
                fontWeight: 850,
              }}
            />
          </Stack>

          <Stack
            direction="row"
            sx={{ mt: 0.75, pt: 0.65, borderTop: '1px solid rgba(15, 23, 42, 0.06)', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Clock size="13" color={urgent ? '#dc2626' : '#64748b'} />
              <Typography variant="caption" noWrap sx={{ color: urgent ? '#b91c1c' : '#64748b', fontWeight: 850 }}>
                Finish {formatDate(job.findate)}
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ flex: '0 0 auto', color: 'text.secondary', fontWeight: 850 }}>
              {numberFormatter.format(Number(job.optime.toFixed(1)))} ชม.
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
});

export default function RoutingBoard({
  workCenters,
  groupedJobs,
  dirtyWorkCenters,
  selectedJobIds,
  lacquerColorMap,
  onToggleSelect,
  onDragStart,
  onDrag,
  onDragOverJob,
  onDragLeaveJob,
  onDropOnJob,
  onDropToLane,
  onDragEnd,
}: RoutingBoardProps) {
  const [selectedJob, setSelectedJob] = React.useState<PlanningJob | null>(null);
  const [activeLane, setActiveLane] = React.useState<string | null>(null);
  const [laneOrderFilters, setLaneOrderFilters] = React.useState<Record<string, string>>({});
  const activeLaneRef = React.useRef<string | null>(null);
  const maxHours = React.useMemo(
    () => Math.max(...workCenters.map((item) => (groupedJobs[item.arbpl] ?? []).reduce((sum, job) => sum + job.optime, 0)), 1),
    [groupedJobs, workCenters],
  );
  const activateLane = React.useCallback((workCenter: string) => {
    if (activeLaneRef.current === workCenter) return;
    activeLaneRef.current = workCenter;
    setActiveLane(workCenter);
  }, []);
  const clearActiveLane = React.useCallback(() => {
    if (activeLaneRef.current === null) return;
    activeLaneRef.current = null;
    setActiveLane(null);
  }, []);
  const handleCardDragEnd = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    clearActiveLane();
    onDragEnd(event);
  }, [clearActiveLane, onDragEnd]);

  return (
    <>
      <Box
        sx={{
          overflowX: 'auto',
          pb: 1,
          scrollSnapType: 'x proximity',
          '&::-webkit-scrollbar': { height: 10 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(100, 116, 139, 0.25)', borderRadius: 999 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.max(workCenters.length, 1)}, minmax(300px, 1fr))`,
            gap: 1.25,
            minWidth: workCenters.length > 1 ? `${workCenters.length * 314}px` : '100%',
            alignItems: 'start',
          }}
        >
          {workCenters.map((workCenter, laneIndex) => {
            const jobs = groupedJobs[workCenter.arbpl] ?? [];
            const laneOrderFilter = laneOrderFilters[workCenter.arbpl] ?? '';
            const normalizedLaneFilter = laneOrderFilter.trim().toLocaleUpperCase('th-TH');
            const visibleJobs = normalizedLaneFilter
              ? jobs.filter((job) => job.aufnr.toLocaleUpperCase('th-TH').includes(normalizedLaneFilter))
              : jobs;
            const jobIndexById = new Map(jobs.map((job, index) => [job.id, index]));
            const hours = jobs.reduce((sum, job) => sum + job.optime, 0);
            const isDirty = dirtyWorkCenters.get(workCenter.arbpl) ?? false;
            const isActive = activeLane === workCenter.arbpl;

            return (
              <Paper
                key={workCenter.arbpl}
                elevation={0}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  activateLane(workCenter.arbpl);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clearActiveLane();
                }}
                onDrop={(event) => {
                  clearActiveLane();
                  onDropToLane(event, workCenter.arbpl);
                }}
                sx={{
                  scrollSnapAlign: 'start',
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: isActive ? '#6366f1' : 'rgba(15, 23, 42, 0.08)',
                  bgcolor: isActive ? '#f3f5ff' : '#f8fafc',
                  boxShadow: isActive ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : '0 8px 24px rgba(15, 23, 42, 0.04)',
                  transition: 'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                }}
              >
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 3,
                    p: 1.5,
                    bgcolor: '#ffffff',
                    borderTop: `4px solid ${['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed'][laneIndex % 5]}`,
                    borderBottom: '1px solid rgba(15, 23, 42, 0.07)',
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 950, color: '#172033', letterSpacing: '-0.01em' }}>
                          WC {workCenter.arbpl}
                        </Typography>
                        {isDirty && <Box title="มีการเปลี่ยนแปลงที่ยังไม่บันทึก" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />}
                      </Stack>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>
                        {normalizedLaneFilter
                          ? `${numberFormatter.format(visibleJobs.length)} / ${numberFormatter.format(jobs.length)} Orders`
                          : `${numberFormatter.format(jobs.length)} Orders`} · {numberFormatter.format(Number(hours.toFixed(1)))} ชม.
                      </Typography>
                    </Box>
                    <Chip label={`#${laneIndex + 1}`} size="small" sx={{ height: 22, fontWeight: 900, bgcolor: '#f1f5f9', color: '#64748b' }} />
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={(hours / maxHours) * 100}
                    sx={{ mt: 1.25, height: 5, borderRadius: 999, bgcolor: '#eef2f7', '& .MuiLinearProgress-bar': { borderRadius: 999 } }}
                  />

                  <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="search"
                      value={laneOrderFilter}
                      onChange={(event) => {
                        const value = event.target.value;
                        setLaneOrderFilters((current) => ({ ...current, [workCenter.arbpl]: value }));
                      }}
                      placeholder="Filter Order Number"
                      slotProps={{ htmlInput: { autoComplete: 'off', 'aria-label': `Filter Order in Work Center ${workCenter.arbpl}` } }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        '& .MuiOutlinedInput-root': { height: 32, borderRadius: 1.5, bgcolor: '#ffffff' },
                        '& input': { py: 0.7, fontSize: '0.75rem', fontWeight: 750 },
                      }}
                    />
                  </Stack>
                </Box>

                <Stack spacing={1} sx={{ p: 1, minHeight: 240 }}>
                  {visibleJobs.map((job) => {
                    const index = jobIndexById.get(job.id) ?? 0;
                    return (
                      <RoutingOrderCard
                        key={job.id}
                        job={job}
                        index={index}
                        selected={selectedJobIds.has(job.id)}
                        lacquerColor={lacquerColorMap.get(getLacquerKey(job)) ?? fallbackLacquerColor}
                        onToggleSelect={onToggleSelect}
                        onOpen={setSelectedJob}
                        onDragStart={onDragStart}
                        onDrag={onDrag}
                        onDragOverJob={onDragOverJob}
                        onDragLeaveJob={onDragLeaveJob}
                        onDropOnJob={onDropOnJob}
                        onDragEnd={handleCardDragEnd}
                      />
                    );
                  })}

                  <Box
                    sx={{
                      minHeight: jobs.length === 0 ? 180 : 58,
                      display: 'grid',
                      placeItems: 'center',
                      border: '1.5px dashed',
                      borderColor: isActive ? '#818cf8' : 'rgba(100, 116, 139, 0.22)',
                      borderRadius: 2,
                      color: isActive ? '#4f46e5' : '#94a3b8',
                      bgcolor: isActive ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255, 255, 255, 0.45)',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 850, textAlign: 'center', px: 2 }}>
                      {isActive
                        ? `วางที่ท้ายคิว ${workCenter.arbpl}`
                        : normalizedLaneFilter && visibleJobs.length === 0
                          ? 'ไม่พบ Order ใน Work Center นี้'
                          : jobs.length === 0
                            ? 'ลาก Order มาวางใน Work Center นี้'
                            : 'วางท้ายคิว'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      </Box>

      <JobDetailDialog
        fallbackLacquerColor={fallbackLacquerColor}
        job={selectedJob}
        lacquerColorMap={lacquerColorMap}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
}
