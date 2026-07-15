'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { ArrowLeft2, ArrowRight2, Calendar, Clock, TaskSquare } from 'iconsax-react';
import { addDays, parseIsoDate, startOfMondayWeek } from './date-utils';

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

function OperationItem({ operation }: { operation: TimelineOperation }) {
  const style = getStatusStyle(operation.status);
  return (
    <Tooltip
      arrow
      placement="top"
      title={`${operation.order} · OP ${operation.operation} · ${operation.description || 'ไม่ระบุชื่อขั้นตอน'} · ${operation.opTime} ชม. · Qty ${numberFormatter.format(operation.quantity)}`}
    >
      <Box
        sx={{
          px: 0.75,
          py: 0.6,
          minWidth: 0,
          borderRadius: 1.25,
          color: style.color,
          bgcolor: style.bg,
          border: `1px solid ${style.border}`,
          boxShadow: `inset 3px 0 0 ${style.border}`,
        }}
      >
        <Typography noWrap sx={{ fontSize: '0.66rem', lineHeight: 1.25, fontWeight: 950 }}>
          {operation.order}
        </Typography>
        <Stack direction="row" spacing={0.6} sx={{ mt: 0.15, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography noWrap sx={{ minWidth: 0, fontSize: '0.6rem', fontWeight: 850 }}>
            OP {operation.operation || '-'} · {operation.status}
          </Typography>
          <Typography sx={{ flexShrink: 0, fontSize: '0.58rem', fontWeight: 900 }}>
            {operation.opTime > 0 ? `${numberFormatter.format(operation.opTime)} ชม.` : 'ไม่มีเวลา'}
          </Typography>
        </Stack>
      </Box>
    </Tooltip>
  );
}

export default function DayTimeline({ initialDate, operations, workCenters }: Props) {
  const [windowStart, setWindowStart] = React.useState(() => startOfMondayWeek(initialDate));
  const [selectedWorkCenter, setSelectedWorkCenter] = React.useState('ALL');
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');

  const days = React.useMemo(
    () => Array.from({ length: DAY_COUNT }, (_, index) => addDays(windowStart, index)),
    [windowStart],
  );
  const windowEnd = days.at(-1) ?? windowStart;
  const visibleWorkCenters = selectedWorkCenter === 'ALL' ? workCenters : [selectedWorkCenter];
  const filteredOperations = React.useMemo(
    () => operations.filter((operation) => (
      operation.startDate >= windowStart &&
      operation.startDate <= windowEnd &&
      (selectedStatus === 'ALL' || operation.status === selectedStatus) &&
      (selectedWorkCenter === 'ALL' || operation.workCenter === selectedWorkCenter)
    )),
    [operations, selectedStatus, selectedWorkCenter, windowEnd, windowStart],
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
    <Paper elevation={0} sx={{ borderRadius: 3.5, border: '1px solid rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
      <Stack spacing={1.5} sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: '#0f172a', fontWeight: 950 }}>Day Timeline</Typography>
            <Typography sx={{ mt: 0.2, color: '#64748b', fontSize: '0.7rem' }}>
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
            <FormControl size="small" sx={{ minWidth: 145 }}>
              <Select value={selectedWorkCenter} onChange={(event) => setSelectedWorkCenter(event.target.value)} sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 800 }}>
                <MenuItem value="ALL">ทุก Work center</MenuItem>
                {workCenters.map((workCenter) => <MenuItem key={workCenter} value={workCenter}>WC {workCenter}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 125 }}>
              <Select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 800 }}>
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
              <Typography sx={{ color: '#475569', fontSize: '0.7rem', fontWeight: 950 }}>WORK CENTER</Typography>
            </Box>
            {days.map((day) => {
              const isToday = day === initialDate;
              return (
                <Box key={day} sx={{ p: 1, textAlign: 'center', bgcolor: isToday ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #e2e8f0', boxShadow: isToday ? 'inset 0 -3px 0 #3b82f6' : 'none' }}>
                  <Typography sx={{ color: isToday ? '#1d4ed8' : '#475569', fontSize: '0.72rem', fontWeight: 950 }}>
                    {dayFormatter.format(parseIsoDate(day))}
                  </Typography>
                  {isToday && <Typography sx={{ color: '#2563eb', fontSize: '0.58rem', fontWeight: 900 }}>TODAY</Typography>}
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
                  <Typography sx={{ color: '#0f172a', fontSize: '0.82rem', fontWeight: 950 }}>WC {workCenter}</Typography>
                  <Typography sx={{ mt: 0.3, color: '#64748b', fontSize: '0.64rem' }}>{numberFormatter.format(workCenterOperations.length)} Operations</Typography>
                  <Typography sx={{ color: '#0f766e', fontSize: '0.64rem', fontWeight: 850 }}>{numberFormatter.format(Number(workCenterHours.toFixed(1)))} ชม.</Typography>
                </Box>
                {days.map((day) => {
                  const cellOperations = operationsByCell.get(`${workCenter}|${day}`) ?? [];
                  const totalHours = cellOperations.reduce((sum, operation) => sum + operation.opTime, 0);
                  return (
                    <Box key={day} sx={{ p: 0.65, minHeight: 166, bgcolor: day === initialDate ? 'rgba(239, 246, 255, 0.5)' : '#ffffff', borderRight: '1px solid #e2e8f0' }}>
                      {cellOperations.length > 0 ? (
                        <Stack spacing={0.5}>
                          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 0.4 }}>
                            <Typography sx={{ color: '#475569', fontSize: '0.59rem', fontWeight: 900 }}>{cellOperations.length} OP</Typography>
                            <Typography sx={{ color: '#0f766e', fontSize: '0.57rem', fontWeight: 900 }}>{numberFormatter.format(Number(totalHours.toFixed(1)))} ชม.</Typography>
                          </Stack>
                          {cellOperations.map((operation) => <OperationItem key={operation.id} operation={operation} />)}
                        </Stack>
                      ) : (
                        <Typography sx={{ pt: 0.3, color: '#cbd5e1', textAlign: 'center', fontSize: '0.72rem' }}>—</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}
