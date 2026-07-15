'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowLeft2, ArrowRight2, Calendar, Clock, TaskSquare, CloseCircle } from 'iconsax-react';
import { addDays, parseIsoDate, startOfMondayWeek } from './date-utils';
import PlanningActionBar from '../components/PlanningActionBar';
import { cleanZpg2d } from '@/lib/zpg1d-helpers';
import type { PlanningJob } from '@/lib/planning';
import JobDetailDialog from '../components/JobDetailDialog';

export type TimelineOperation = {
  id: number;
  workCenter: string;
  order: string;
  operation: string;
  description: string;
  startDate: string;
  finishDate: string;
  opTime: number;
  quantity: number;
  status: string;
  sequence: number;
  rawJob: PlanningJob;
};

type Props = {
  initialDate: string;
  operations: TimelineOperation[];
  workCenters: string[];
};

const DAY_COUNT = 7;
const DAY_WIDTH = 158;
const LABEL_WIDTH = 170;
const TIMELINE_COLUMNS = `${LABEL_WIDTH}px repeat(${DAY_COUNT}, minmax(0, 1fr))`;
const SCROLL_COLUMNS = `${LABEL_WIDTH}px repeat(${DAY_COUNT}, ${DAY_WIDTH}px)`;
const numberFormatter = new Intl.NumberFormat('th-TH');
const dayFormatter = new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: '2-digit', month: 'short' });

function getStatusStyle(status: string) {
  switch (status) {
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

  if (group3.includes('ทอง')) {
    return goldTheme;
  }

  if (group3.includes('ขาว') || group3.includes('White') || group3.includes('Plain')) {
    return whiteTheme;
  }

  if (group3.includes('บรอนด์') || group3.includes('บรอนซ์') || group3.includes('Bronze') || group3.includes('เงิน') || group3.includes('Silver')) {
    return metallicTheme;
  }

  return createLacquerColor(indexFallback);
}

function getLacquerKey(job: PlanningJob) {
  return cleanZpg2d(job.zpg2d).trim();
}

function daysBetween(startDate: string, finishDate: string) {
  const start = parseIsoDate(startDate).getTime();
  const finish = parseIsoDate(finishDate).getTime();
  return Math.max(0, Math.round((finish - start) / 86400000));
}

function OperationItem({
  operation,
  onOpenDetail,
  onDragStartAny,
  onDragEndAny,
  onDropOnTarget,
  dragOverJobId,
  setDragOverJobId,
}: {
  operation: TimelineOperation;
  onOpenDetail: (job: PlanningJob) => void;
  onDragStartAny: () => void;
  onDragEndAny: () => void;
  onDropOnTarget: (draggedId: number, targetOp: TimelineOperation) => void;
  dragOverJobId: number | string | null;
  setDragOverJobId: (id: number | string | null) => void;
}) {
  const style = getStatusStyle(operation.status);
  const isDragOver = dragOverJobId === operation.id;

  const handleDragStart = (event: React.DragEvent<HTMLElement>) => {
    console.log('Timeline Drag Start - Job ID:', operation.id, 'Source WC:', operation.workCenter);
    event.dataTransfer.setData('text/plain', String(operation.id));
    event.dataTransfer.effectAllowed = 'move';
    
    // Delay DOM mutations to the next event loop tick to prevent browser drag cancellation
    setTimeout(() => {
      const container = document.querySelector('.timeline-grid-container');
      if (container) {
        container.classList.add('is-dragging-active');
      }
    }, 0);
    
    onDragStartAny();
  };

  const handleDragEnd = (event: React.DragEvent<HTMLElement>) => {
    const container = document.querySelector('.timeline-grid-container');
    if (container) {
      container.classList.remove('is-dragging-active');
    }
    onDragEndAny();
  };

  return (
    <Box
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (dragOverJobId !== operation.id) {
          setDragOverJobId(operation.id);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const related = event.relatedTarget as Node | null;
        if (related && event.currentTarget.contains(related)) return;
        if (dragOverJobId === operation.id) {
          setDragOverJobId(null);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOverJobId(null);
        const jobIdStr = event.dataTransfer.getData('text/plain');
        const jobId = Number(jobIdStr);
        if (!isNaN(jobId) && jobId !== operation.id) {
          onDropOnTarget(jobId, operation);
        }
      }}
      onClick={() => onOpenDetail(operation.rawJob)}
      sx={{
        position: 'relative',
        px: 0.75,
        py: 0.6,
        minWidth: 0,
        borderRadius: 1.25,
        color: style.color,
        bgcolor: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: `inset 3px 0 0 ${style.border}`,
        cursor: 'pointer',
        transition: 'transform 120ms ease, opacity 120ms ease',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        '&:active': { opacity: 0.75, transform: 'scale(0.97)' },
        '&:hover': {
          filter: 'brightness(0.95)',
        },
      }}
    >
      {isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            top: -3.5,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: '#4f46e5',
            borderRadius: 99,
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(79, 70, 229, 0.4)',
            pointerEvents: 'none',
          }}
        />
      )}
      <Typography noWrap sx={{ fontSize: '0.73rem', lineHeight: 1.25, fontWeight: 950 }}>
        {operation.order}
      </Typography>
      <Stack direction="row" spacing={0.6} sx={{ mt: 0.15, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography noWrap sx={{ minWidth: 0, fontSize: '0.67rem', fontWeight: 850 }}>
          OP {operation.operation || '-'} · {operation.status}
        </Typography>
        <Typography sx={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: 900 }}>
          {operation.opTime > 0 ? `${numberFormatter.format(operation.opTime)} ชม.` : 'ไม่มีเวลา'}
        </Typography>
      </Stack>
    </Box>
  );
}

