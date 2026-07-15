'use client';

import * as React from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowLeft2, ArrowRight2, Calendar, Clock, InfoCircle } from 'iconsax-react';
import type { TimelineOperation } from './DayTimeline';
import { addDays, parseIsoDate } from './date-utils';

type Props = {
  initialDate: string;
  operations: TimelineOperation[];
  workCenters: string[];
};

type LoadCell = {
  key: string;
  workCenter: string;
  date: string;
  operations: TimelineOperation[];
  hours: number;
  missingTime: number;
};

const DAY_COUNT = 8;
const CELL_WIDTH = 138;
const LABEL_WIDTH = 168;
const numberFormatter = new Intl.NumberFormat('th-TH');
const dayFormatter = new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: '2-digit', month: 'short' });
const detailDateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'long', year: 'numeric' });

function loadStyle(hours: number, maxHours: number) {
  if (hours <= 0 || maxHours <= 0) {
    return { label: 'ไม่มี Load', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' };
  }
  const ratio = hours / maxHours;
  if (ratio <= 0.25) return { label: 'ต่ำ', color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' };
  if (ratio <= 0.5) return { label: 'ปานกลาง', color: '#0f766e', bg: '#ccfbf1', border: '#5eead4' };
  if (ratio <= 0.75) return { label: 'สูง', color: '#92400e', bg: '#fef3c7', border: '#fcd34d' };
  return { label: 'สูงมาก', color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' };
}

function statusColor(status: string) {
  switch (status) {
    case 'DONE': return '#16a34a';
    case 'START': return '#2563eb';
    case 'WAIT': return '#d97706';
    default: return '#d97706';
  }
}

export default function DailyLoadHeatmap({ initialDate, operations, workCenters }: Props) {
  const [windowStart, setWindowStart] = React.useState(initialDate);
  const [selectedStatus, setSelectedStatus] = React.useState('ALL');
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const days = React.useMemo(() => Array.from({ length: DAY_COUNT }, (_, index) => addDays(windowStart, index)), [windowStart]);
  const windowEnd = days.at(-1) ?? windowStart;

  const filteredOperations = React.useMemo(() => operations.filter((operation) => (
    operation.startDate >= windowStart &&
    operation.startDate <= windowEnd &&
    (selectedStatus === 'ALL' || operation.status === selectedStatus)
  )), [operations, selectedStatus, windowEnd, windowStart]);

  const cellMap = React.useMemo(() => {
    const map = new Map<string, LoadCell>();
    for (const operation of filteredOperations) {
      const key = `${operation.workCenter}|${operation.startDate}`;
      const cell = map.get(key) ?? {
        key,
        workCenter: operation.workCenter,
        date: operation.startDate,
        operations: [],
        hours: 0,
        missingTime: 0,
      };
      cell.operations.push(operation);
      if (operation.opTime > 0) cell.hours += operation.opTime;
      else cell.missingTime += 1;
      map.set(key, cell);
    }
    map.forEach((cell) => {
      cell.hours = Number(cell.hours.toFixed(1));
      cell.operations.sort((a, b) => b.opTime - a.opTime || a.sequence - b.sequence);
    });
    return map;
  }, [filteredOperations]);

  const nonEmptyCells = React.useMemo(() => Array.from(cellMap.values()), [cellMap]);
  const maxHours = React.useMemo(() => Math.max(0, ...nonEmptyCells.map((cell) => cell.hours)), [nonEmptyCells]);
  const peakCell = React.useMemo(() => nonEmptyCells.reduce<LoadCell | null>(
    (peak, cell) => (!peak || cell.hours > peak.hours ? cell : peak),
    null,
  ), [nonEmptyCells]);
  const selectedCell = (selectedKey ? cellMap.get(selectedKey) : null) ?? peakCell;
  const totalHours = Number(filteredOperations.reduce((sum, operation) => sum + Math.max(0, operation.opTime), 0).toFixed(1));
  const missingTime = filteredOperations.filter((operation) => operation.opTime <= 0).length;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3.5, border: '1px solid rgba(15, 23, 42, 0.08)', overflow: 'hidden' }}>
      <Stack spacing={1.4} sx={{ p: { xs: 1.5, md: 2 } }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.25} sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ color: '#0f172a', fontWeight: 950 }}>Daily Load Heatmap</Typography>
              <Chip size="small" label="RELATIVE LOAD" sx={{ height: 21, color: '#7c3aed', bgcolor: '#f3e8ff', fontSize: '0.6rem', fontWeight: 950 }} />
            </Stack>
            <Typography sx={{ mt: 0.2, color: '#64748b', fontSize: '0.7rem' }}>
              สีเทียบกับ Planned Load สูงสุดในช่วงที่เลือก ไม่ใช่ Capacity ของเครื่องจักร
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.7} sx={{ alignItems: { sm: 'center' } }}>
            <Stack direction="row" spacing={0.45}>
              <Button size="small" variant="outlined" aria-label="ย้อนกลับ 8 วัน" onClick={() => { setWindowStart((current) => addDays(current, -DAY_COUNT)); setSelectedKey(null); }} sx={{ minWidth: 34, px: 0.7, borderRadius: 1.5 }}>
                <ArrowLeft2 size="16" color="currentColor" />
              </Button>
              <Button size="small" variant="outlined" startIcon={<Calendar size="15" color="currentColor" />} onClick={() => { setWindowStart(initialDate); setSelectedKey(null); }} sx={{ borderRadius: 1.5, fontWeight: 850, textTransform: 'none' }}>
                วันนี้
              </Button>
              <Button size="small" variant="outlined" aria-label="ถัดไป 8 วัน" onClick={() => { setWindowStart((current) => addDays(current, DAY_COUNT)); setSelectedKey(null); }} sx={{ minWidth: 34, px: 0.7, borderRadius: 1.5 }}>
                <ArrowRight2 size="16" color="currentColor" />
              </Button>
            </Stack>
            <FormControl size="small" sx={{ minWidth: 132 }}>
              <Select value={selectedStatus} onChange={(event) => { setSelectedStatus(event.target.value); setSelectedKey(null); }} sx={{ borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 800 }}>
                {['ALL', 'NOT START', 'START', 'WAIT', 'DONE'].map((status) => <MenuItem key={status} value={status}>{status === 'ALL' ? 'ทุก Status' : status}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.7 }}>
          <Chip icon={<Clock size="14" color="#0f766e" />} label={`${numberFormatter.format(totalHours)} Planned hours`} sx={{ color: '#0f766e', bgcolor: '#ccfbf1', fontWeight: 850 }} />
          <Chip label={`Peak ${numberFormatter.format(maxHours)} ชม./วัน`} sx={{ color: '#b91c1c', bgcolor: '#fee2e2', fontWeight: 850 }} />
          <Chip label={`${numberFormatter.format(missingTime)} OP ไม่มีเวลา`} sx={{ color: missingTime > 0 ? '#92400e' : '#166534', bgcolor: missingTime > 0 ? '#fef3c7' : '#dcfce7', fontWeight: 850 }} />
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 310px' }, borderTop: '1px solid #e2e8f0' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: LABEL_WIDTH + DAY_COUNT * CELL_WIDTH }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: `${LABEL_WIDTH}px repeat(${DAY_COUNT}, ${CELL_WIDTH}px)`, bgcolor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
              <Box sx={{ position: 'sticky', left: 0, zIndex: 4, p: 1.15, bgcolor: '#f8fafc', borderRight: '1px solid #cbd5e1' }}>
                <Typography sx={{ color: '#475569', fontSize: '0.68rem', fontWeight: 950 }}>PLANNED LOAD</Typography>
              </Box>
              {days.map((day) => (
                <Box key={day} sx={{ p: 1, textAlign: 'center', bgcolor: day === initialDate ? '#eff6ff' : '#f8fafc', borderRight: '1px solid #e2e8f0', boxShadow: day === initialDate ? 'inset 0 -3px 0 #3b82f6' : 'none' }}>
                  <Typography sx={{ color: day === initialDate ? '#1d4ed8' : '#475569', fontSize: '0.69rem', fontWeight: 950 }}>{dayFormatter.format(parseIsoDate(day))}</Typography>
                </Box>
              ))}
            </Box>

            {workCenters.map((workCenter) => {
              const workCenterCells = days.map((day) => cellMap.get(`${workCenter}|${day}`));
              const workCenterHours = Number(workCenterCells.reduce((sum, cell) => sum + (cell?.hours ?? 0), 0).toFixed(1));
              return (
                <Box key={workCenter} sx={{ display: 'grid', gridTemplateColumns: `${LABEL_WIDTH}px repeat(${DAY_COUNT}, ${CELL_WIDTH}px)`, borderBottom: '1px solid #e2e8f0' }}>
                  <Box sx={{ position: 'sticky', left: 0, zIndex: 3, p: 1.2, minHeight: 92, bgcolor: '#ffffff', borderRight: '1px solid #cbd5e1' }}>
                    <Typography sx={{ color: '#0f172a', fontSize: '0.8rem', fontWeight: 950 }}>WC {workCenter}</Typography>
                    <Typography sx={{ mt: 0.25, color: '#0f766e', fontSize: '0.63rem', fontWeight: 850 }}>{numberFormatter.format(workCenterHours)} ชม.</Typography>
                  </Box>
                  {days.map((day) => {
                    const key = `${workCenter}|${day}`;
                    const cell = cellMap.get(key);
                    const style = loadStyle(cell?.hours ?? 0, maxHours);
                    const isSelected = selectedCell?.key === key;
                    return (
                      <ButtonBase
                        key={day}
                        onClick={() => cell && setSelectedKey(key)}
                        disabled={!cell}
                        sx={{
                          m: 0.55,
                          p: 0.8,
                          minHeight: 80,
                          display: 'block',
                          textAlign: 'left',
                          borderRadius: 1.6,
                          color: style.color,
                          bgcolor: style.bg,
                          border: `1px solid ${isSelected ? style.color : style.border}`,
                          boxShadow: isSelected ? `0 0 0 2px ${style.color}28` : 'none',
                          '&.Mui-disabled': { opacity: 1, color: style.color },
                        }}
                      >
                        <Typography sx={{ fontSize: '0.78rem', lineHeight: 1.1, fontWeight: 950 }}>{cell ? `${numberFormatter.format(cell.hours)} ชม.` : '—'}</Typography>
                        <Typography sx={{ mt: 0.35, fontSize: '0.59rem', fontWeight: 850 }}>{cell ? `${cell.operations.length} OP · ${style.label}` : 'ไม่มีงาน'}</Typography>
                        {cell && cell.missingTime > 0 && <Typography sx={{ mt: 0.2, fontSize: '0.55rem', fontWeight: 900 }}>! ไม่มีเวลา {cell.missingTime} OP</Typography>}
                      </ButtonBase>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box sx={{ p: 1.6, minHeight: 280, bgcolor: '#fbfdff', borderLeft: { xl: '1px solid #e2e8f0' }, borderTop: { xs: '1px solid #e2e8f0', xl: 0 } }}>
          {selectedCell ? (
            <Stack spacing={1.25}>
              <Box>
                <Typography sx={{ color: '#0f172a', fontWeight: 950 }}>WC {selectedCell.workCenter}</Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>{detailDateFormatter.format(parseIsoDate(selectedCell.date))}</Typography>
              </Box>
              <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', gap: 0.6 }}>
                <Chip size="small" label={`${numberFormatter.format(selectedCell.hours)} ชั่วโมง`} sx={{ color: '#0f766e', bgcolor: '#ccfbf1', fontWeight: 900 }} />
                <Chip size="small" label={`${selectedCell.operations.length} OP`} sx={{ color: '#4338ca', bgcolor: '#eef2ff', fontWeight: 900 }} />
              </Stack>
              <Stack spacing={0.65}>
                {selectedCell.operations.slice(0, 8).map((operation) => (
                  <Box key={operation.id} sx={{ p: 0.85, borderRadius: 1.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff', boxShadow: `inset 3px 0 0 ${statusColor(operation.status)}` }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                      <Typography noWrap sx={{ minWidth: 0, color: '#334155', fontSize: '0.67rem', fontWeight: 950 }}>{operation.order} · OP {operation.operation || '-'}</Typography>
                      <Typography sx={{ flexShrink: 0, color: operation.opTime > 0 ? '#0f766e' : '#b45309', fontSize: '0.62rem', fontWeight: 900 }}>{operation.opTime > 0 ? `${numberFormatter.format(operation.opTime)} ชม.` : 'ไม่มีเวลา'}</Typography>
                    </Stack>
                    <Typography noWrap sx={{ mt: 0.15, color: '#64748b', fontSize: '0.59rem' }}>{operation.status} · Qty {numberFormatter.format(operation.quantity)}</Typography>
                  </Box>
                ))}
                {selectedCell.operations.length > 8 && <Typography sx={{ color: '#64748b', fontSize: '0.63rem', fontWeight: 850 }}>+{selectedCell.operations.length - 8} Operations</Typography>}
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'flex-start' }}>
              <InfoCircle size="18" color="#64748b" />
              <Typography sx={{ color: '#64748b', fontSize: '0.7rem' }}>ช่วงนี้ไม่มี Planned Load ตาม Filter ที่เลือก</Typography>
            </Stack>
          )}
        </Box>
      </Box>

      <Stack direction="row" spacing={1.25} sx={{ px: 2, py: 1.3, alignItems: 'center', flexWrap: 'wrap', gap: 0.7, borderTop: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        {[
          ['#e0f2fe', '#0369a1', 'ต่ำ · 0–25%'],
          ['#ccfbf1', '#0f766e', 'ปานกลาง · 26–50%'],
          ['#fef3c7', '#92400e', 'สูง · 51–75%'],
          ['#fee2e2', '#b91c1c', 'สูงมาก · 76–100%'],
        ].map(([bg, color, label]) => (
          <Stack key={label} direction="row" spacing={0.45} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.6, bgcolor: bg, border: `1px solid ${color}` }} />
            <Typography sx={{ color: '#64748b', fontSize: '0.59rem', fontWeight: 800 }}>{label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
