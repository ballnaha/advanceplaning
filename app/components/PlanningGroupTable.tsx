'use client';

import * as React from 'react';
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowDown2, ArrowUp2, HambergerMenu } from 'iconsax-react';
import { cleanZpg2d } from '@/lib/zpg1d-helpers';
import type { PlanningJob } from '@/lib/planning';
import JobDetailDialog from './JobDetailDialog';

const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

export type SequenceChange = {
  previousSeq: number;
  currentSeq: number;
  previousWorkCenter: string;
  currentWorkCenter: string;
  previousGroup: string | null;
  currentGroup: string | null;
};

function formatDate(value: string | null) {
  if (!value) return '-';
  return dateFormatter.format(new Date(value));
}

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

function createLacquerColor(index: number) {
  const hue = Math.round((index * 137.508) % 360);
  const saturation = [62, 70, 56, 66][index % 4];
  const lightness = [42, 36, 48][Math.floor(index / 4) % 3];
  return {
    bg: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.07)`,
    chipBg: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.16)`,
    text: `hsl(${hue}, ${Math.min(saturation + 8, 82)}%, ${Math.max(lightness - 14, 24)}%)`,
    border: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`,
  };
}

const fallbackLacquerColor = createLacquerColor(0);

const YellowWarningIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path
      d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
      fill="#d97706"
    />
    <path
      d="M12 8V13"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.5" r="1.25" fill="#ffffff" />
  </svg>
);

const isNearOrOverdue = (findateStr: string | null) => {
  if (!findateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = findateStr.split('-').map(Number);
  const finishDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  const diffMs = finishDate.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  const inclusiveDays = diffDays + 1;
  
  return inclusiveDays >= 1 && inclusiveDays <= 3;
};

function RoutingTrail({
  operations,
  externalRoutingJobIds,
  currentJobId,
}: {
  operations: PlanningJob[];
  externalRoutingJobIds: Set<number>;
  currentJobId: number;
}) {
  if (!operations.some((operation) => externalRoutingJobIds.has(operation.id))) return null;

  return (
    <Box sx={{ mt: 0.75, pt: 0.65, borderTop: '1px dashed #e2e8f0' }}>
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.66rem', fontWeight: 900 }}>
          Routing:
        </Typography>
        {operations.map((operation, index) => {
          const isExternal = externalRoutingJobIds.has(operation.id);
          const isCurrent = operation.id === currentJobId;
          return (
            <React.Fragment key={operation.id}>
              {index > 0 && (
                <Typography component="span" aria-hidden sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 900 }}>
                  →
                </Typography>
              )}
              <Tooltip
                title={`OP ${operation.vornr || '-'} · ${operation.ltxa1 || 'ไม่ระบุชื่อขั้นตอน'} · Work Center ${operation.arbpl}`}
                arrow
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.4,
                    px: 0.65,
                    py: 0.3,
                    color: isExternal ? '#92400e' : isCurrent ? '#4338ca' : '#475569',
                    bgcolor: isExternal ? '#fffbeb' : isCurrent ? '#eef2ff' : '#f8fafc',
                    border: '1px solid',
                    borderStyle: isExternal ? 'dashed' : 'solid',
                    borderColor: isExternal ? '#f59e0b' : isCurrent ? '#a5b4fc' : '#e2e8f0',
                    borderRadius: 1,
                    fontSize: '0.64rem',
                    lineHeight: 1.1,
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                    cursor: 'help',
                  }}
                >
                  OP {operation.vornr || '-'}
                  {isExternal && (
                    <Box component="span" sx={{ color: '#b45309', fontSize: '0.58rem', fontWeight: 950 }}>
                      · WC {operation.arbpl}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
}

interface PlanningJobRowProps {
  job: PlanningJob;
  globalIndex: number;
  lacquerColor: { bg: string; chipBg: string; text: string; border: string };
  isSelected: boolean;
  onToggleSelect: (jobId: number) => void;
  isFirst: boolean;
  isLast: boolean;
  workCenter: string;
  showRoutingTrail: boolean;
  routingOperations: PlanningJob[];
  externalRoutingJobIds: Set<number>;
  onDragStart: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDrag: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDragLeave: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (event: React.DragEvent<HTMLTableRowElement>, targetJobId: number, workCenter: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onMoveUp: (jobId: number) => void;
  onMoveDown: (jobId: number) => void;
  onOpenDetails: (job: PlanningJob) => void;
}

const PlanningJobRow = React.memo(({
  job,
  globalIndex,
  lacquerColor,
  isSelected,
  onToggleSelect,
  isFirst,
  isLast,
  workCenter,
  showRoutingTrail,
  routingOperations,
  externalRoutingJobIds,
  onDragStart,
  onDrag,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onOpenDetails,
}: PlanningJobRowProps) => {
  return (
    <TableRow
      hover
      draggable
      data-job-id={job.id}
      onDragStart={(event) => onDragStart(event, job.id)}
      onDrag={onDrag}
      onDragOver={(event) => onDragOver(event, job.id)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, job.id, workCenter)}
      onDragEnd={onDragEnd}
      onClick={() => onOpenDetails(job)}
      sx={{
        cursor: 'pointer',
        transition: 'background-color 120ms ease, opacity 120ms ease, transform 120ms ease',
        opacity: 1,
        bgcolor: isSelected ? 'rgba(79, 70, 229, 0.05) !important' : 'transparent',
        boxShadow: `inset 4px 0 0 ${lacquerColor.text}, 0 0 0 rgba(0,0,0,0)`,
        '&:active': { cursor: 'grabbing' },
        '&:hover': { bgcolor: isSelected ? 'rgba(79, 70, 229, 0.08) !important' : 'rgba(15, 23, 42, 0.025)' },
        '&.dragging-row': { opacity: 0.45, transform: 'scale(0.985)', willChange: 'opacity, transform' },
        '& .quick-move-btns': {
          opacity: 1,
        },
        '&.drop-confirm-row': {
          position: 'relative',
          animation: 'dropConfirmRow 1100ms ease-out',
          bgcolor: 'rgba(5, 150, 105, 0.08)',
          boxShadow: 'inset 4px 0 0 #059669, 0 12px 24px rgba(5, 150, 105, 0.12)',
        },
        '&.drop-confirm-before': {
          boxShadow: 'inset 4px 0 0 #059669, inset 0 3px 0 #059669, 0 12px 24px rgba(5, 150, 105, 0.12)',
        },
        '&.drop-confirm-after': {
          boxShadow: 'inset 4px 0 0 #059669, inset 0 -3px 0 #059669, 0 12px 24px rgba(5, 150, 105, 0.12)',
        },
        '&.drop-confirm-row td:first-of-type': {
          position: 'relative',
        },
        '&.drop-confirm-row td:first-of-type::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: -1,
          zIndex: 3,
          height: 3,
          borderRadius: 999,
          bgcolor: '#059669',
          transform: 'translateY(-50%)',
          animation: 'dropPlaceLine 1100ms ease-out',
        },
        '&.drop-confirm-before td:first-of-type::before': { top: 0 },
        '&.drop-confirm-after td:first-of-type::before': { top: '100%' },
        '&.drop-confirm-row td:first-of-type::after': {
          content: '"เพิ่งวางตรงนี้"',
          position: 'absolute',
          left: 10,
          zIndex: 3,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: '#059669',
          color: '#ffffff',
          fontSize: '0.68rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 18px rgba(5, 150, 105, 0.16)',
          transform: 'translateY(-50%)',
          animation: 'dropLabelOut 1100ms ease-out',
        },
        '&.drop-confirm-before td:first-of-type::after': { top: 0 },
        '&.drop-confirm-after td:first-of-type::after': { top: '100%' },
        '&.drop-target-row': {
          bgcolor: 'rgba(79, 70, 229, 0.055)',
          boxShadow: 'inset 4px 0 0 #4f46e5',
          position: 'relative',
        },
        '&.drop-before-row': {
          boxShadow: 'inset 4px 0 0 #4f46e5, inset 0 3px 0 #4f46e5',
        },
        '&.drop-after-row': {
          boxShadow: 'inset 4px 0 0 #0891b2, inset 0 -3px 0 #0891b2',
        },
        '& td': {
          boxSizing: 'border-box',
          py: 1.15,
          transition: 'border-color 160ms ease, background-color 160ms ease',
          verticalAlign: 'middle',
        },
        '&.drop-target-row td': { position: 'relative' },
        '&.drop-before-row td:first-of-type::before, &.drop-after-row td:first-of-type::before': {
          position: 'absolute',
          left: 8,
          zIndex: 3,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          color: '#ffffff',
          fontSize: '0.68rem',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.12)',
          transform: 'translateY(-50%)',
          animation: 'dropHintIn 140ms ease-out',
        },
        '&.drop-before-row td:first-of-type::before': {
          content: '"แทรกก่อนแถวนี้"',
          top: 0,
          bgcolor: '#4f46e5',
        },
        '&.drop-after-row td:first-of-type::before': {
          content: '"วางต่อท้ายแถวนี้"',
          top: '100%',
          bgcolor: '#0891b2',
        },
      }}
    >
      <TableCell width={48} onClick={(event) => event.stopPropagation()} sx={{ textAlign: 'center', py: 0.5 }}>
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => onToggleSelect(job.id)}
          sx={{ p: 0.5 }}
        />
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.82rem', fontWeight: 900 }}>
          #{String(globalIndex + 1).padStart(2, '0')}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 950, color: '#0f172a', fontSize: '1rem' }}>
          {job.aufnr}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.1, fontSize: '0.8rem', fontWeight: 600 }}>
          {job.zptkx || '-'}
        </Typography>
        {showRoutingTrail && (
          <RoutingTrail
            operations={routingOperations}
            externalRoutingJobIds={externalRoutingJobIds}
            currentJobId={job.id}
          />
        )}
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        {(job.vornr || job.ltxa1) ? (
          <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1.25, bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', display: 'inline-block', whiteSpace: 'nowrap' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.74rem', fontWeight: 900, mr: 0.5 }}>OP</Typography>
            <Typography variant="caption" sx={{ color: '#334155', fontSize: '0.8rem', fontWeight: 800 }}>
              {[job.vornr, job.ltxa1].filter(Boolean).join(' ')}
            </Typography>
          </Box>
        ) : (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>-</Typography>
        )}
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        {job.zpg2d ? (
          <Typography variant="body2" sx={{ color: '#4338ca', fontWeight: 850, fontSize: '0.86rem' }}>
            {cleanZpg2d(job.zpg2d)}
          </Typography>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        {job.zpg3d ? (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              bgcolor: lacquerColor.chipBg,
              color: lacquerColor.text,
              border: `1px solid ${lacquerColor.border}`,
              fontSize: '0.86rem',
              fontWeight: 850,
              whiteSpace: 'normal',
              wordBreak: 'normal',
              overflow: 'visible',
              lineHeight: 1.35,
            }}
          >
            {job.zpg3d}
          </Box>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.84rem' }}>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              px: 0.75,
              py: 0.2,
              borderRadius: 1,
              bgcolor: lacquerColor.chipBg,
              border: `1px solid ${lacquerColor.border}`,
              color: lacquerColor.text,
              fontWeight: 900,
            }}
          >
            {job.zltkx || '-'}
          </Box>
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontSize: '0.76rem', fontWeight: 600 }}>
           {job.usr00 || '-'} / TEMP {job.usr02 || '-'}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.35, fontSize: '0.82rem' }}>
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', width: 28 }}>เริ่ม:</Box>
          {formatDate(job.stdate)}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.35, mt: 0.1, fontSize: '0.82rem' }}>
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.74rem', width: 28 }}>เสร็จ:</Box>
          {formatDate(job.findate)}
          {isNearOrOverdue(job.findate) && (
            <Tooltip title="ใกล้ถึงกำหนดส่งหรือเกินกำหนด (ภายใน 3 วัน)" arrow>
              <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                <YellowWarningIcon />
              </span>
            </Tooltip>
          )}
        </Typography>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
        <Chip
          size="small"
          color={
            job.text1?.toUpperCase() === 'WAIT'
              ? 'warning'
              : job.text1?.toUpperCase() === 'START'
              ? 'info'
              : job.text1?.toUpperCase() === 'DONE'
              ? 'success'
              : 'default'
          }
          label={job.text1 || 'NOT START'}
          sx={{
            height: 23,
            fontSize: '0.72rem',
            fontWeight: 900,
            borderRadius: 1.5,
          }}
        />
      </TableCell>
      <TableCell align="center" sx={{ py: 0.5 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <Stack
            className="quick-move-btns"
            direction="row"
            spacing={0.25}
            sx={{ mr: 0.25 }}
          >
            <Tooltip title="ย้ายขึ้น 1 ลำดับ" placement="top" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={isFirst}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp(job.id);
                  }}
                  sx={{
                    width: 22,
                    height: 22,
                    p: 0,
                    border: '1px solid',
                    borderColor: isFirst ? 'rgba(15, 23, 42, 0.06)' : 'rgba(79, 70, 229, 0.3)',
                    bgcolor: isFirst ? 'rgba(15, 23, 42, 0.02)' : '#ffffff',
                    boxShadow: isFirst ? 'none' : '0 1px 4px rgba(79, 70, 229, 0.1)',
                    color: isFirst ? 'action.disabled' : '#4f46e5',
                    '&:hover': {
                      bgcolor: 'rgba(79, 70, 229, 0.08)',
                      borderColor: '#4f46e5',
                    },
                  }}
                >
                  <ArrowUp2 size="14" color="currentColor" variant="Bold" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="ย้ายลง 1 ลำดับ" placement="bottom" arrow>
              <span>
                <IconButton
                  size="small"
                  disabled={isLast}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown(job.id);
                  }}
                  sx={{
                    width: 22,
                    height: 22,
                    p: 0,
                    border: '1px solid',
                    borderColor: isLast ? 'rgba(15, 23, 42, 0.06)' : 'rgba(8, 145, 178, 0.3)',
                    bgcolor: isLast ? 'rgba(15, 23, 42, 0.02)' : '#ffffff',
                    boxShadow: isLast ? 'none' : '0 1px 4px rgba(8, 145, 178, 0.1)',
                    color: isLast ? 'action.disabled' : '#0891b2',
                    '&:hover': {
                      bgcolor: 'rgba(8, 145, 178, 0.08)',
                      borderColor: '#0891b2',
                    },
                  }}
                >
                  <ArrowDown2 size="14" color="currentColor" variant="Bold" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          {/* Drag handle */}
          <Tooltip title="ลากแถวนี้เพื่อจัดลำดับ" placement="top" arrow>
            <IconButton
              size="small"
              onClick={(event) => event.stopPropagation()}
              sx={{
                width: 22,
                height: 22,
                p: 0,
                cursor: 'grab',
                transition: 'transform 160ms ease, background-color 160ms ease',
                '.dragging-row &': {
                  transform: 'rotate(90deg) scale(1.08)',
                  bgcolor: 'rgba(79, 70, 229, 0.08)',
                },
              }}
            >
              <HambergerMenu size="15" color="#64748b" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

PlanningJobRow.displayName = 'PlanningJobRow';

export interface PlanningGroupTableProps {
  groupJobs: PlanningJob[];
  group: PlanningJob[];
  routingOperationsByOrder: Map<string, PlanningJob[]>;
  externalRoutingJobIds: Set<number>;
  groupLabel: string;
  workCenter: string;
  isCollapsed: boolean;
  lacquerColorMap: Map<string, { bg: string; chipBg: string; text: string; border: string }>;
  selectedJobIds: Set<number>;
  onToggleSelect: (jobId: number) => void;
  onToggleSelectAllGroup: (jobIds: number[], selectAll: boolean) => void;
  onDragStart: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDrag: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDragLeave: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (event: React.DragEvent<HTMLTableRowElement>, targetJobId: number, workCenter: string) => void;
  onDropToGroup: (event: React.DragEvent<HTMLElement>, workCenter: string, groupLabel: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onMoveUp: (jobId: number) => void;
  onMoveDown: (jobId: number) => void;
}

function routingOperationsEqualForJobs(
  previous: Map<string, PlanningJob[]>,
  next: Map<string, PlanningJob[]>,
  jobs: PlanningJob[],
) {
  const orders = new Set(jobs.map((job) => job.aufnr));
  for (const order of orders) {
    const previousOperations = previous.get(order) ?? [];
    const nextOperations = next.get(order) ?? [];
    if (
      previousOperations.length !== nextOperations.length ||
      previousOperations.some((operation, index) => operation !== nextOperations[index])
    ) {
      return false;
    }
  }
  return true;
}

const PlanningGroupTable = React.memo(({
  groupJobs,
  group,
  routingOperationsByOrder,
  externalRoutingJobIds,
  groupLabel,
  workCenter,
  isCollapsed,
  lacquerColorMap,
  selectedJobIds,
  onToggleSelect,
  onToggleSelectAllGroup,
  onDragStart,
  onDrag,
  onDragOver,
  onDragLeave,
  onDrop,
  onDropToGroup,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}: PlanningGroupTableProps) => {
  const [selectedJob, setSelectedJob] = React.useState<PlanningJob | null>(null);
  const [isEmptyDropActive, setIsEmptyDropActive] = React.useState(false);
  const isMountedRef = React.useRef(false);
  const groupIndexByJobId = React.useMemo(
    () => new Map(group.map((job, index) => [job.id, index])),
    [group],
  );
  const firstVisibleJobIdByOrder = React.useMemo(() => {
    const firstJobByOrder = new Map<string, number>();
    groupJobs.forEach((job) => {
      if (!firstJobByOrder.has(job.aufnr)) firstJobByOrder.set(job.aufnr, job.id);
    });
    return firstJobByOrder;
  }, [groupJobs]);
  const currentSelectedJob = selectedJob
    ? group.find((job) => job.id === selectedJob.id) ?? selectedJob
    : null;

  const openDetails = React.useCallback((job: PlanningJob) => {
    if (isMountedRef.current) {
      setSelectedJob(job);
    }
  }, []);

  const closeDetails = React.useCallback(() => {
    if (isMountedRef.current) {
      setSelectedJob(null);
    }
  }, []);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  if (isCollapsed) return null;
  if (groupJobs.length === 0) {
    return (
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.dataTransfer.dropEffect = 'move';
          setIsEmptyDropActive(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsEmptyDropActive(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsEmptyDropActive(false);
          onDropToGroup(event, workCenter, groupLabel);
        }}
        sx={{
          mt: 1,
          minHeight: 88,
          p: 2,
          display: 'grid',
          placeItems: 'center',
          border: '1.5px dashed',
          borderColor: isEmptyDropActive ? '#4f46e5' : 'rgba(15, 23, 42, 0.14)',
          borderRadius: 1.5,
          textAlign: 'center',
          bgcolor: isEmptyDropActive ? 'rgba(79, 70, 229, 0.07)' : 'rgba(248, 250, 252, 0.72)',
          boxShadow: isEmptyDropActive ? 'inset 0 0 0 2px rgba(79, 70, 229, 0.08)' : 'none',
          transition: 'border-color 140ms ease, background-color 140ms ease, box-shadow 140ms ease',
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: isEmptyDropActive ? '#4f46e5' : 'text.secondary', fontWeight: 800 }}
        >
          {isEmptyDropActive ? 'วาง Order ในกลุ่มเหล็กนี้' : 'ไม่มีงาน · ลาก Order มาวางที่นี่'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer
        sx={{
          mt: 1,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          borderRadius: 1.5,
          overflow: 'visible',
        }}
      >
        <Table stickyHeader size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell width={48} align="center" sx={{ py: 0 }}>
                <Checkbox
                  size="small"
                  checked={groupJobs.length > 0 && groupJobs.every(job => selectedJobIds.has(job.id))}
                  indeterminate={groupJobs.some(job => selectedJobIds.has(job.id)) && !groupJobs.every(job => selectedJobIds.has(job.id))}
                  onChange={(e) => onToggleSelectAllGroup(groupJobs.map(j => j.id), e.target.checked)}
                  sx={{ p: 0.5 }}
                />
              </TableCell>
              <TableCell width={72}>Seq.</TableCell>
              <TableCell>Order / Description 1</TableCell>
              <TableCell width={150} sx={{ whiteSpace: 'nowrap' }}>OP</TableCell>
              <TableCell width={120}>Group 2</TableCell>
              <TableCell width={160}>Group 3</TableCell>
              <TableCell width={270}>Description / FW. / TEMP</TableCell>
              <TableCell width={180}>Start / Finish Date</TableCell>
              <TableCell width={120} sx={{ whiteSpace: 'nowrap' }}>Status</TableCell>
              <TableCell width={120} align="center">จัดคิว</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupJobs.map((job) => {
              const globalIndex = groupIndexByJobId.get(job.id) ?? 0;
              const lacquerKey = getLacquerKey(job);
              const lacquerColor = lacquerColorMap.get(lacquerKey) ?? fallbackLacquerColor;

              return (
                <PlanningJobRow
                  key={job.id}
                  job={job}
                  globalIndex={globalIndex}
                  lacquerColor={lacquerColor}
                  isSelected={selectedJobIds.has(job.id)}
                  onToggleSelect={onToggleSelect}
                  isFirst={globalIndex === 0}
                  isLast={globalIndex === group.length - 1}
                  workCenter={workCenter}
                  showRoutingTrail={firstVisibleJobIdByOrder.get(job.aufnr) === job.id}
                  routingOperations={routingOperationsByOrder.get(job.aufnr) ?? []}
                  externalRoutingJobIds={externalRoutingJobIds}
                  onDragStart={onDragStart}
                  onDrag={onDrag}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  onMoveUp={onMoveUp}
                  onMoveDown={onMoveDown}
                  onOpenDetails={openDetails}
                />
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <JobDetailDialog
        fallbackLacquerColor={fallbackLacquerColor}
        job={currentSelectedJob}
        lacquerColorMap={lacquerColorMap}
        onClose={closeDetails}
      />
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isCollapsed === nextProps.isCollapsed &&
    prevProps.groupJobs.length === nextProps.groupJobs.length &&
    prevProps.groupJobs.every((job, i) => job === nextProps.groupJobs[i]) &&
    prevProps.groupJobs.every((job) => prevProps.selectedJobIds.has(job.id) === nextProps.selectedJobIds.has(job.id)) &&
    routingOperationsEqualForJobs(
      prevProps.routingOperationsByOrder,
      nextProps.routingOperationsByOrder,
      prevProps.groupJobs,
    ) &&
    prevProps.externalRoutingJobIds === nextProps.externalRoutingJobIds
  );
});

PlanningGroupTable.displayName = 'PlanningGroupTable';

export default PlanningGroupTable;