export default function DayTimeline({ initialDate, operations, workCenters }: Props) {
  const [windowStart, setWindowStart] = React.useState(() => startOfMondayWeek(initialDate));
  const [selectedWorkCenter, setSelectedWorkCenter] = React.useState('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');
  const [orderSearch, setOrderSearch] = React.useState('');

  const [localOperations, setLocalOperations] = React.useState(operations);
  const [initialOperations, setInitialOperations] = React.useState(operations);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [selectedJobForModal, setSelectedJobForModal] = React.useState<PlanningJob | null>(null);

  const [dragOverJobId, setDragOverJobId] = React.useState<number | string | null>(null);

  const handleDragStartAny = React.useCallback(() => {}, []);
  const handleDragEndAny = React.useCallback(() => {
    setDragOverJobId(null);
  }, []);

  const lacquerColorMap = React.useMemo(() => {
    const jobs = localOperations.map((op) => op.rawJob).filter(Boolean);
    const lacquerKeys = Array.from(new Set(jobs.map(getLacquerKey))).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));

    const map = new Map<string, LacquerColor>();
    lacquerKeys.forEach((key, index) => {
      const matchingJob = jobs.find((job) => getLacquerKey(job) === key);
      const group3 = matchingJob ? matchingJob.zpg3d : null;
      map.set(key, getLacquerColorByGroup3(group3, index));
    });
    return map;
  }, [localOperations]);

  React.useEffect(() => {
    setLocalOperations(operations);
    setInitialOperations(operations);
    setHasChanges(false);
  }, [operations]);

  const handleCancel = () => {
    setLocalOperations(initialOperations);
    setHasChanges(false);
  };

  const handleDropJob = React.useCallback((jobId: number, targetWorkCenter: string, targetDay: string) => {
    console.log('Timeline Drop Job - ID:', jobId, 'Target WC:', targetWorkCenter, 'Target Day:', targetDay);
    setDragOverJobId(null);
    const container = document.querySelector('.timeline-grid-container');
    if (container) {
      container.classList.remove('is-dragging-active');
    }
    setLocalOperations((current) => {
      const draggedOp = current.find((op) => op.id === jobId);
      if (!draggedOp) return current;

      const duration = daysBetween(draggedOp.startDate, draggedOp.finishDate);
      const newStartDate = targetDay;
      const newFinishDate = addDays(newStartDate, duration);

      const updatedDraggedOp = {
        ...draggedOp,
        workCenter: targetWorkCenter,
        startDate: newStartDate,
        finishDate: newFinishDate,
      };

      // Get target cell ops excluding the dragged one
      const targetCellOps = current
        .filter((op) => op.workCenter === targetWorkCenter && op.startDate === targetDay && op.id !== jobId)
        .sort((a, b) => a.sequence - b.sequence || a.id - b.id);

      // Append to the end
      const resequencedCellOps = [...targetCellOps, updatedDraggedOp].map((op, idx) => ({
        ...op,
        sequence: idx + 1,
      }));

      // Resequence the source cell (if different)
      let sourceCellOps: TimelineOperation[] = [];
      if (draggedOp.startDate !== targetDay || draggedOp.workCenter !== targetWorkCenter) {
        const sourceOps = current
          .filter((op) => op.workCenter === draggedOp.workCenter && op.startDate === draggedOp.startDate && op.id !== jobId)
          .sort((a, b) => a.sequence - b.sequence || a.id - b.id);
        sourceCellOps = sourceOps.map((op, idx) => ({
          ...op,
          sequence: idx + 1,
        }));
      }

      const updatedList = current.map((op) => {
        const inTarget = resequencedCellOps.find((r) => r.id === op.id);
        if (inTarget) return inTarget;

        const inSource = sourceCellOps.find((s) => s.id === op.id);
        if (inSource) return inSource;

        if (op.id === jobId) return updatedDraggedOp;

        return op;
      });

      setHasChanges(true);
      return updatedList;
    });
  }, []);

  const handleDropJobOnTarget = React.useCallback((draggedId: number, targetOp: TimelineOperation) => {
    console.log('Timeline Drop On Target - ID:', draggedId, 'Target Op ID:', targetOp.id, 'Target WC:', targetOp.workCenter, 'Target Day:', targetOp.startDate);
    setDragOverJobId(null);
    const container = document.querySelector('.timeline-grid-container');
    if (container) {
      container.classList.remove('is-dragging-active');
    }
    setLocalOperations((current) => {
      const draggedOp = current.find((op) => op.id === draggedId);
      if (!draggedOp) return current;

      const targetDay = targetOp.startDate;
      const targetWorkCenter = targetOp.workCenter;

      const duration = daysBetween(draggedOp.startDate, draggedOp.finishDate);
      const newStartDate = targetDay;
      const newFinishDate = addDays(newStartDate, duration);

      const updatedDraggedOp = {
        ...draggedOp,
        workCenter: targetWorkCenter,
        startDate: newStartDate,
        finishDate: newFinishDate,
      };

      // Get target cell ops excluding the dragged one
      const targetCellOps = current
        .filter((op) => op.workCenter === targetWorkCenter && op.startDate === targetDay && op.id !== draggedId)
        .sort((a, b) => a.sequence - b.sequence || a.id - b.id);

      // Find insertion index before targetOp
      const targetIdx = targetCellOps.findIndex((op) => op.id === targetOp.id);
      const insertionIdx = targetIdx === -1 ? targetCellOps.length : targetIdx;

      const newCellOps = [...targetCellOps];
      newCellOps.splice(insertionIdx, 0, updatedDraggedOp);

      // Resequence all target cell ops
      const resequencedCellOps = newCellOps.map((op, idx) => ({
        ...op,
        sequence: idx + 1,
      }));

      // Resequence source cell (if different)
      let sourceCellOps: TimelineOperation[] = [];
      if (draggedOp.startDate !== targetDay || draggedOp.workCenter !== targetWorkCenter) {
        const sourceOps = current
          .filter((op) => op.workCenter === draggedOp.workCenter && op.startDate === draggedOp.startDate && op.id !== draggedId)
          .sort((a, b) => a.sequence - b.sequence || a.id - b.id);
        sourceCellOps = sourceOps.map((op, idx) => ({
          ...op,
          sequence: idx + 1,
        }));
      }

      const updatedList = current.map((op) => {
        const inTarget = resequencedCellOps.find((r) => r.id === op.id);
        if (inTarget) return inTarget;

        const inSource = sourceCellOps.find((s) => s.id === op.id);
        if (inSource) return inSource;

        if (op.id === draggedId) return updatedDraggedOp;

        return op;
      });

      setHasChanges(true);
      return updatedList;
    });
  }, []);

  const handleSave = async () => {
    const changed = localOperations.filter((op) => {
      const init = initialOperations.find((i) => i.id === op.id);
      return init && (
        init.startDate !== op.startDate ||
        init.finishDate !== op.finishDate ||
        init.workCenter !== op.workCenter ||
        init.sequence !== op.sequence
      );
    });

    if (changed.length === 0) {
      setHasChanges(false);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/jobs/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: changed.map((op) => ({
            id: op.id,
            stdate: op.startDate,
            findate: op.finishDate,
            arbpl: op.workCenter,
            seqno: op.sequence,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      setInitialOperations(localOperations);
      setHasChanges(false);
      window.location.reload();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูลตารางแผนงาน');
    } finally {
      setSaving(false);
    }
  };

  const days = React.useMemo(
    () => Array.from({ length: DAY_COUNT }, (_, index) => addDays(windowStart, index)),
    [windowStart],
  );
  const windowEnd = days.at(-1) ?? windowStart;
  const visibleWorkCenters = selectedWorkCenter === 'ALL' ? workCenters : [selectedWorkCenter];
  const filteredOperations = React.useMemo(
    () => localOperations.filter((operation) => {
      const matchWindow = operation.startDate >= windowStart && operation.startDate <= windowEnd;
      const matchStatus = selectedStatus === 'ALL' || operation.status === selectedStatus;
      const matchWorkCenter = selectedWorkCenter === 'ALL' || operation.workCenter === selectedWorkCenter;
      const matchOrder = !orderSearch.trim() || operation.order.toLowerCase().includes(orderSearch.trim().toLowerCase());
      return matchWindow && matchStatus && matchWorkCenter && matchOrder;
    }),
    [localOperations, selectedStatus, selectedWorkCenter, windowEnd, windowStart, orderSearch],
  );
  const totals = React.useMemo(() => ({
    operations: filteredOperations.length,
    orders: new Set(filteredOperations.map((operation) => operation.order)).size,
    hours: Number(filteredOperations.reduce((sum, operation) => sum + operation.opTime, 0).toFixed(1)),
  }), [filteredOperations]);
  const operationsByCell = React.useMemo(() => {
    const map = new Map<string, TimelineOperation[]>();
    filteredOperations.forEach((operation) => {
      const key = `${operation.workCenter}|${operation.startDate}`;
      const current = map.get(key) ?? [];
      current.push(operation);
      map.set(key, current);
    });
    map.forEach((cellOperations) => cellOperations.sort((a, b) => a.sequence - b.sequence || a.id - b.id));
    return map;
  }, [filteredOperations]);

  return (
    <Paper className="timeline-grid-container" elevation={0} sx={{ borderRadius: 3.5, border: '1px solid rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
      <Stack spacing={1.5} sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: '#0f172a', fontWeight: 950, fontSize: '1.05rem' }}>Day Timeline</Typography>
            <Typography sx={{ mt: 0.2, color: '#64748b', fontSize: '0.78rem' }}>
              จัดกลุ่มตาม Start Date จริง เนื่องจากยังไม่มีเวลาเริ่ม–จบภายในวัน
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ alignItems: { sm: 'center' }, flexWrap: 'wrap' }}>
            <Stack direction="row" spacing={0.5}>
              <Button size="small" variant="outlined" aria-label="สัปดาห์ก่อนหน้า" onClick={() => setWindowStart((current) => addDays(current, -DAY_COUNT))} sx={{ minWidth: 34, px: 0.7, borderRadius: 1.5 }}>
                <ArrowLeft2 size="16" color="currentColor" />
              </Button>
              <Button size="small" variant="outlined" startIcon={<Calendar size="15" color="currentColor" />} onClick={() => setWindowStart(startOfMondayWeek(initialDate))} sx={{ borderRadius: 1.5, fontWeight: 850, textTransform: 'none' }}>
                สัปดาห์นี้
              </Button>
              <Button size="small" variant="outlined" aria-label="สัปดาห์ถัดไป" onClick={() => setWindowStart((current) => addDays(current, DAY_COUNT))} sx={{ minWidth: 34, px: 0.7, borderRadius: 1.5 }}>
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
                      <IconButton
                        size="small"
                        onClick={() => setOrderSearch('')}
                        edge="end"
                        sx={{ color: '#94a3b8', '&:hover': { color: '#64748b' } }}
                      >
                        <CloseCircle size="16" variant="Linear" color="currentColor" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{
                minWidth: 160,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 650,
                  bgcolor: '#ffffff',
                  pr: 1,
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 145 }}>
              <Select MenuProps={{ disableScrollLock: true }} value={selectedWorkCenter} onChange={(event) => setSelectedWorkCenter(event.target.value)} sx={{ borderRadius: 1.5, fontSize: '0.82rem', fontWeight: 800 }}>
                <MenuItem value="ALL">ทุก Work center</MenuItem>
                {workCenters.map((workCenter) => <MenuItem key={workCenter} value={workCenter}>WC {workCenter}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 125 }}>
              <Select MenuProps={{ disableScrollLock: true }} value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} sx={{ borderRadius: 1.5, fontSize: '0.82rem', fontWeight: 800 }}>
                {['ALL', 'NOT START', 'START', 'WAIT', 'DONE'].map((status) => <MenuItem key={status} value={status}>{status === 'ALL' ? 'ทุก Status' : status}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          <Chip icon={<TaskSquare size="14" color="#4f46e5" />} label={`${numberFormatter.format(totals.operations)} Operations`} sx={{ color: '#4338ca', bgcolor: '#eef2ff', fontWeight: 850 }} />
          <Chip label={`${numberFormatter.format(totals.orders)} Orders`} sx={{ color: '#0369a1', bgcolor: '#e0f2fe', fontWeight: 850 }} />
          <Chip icon={<Clock size="14" color="#0d9488" />} label={`${numberFormatter.format(totals.hours)} ชั่วโมง`} sx={{ color: '#0f766e', bgcolor: '#ccfbf1', fontWeight: 850 }} />
        </Stack>
      </Stack>

      <Box sx={{ overflowX: 'auto', borderTop: '1px solid #e2e8f0' }}>
        <Box sx={{ minWidth: { xs: LABEL_WIDTH + DAY_COUNT * DAY_WIDTH, lg: '100%' } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: SCROLL_COLUMNS, lg: TIMELINE_COLUMNS }, bgcolor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            <Box sx={{ position: 'sticky', left: 0, zIndex: 4, p: 1.2, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1' }}>
              <Typography sx={{ color: '#475569', fontSize: '0.78rem', fontWeight: 950 }}>WORK CENTER</Typography>
            </Box>
            {days.map((day) => {
              const isToday = day === initialDate;
              return (
                <Box key={day} sx={{ p: 1, textAlign: 'center', bgcolor: isToday ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #e2e8f0', boxShadow: isToday ? 'inset 0 -3px 0 #3b82f6' : 'none' }}>
                  <Typography suppressHydrationWarning sx={{ color: isToday ? '#1d4ed8' : '#475569', fontSize: '0.8rem', fontWeight: 950 }}>
                    {dayFormatter.format(parseIsoDate(day))}
                  </Typography>
                  {isToday && <Typography sx={{ color: '#2563eb', fontSize: '0.66rem', fontWeight: 900 }}>TODAY</Typography>}
                </Box>
              );
            })}
          </Box>

          {visibleWorkCenters.map((workCenter) => {
            const workCenterOperations = filteredOperations.filter((operation) => operation.workCenter === workCenter);
            const workCenterHours = workCenterOperations.reduce((sum, operation) => sum + operation.opTime, 0);
            return (
              <Box key={workCenter} sx={{ display: 'grid', gridTemplateColumns: { xs: SCROLL_COLUMNS, lg: TIMELINE_COLUMNS }, borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ position: 'sticky', left: 0, zIndex: 3, p: 1.25, minHeight: 166, bgcolor: '#ffffff', borderRight: '1px solid #cbd5e1' }}>
                  <Typography sx={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: 950 }}>WC {workCenter}</Typography>
                  <Typography sx={{ mt: 0.3, color: '#64748b', fontSize: '0.72rem' }}>{numberFormatter.format(workCenterOperations.length)} Operations</Typography>
                  <Typography sx={{ color: '#0f766e', fontSize: '0.72rem', fontWeight: 850 }}>{numberFormatter.format(Number(workCenterHours.toFixed(1)))} ชม.</Typography>
                </Box>
                {days.map((day) => {
                  const cellOperations = operationsByCell.get(`${workCenter}|${day}`) ?? [];
                  const totalHours = cellOperations.reduce((sum, operation) => sum + operation.opTime, 0);
                  const cellKey = `${workCenter}|${day}`;
                  return (
                    <Box
                      key={day}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const jobIdStr = event.dataTransfer.getData('text/plain');
                        const jobId = Number(jobIdStr);
                        if (!isNaN(jobId)) {
                          handleDropJob(jobId, workCenter, day);
                        }
                      }}
                      sx={{
                        p: 0.65,
                        minHeight: 166,
                        position: 'relative',
                        bgcolor: day === initialDate ? 'rgba(239, 246, 255, 0.5)' : '#ffffff',
                        borderRight: '1px solid #e2e8f0',
                        transition: 'background-color 150ms ease',
                        '&:hover': {
                          bgcolor: 'rgba(79, 70, 229, 0.04)',
                        }
                      }}
                    >
                      {cellOperations.length > 0 ? (
                        <Stack spacing={0.5}>
                          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 0.4 }}>
                            <Typography sx={{ color: '#475569', fontSize: '0.66rem', fontWeight: 900 }}>{cellOperations.length} OP</Typography>
                            <Typography sx={{ color: '#0f766e', fontSize: '0.64rem', fontWeight: 900 }}>{numberFormatter.format(Number(totalHours.toFixed(1)))} ชม.</Typography>
                          </Stack>
                          {cellOperations.map((operation) => (
                            <OperationItem
                              key={operation.id}
                              operation={operation}
                              onOpenDetail={setSelectedJobForModal}
                              onDragStartAny={handleDragStartAny}
                              onDragEndAny={handleDragEndAny}
                              onDropOnTarget={handleDropJobOnTarget}
                              dragOverJobId={dragOverJobId}
                              setDragOverJobId={setDragOverJobId}
                            />
                          ))}
                          <Box
                            className="append-placeholder-box"
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const appendKey = `append-${workCenter}|${day}`;
                              if (dragOverJobId !== appendKey) {
                                setDragOverJobId(appendKey);
                              }
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const appendKey = `append-${workCenter}|${day}`;
                              if (dragOverJobId === appendKey) {
                                setDragOverJobId(null);
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDragOverJobId(null);
                              const container = document.querySelector('.timeline-grid-container');
                              if (container) {
                                container.classList.remove('is-dragging-active');
                              }
                              const jobIdStr = event.dataTransfer.getData('text/plain');
                              const jobId = Number(jobIdStr);
                              if (!isNaN(jobId)) {
                                handleDropJob(jobId, workCenter, day);
                              }
                            }}
                            sx={{
                              display: 'none',
                              '.is-dragging-active &': {
                                display: 'flex',
                              },
                              height: 32,
                              border: '1.5px dashed',
                              borderRadius: 1.5,
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: dragOverJobId === `append-${workCenter}|${day}` ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                              borderColor: dragOverJobId === `append-${workCenter}|${day}` ? '#818cf8' : 'rgba(100, 116, 139, 0.22)',
                              transition: 'all 120ms ease',
                              cursor: 'copy',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.64rem', color: dragOverJobId === `append-${workCenter}|${day}` ? '#4f46e5' : '#94a3b8', fontWeight: 800, pointerEvents: 'none' }}>
                              {dragOverJobId === `append-${workCenter}|${day}` ? 'วางต่อท้ายคิวที่นี่' : '+ วางต่อท้ายคิว'}
                            </Typography>
                          </Box>
                        </Stack>
                      ) : (
                        <>
                          <Box
                            className="empty-cell-dash"
                            sx={{
                              display: 'block',
                              '.is-dragging-active &': {
                                display: 'none',
                              },
                            }}
                          >
                            <Typography sx={{ pt: 0.3, color: '#cbd5e1', textAlign: 'center', fontSize: '0.72rem' }}>—</Typography>
                          </Box>

                          <Box
                            className="empty-cell-placeholder"
                            onDragOver={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const emptyKey = `empty-${workCenter}|${day}`;
                              if (dragOverJobId !== emptyKey) {
                                setDragOverJobId(emptyKey);
                              }
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const emptyKey = `empty-${workCenter}|${day}`;
                              if (dragOverJobId === emptyKey) {
                                setDragOverJobId(null);
                              }
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setDragOverJobId(null);
                              const container = document.querySelector('.timeline-grid-container');
                              if (container) {
                                container.classList.remove('is-dragging-active');
                              }
                              const jobIdStr = event.dataTransfer.getData('text/plain');
                              const jobId = Number(jobIdStr);
                              if (!isNaN(jobId)) {
                                handleDropJob(jobId, workCenter, day);
                              }
                            }}
                            sx={{
                              display: 'none',
                              '.is-dragging-active &': {
                                display: 'flex',
                              },
                              height: '100%',
                              minHeight: 146,
                              border: '1.5px dashed',
                              borderRadius: 2,
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: dragOverJobId === `empty-${workCenter}|${day}` ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.45)',
                              borderColor: dragOverJobId === `empty-${workCenter}|${day}` ? '#818cf8' : 'rgba(100, 116, 139, 0.22)',
                              transition: 'all 120ms ease',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.68rem', color: dragOverJobId === `empty-${workCenter}|${day}` ? '#4f46e5' : '#94a3b8', fontWeight: 800, pointerEvents: 'none' }}>
                              {dragOverJobId === `empty-${workCenter}|${day}` ? 'วางคิวแรกที่นี่' : '+ วางคิวแรก'}
                            </Typography>
                          </Box>
                        </>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>

      {hasChanges && (
        <PlanningActionBar
          isSaving={saving}
          onReset={handleCancel}
          onSave={handleSave}
        />
      )}

      <JobDetailDialog
        fallbackLacquerColor={fallbackLacquerColor}
        job={selectedJobForModal}
        lacquerColorMap={lacquerColorMap}
        onClose={() => setSelectedJobForModal(null)}
      />
    </Paper>
  );
}
