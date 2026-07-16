'use client';

import * as React from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grow,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
  Skeleton,
  Button,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { cleanZpg2d } from '@/lib/zpg1d-helpers';
import type { PlanningJob } from '@/lib/planning';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const numberFormatter = new Intl.NumberFormat('th-TH');
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

type LacquerColor = {
  bg: string;
  chipBg: string;
  text: string;
  border: string;
};

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

const DEFAULT_WORK_CENTERS = ['111001', '111002', '111003', '111004', '111005'];

type DetailField = {
  key: keyof PlanningJob;
  label: string;
  always?: boolean;
  highlight?: 'status' | 'lacquer';
};

type DetailSection = {
  accent: string;
  fields: DetailField[];
  title: string;
};

type JobDetailDialogProps = {
  fallbackLacquerColor: LacquerColor;
  job: PlanningJob | null;
  lacquerColorMap: Map<string, LacquerColor>;
  onClose: () => void;
  onQuickMove?: (jobId: number, targetWorkCenter: string, targetStartDate: string) => void;
  workCenters?: string[];
};

const detailSections: DetailSection[] = [
  {
    title: 'Production Plan',
    accent: '#7c3aed',
    fields: [
      { key: 'stdate', label: 'Start Date', always: true },
      { key: 'findate', label: 'Finish Date', always: true },
      { key: 'prdday', label: 'PRD.(Days)' },
      { key: 'vornr', label: 'OP' },
      { key: 'ltxa1', label: 'OP DESC' },
      { key: 'usr00', label: 'FW.' },
      { key: 'usr02', label: 'TEMP' },
      { key: 'time', label: 'Op. (HR)' },
      { key: 'optime', label: 'Op. Time', always: true },
      { key: 'opdays', label: 'Op. Days', always: true },
      { key: 'mgvrg', label: 'Order Quantity', always: true },
    ],
  },
  {
    title: 'Planning Override',
    accent: '#7c3aed',
    fields: [
      { key: 'queueGroup', label: 'Queue Group' },
    ],
  },
  {
    title: 'Material Groups',
    accent: '#0891b2',
    fields: [
      { key: 'zpmat', label: 'เหล็กอาบ' },
      { key: 'zptkx', label: 'Description 1' },
      { key: 'zptxt', label: 'Description 2' },
      { key: 'zpg1d', label: 'Group 1' },
      { key: 'zpg2d', label: 'Group 2' },
      { key: 'zpg3d', label: 'Group 3' },
      { key: 'zpg4d', label: 'Group 4' },
      { key: 'zpg5d', label: 'Group 5' },
    ],
  },
  {
    title: 'Steel Dib',
    accent: '#475569',
    fields: [
      { key: 'steelDibId', label: 'เหล็กดิบ' },
      { key: 'steelDibDesc', label: 'Description 1' },
      { key: 'steelDibLong', label: 'Description 2' },
    ],
  },
  {
    title: 'Lacquer',
    accent: '#f59e0b',
    fields: [
      { key: 'zlmat', label: 'Lacquer', highlight: 'lacquer' },
      { key: 'zltkx', label: 'Description', highlight: 'lacquer' },
      { key: 'zlg3d', label: 'Group 3' },
      { key: 'zlg5d', label: 'Group 5' },
    ],
  },
  {
    title: 'Confirmation',
    accent: '#ea580c',
    fields: [
      { key: 'remark', label: 'Remark' },
      { key: 'entd', label: 'Re-arrange Date' },
      { key: 'zvers', label: 'Version' },
      { key: 'confirmYield', label: 'Yield' },
      { key: 'confirmHold', label: 'Hold' },
      { key: 'confirmScrap', label: 'Scrap' },
    ],
  },
];

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

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return '-';
  return dateFormatter.format(new Date(value));
}

function calculateInclusiveProductionDays(startDate: string | null, finishDate: string | null) {
  if (!startDate || !finishDate) return null;
  const start = new Date(`${startDate}T00:00:00Z`);
  const finish = new Date(`${finishDate}T00:00:00Z`);
  const diffMs = finish.getTime() - start.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return null;
  return Math.floor(diffMs / 86_400_000) + 1;
}

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

function isEmptyDetailValue(value: PlanningJob[keyof PlanningJob]) {
  return value === null || value === undefined || value === '';
}

function formatDetailValue(job: PlanningJob, key: keyof PlanningJob) {
  const value = job[key];
  if (value === null || value === undefined || value === '') return '-';
  if (key === 'stdate' || key === 'findate' || key === 'entd') return formatDate(String(value));
  if (key === 'zpg2d') return cleanZpg2d(String(value));
  if (typeof value === 'number') return formatNumber(value);
  return value;
}

function renderDetailValue(
  job: PlanningJob,
  field: DetailField,
  lacquerColor: LacquerColor,
) {
  const value = formatDetailValue(job, field.key);

  if (field.key === 'findate' && value !== '-') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {value}
        {isNearOrOverdue(job.findate) && (
          <Tooltip title="ใกล้ถึงกำหนดส่งหรือเกินกำหนด (ภายใน 3 วัน)" arrow>
            <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
              <YellowWarningIcon />
            </span>
          </Tooltip>
        )}
      </span>
    );
  }

  if (field.highlight === 'status' && value !== '-') {
    return (
      <Chip
        size="small"
        color={String(value).toUpperCase() === 'WAIT' ? 'warning' : 'default'}
        label={value}
        sx={{ height: 20, fontWeight: 800, fontSize: '0.68rem', borderRadius: 1 }}
      />
    );
  }

  if (field.highlight === 'lacquer' && value !== '-') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          px: 0.75,
          py: 0.15,
          borderRadius: 0.75,
          bgcolor: lacquerColor.chipBg,
          border: `1px solid ${lacquerColor.border}`,
          color: lacquerColor.text,
          fontWeight: 850,
          fontSize: '0.72rem',
        }}
      >
        {value}
      </Box>
    );
  }

  return value;
}

function SummaryTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.25,
        border: '1px solid rgba(15, 23, 42, 0.06)',
        borderRadius: 1.25,
        bgcolor: '#ffffff',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 750, mb: 0.25, fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ fontWeight: 900, color: 'text.primary', wordBreak: 'break-word', fontSize: '0.95rem' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function JobDetailDialog({
  fallbackLacquerColor,
  job: currentJob,
  lacquerColorMap,
  onClose,
  onQuickMove,
  workCenters,
}: JobDetailDialogProps) {
  const [retainedJob, setRetainedJob] = React.useState<PlanningJob | null>(currentJob);
  const [selectedJobOverride, setSelectedJobOverride] = React.useState<PlanningJob | null>(null);
  const [routing, setRouting] = React.useState<PlanningJob[]>([]);
  const [loadingRouting, setLoadingRouting] = React.useState(false);

  React.useEffect(() => {
    if (currentJob) setRetainedJob(currentJob);
  }, [currentJob]);

  // Reset override when dialog is opened/changed with a new currentJob
  React.useEffect(() => {
    setSelectedJobOverride(null);
    setShowQuickReschedule(false);
  }, [currentJob]);

  const job = selectedJobOverride ?? currentJob ?? retainedJob;

  const [targetWC, setTargetWC] = React.useState(job?.arbpl || '');
  const [targetDate, setTargetDate] = React.useState(job?.stdate || '');
  const [showQuickReschedule, setShowQuickReschedule] = React.useState(false);
  const [savingQuickMove, setSavingQuickMove] = React.useState(false);

  const wcList = workCenters || DEFAULT_WORK_CENTERS;

  React.useEffect(() => {
    if (job) {
      setTargetWC(job.arbpl);
      setTargetDate(job.stdate || '');
    }
  }, [job]);

  const handleMoveClick = async () => {
    if (!job || !targetWC || !targetDate) return;

    if (onQuickMove) {
      onQuickMove(job.id, targetWC, targetDate);
      onClose();
    } else {
      setSavingQuickMove(true);
      try {
        const duration = calculateInclusiveProductionDays(job.stdate, job.findate) || job.prdday || 1;
        const newFinishDateStr = dayjs(targetDate).add(duration - 1, 'day').format('YYYY-MM-DD');

        const response = await fetch('/api/jobs/update-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [
              {
                id: job.id,
                stdate: targetDate,
                findate: newFinishDateStr,
                arbpl: targetWC,
                seqno: job.seqno,
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update schedule');
        }

        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการย้ายเครื่องจักร/วันที่');
      } finally {
        setSavingQuickMove(false);
      }
    }
  };

  React.useEffect(() => {
    if (!job?.aufnr) {
      setRouting([]);
      return;
    }

    let active = true;
    setLoadingRouting(true);

    fetch(`/api/jobs/routing?aufnr=${encodeURIComponent(job.aufnr)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch routing');
        return res.json();
      })
      .then((data) => {
        if (active && Array.isArray(data)) {
          setRouting(data);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (active) setLoadingRouting(false);
      });

    return () => {
      active = false;
    };
  }, [job?.aufnr]);

  const handleSelectStep = (clickedJob: PlanningJob) => {
    setSelectedJobOverride(clickedJob);
    setRetainedJob(clickedJob);
  };

  const lacquerColor = job ? lacquerColorMap.get(getLacquerKey(job)) ?? fallbackLacquerColor : fallbackLacquerColor;
  const productionDays = job ? calculateInclusiveProductionDays(job.stdate, job.findate) ?? job.prdday ?? 0 : 0;

  return (
    <Dialog
      open={currentJob !== null}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      disableScrollLock
      slots={{ transition: Grow }}
      transitionDuration={{ enter: 280, exit: 220 }}
      slotProps={{
        transition: {
          easing: {
            enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
            exit: 'cubic-bezier(0.4, 0, 1, 1)',
          },
          onExited: () => {
            setRetainedJob(null);
            setSelectedJobOverride(null);
          },
        },
        backdrop: {
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(3px)',
            transition: 'opacity 220ms ease, backdrop-filter 220ms ease',
          },
        },
        paper: {
          sx: {
            bgcolor: '#ffffff',
            backgroundImage: 'none',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: 2,
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.16), 0 8px 24px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          bgcolor: '#ffffff',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.75 }}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 900, fontSize: '1.25rem' }}>
                Order #{job?.aufnr ?? ''}
              </Typography>
              {(() => {
                const status = job?.text1?.trim().toUpperCase() || 'NOT START';
                const style = getStatusStyle(status);
                return (
                  <Chip
                    size="small"
                    label={status}
                    sx={{
                      height: 22,
                      borderRadius: 1,
                      fontWeight: 850,
                      color: style.color,
                      bgcolor: style.bg,
                      border: `1px solid ${style.border}`,
                    }}
                  />
                );
              })()}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.92rem' }}>
              {job?.zptkx || job?.ltxa1 || 'รายละเอียดคำสั่งซื้อ'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            aria-label="close"
            size="small"
            sx={{
              color: 'text.secondary',
              bgcolor: 'rgba(15, 23, 42, 0.04)',
              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.08)', color: 'text.primary' },
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
        {job && (
          <Box sx={{ p: 2.5 }}>
            {/* Routing Flow Stepper */}
            {routing.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2.5,
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  borderRadius: 1.5,
                  bgcolor: '#ffffff',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#64748b',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    mb: 2,
                  }}
                >
                  เส้นทางการผลิต (Order Routing Flow)
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                      height: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      bgcolor: 'rgba(15, 23, 42, 0.02)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      bgcolor: 'rgba(15, 23, 42, 0.1)',
                      borderRadius: 3,
                    },
                  }}
                >
                  {loadingRouting ? (
                    <Stack direction="row" spacing={3} sx={{ width: '100%', py: 1 }}>
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <Box key={idx} sx={{ minWidth: 140, flex: 1 }}>
                          <Skeleton variant="circular" width={28} height={28} sx={{ mb: 1 }} />
                          <Skeleton variant="text" width="60%" height={16} />
                          <Skeleton variant="text" width="80%" height={12} />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={0} sx={{ minWidth: '100%', position: 'relative', py: 1 }}>
                      {routing.map((rJob, idx) => {
                        const isActive = rJob.id === job.id;
                        const status = rJob.text1?.trim().toUpperCase() || 'NOT START';
                        const statusStyle = getStatusStyle(status);
                        const isLast = idx === routing.length - 1;

                        return (
                          <Box
                            key={rJob.id}
                            onClick={() => handleSelectStep(rJob)}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              position: 'relative',
                              flex: 1,
                              minWidth: 140,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': {
                                '& .step-dot': {
                                  transform: 'scale(1.15)',
                                  boxShadow: `0 0 0 4px ${statusStyle.border}3d`,
                                },
                                '& .step-title': {
                                  color: '#4f46e5',
                                },
                              },
                            }}
                          >
                            {/* Horizontal Connector Line */}
                            {!isLast && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 14,
                                  left: '50%',
                                  right: '-50%',
                                  height: 3,
                                  bgcolor: status === 'DONE' ? '#10b981' : 'rgba(15, 23, 42, 0.08)',
                                  zIndex: 1,
                                  transition: 'background-color 0.2s ease',
                                }}
                              />
                            )}

                            {/* Step Dot/Circle */}
                            <Box
                              className="step-dot"
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: statusStyle.bg,
                                border: `2px solid ${statusStyle.border}`,
                                color: statusStyle.color,
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 900,
                                fontSize: '0.72rem',
                                zIndex: 2,
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                ...(isActive ? {
                                  boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.25)',
                                  borderColor: '#4f46e5',
                                  bgcolor: '#4f46e5',
                                  color: '#ffffff',
                                  animation: 'pulseGlow 2s infinite ease-in-out',
                                  '@keyframes pulseGlow': {
                                    '0%': { boxShadow: '0 0 0 0 rgba(79, 70, 229, 0.4)' },
                                    '70%': { boxShadow: '0 0 0 6px rgba(79, 70, 229, 0)' },
                                    '100%': { boxShadow: '0 0 0 0 rgba(79, 70, 229, 0)' },
                                  },
                                } : {}),
                              }}
                            >
                              {idx + 1}
                            </Box>

                            {/* Step labels */}
                            <Box sx={{ mt: 1.5, textAlign: 'center', px: 1, width: '100%' }}>
                              <Typography
                                className="step-title"
                                sx={{
                                  fontSize: '0.8rem',
                                  fontWeight: isActive ? 950 : 800,
                                  color: isActive ? '#4f46e5' : '#0f172a',
                                  lineHeight: 1.2,
                                  transition: 'color 0.15s ease',
                                }}
                              >
                                OP {rJob.vornr || '-'}
                              </Typography>
                              
                              <Typography
                                sx={{
                                  fontSize: '0.72rem',
                                  fontWeight: 850,
                                  color: '#0f766e',
                                  mt: 0.2,
                                }}
                              >
                                WC {rJob.arbpl}
                              </Typography>

                              <Typography
                                noWrap
                                title={rJob.ltxa1 || ''}
                                sx={{
                                  fontSize: '0.66rem',
                                  color: '#64748b',
                                  mt: 0.15,
                                  maxWidth: '100%',
                                  fontWeight: 650,
                                }}
                              >
                                {rJob.ltxa1 || '-'}
                              </Typography>

                              <Typography
                                sx={{
                                  fontSize: '0.62rem',
                                  color: '#94a3b8',
                                  mt: 0.2,
                                  fontWeight: 700,
                                }}
                              >
                                {rJob.stdate ? `${rJob.stdate.split('-').slice(1).reverse().join('/')}` : '-'}
                                {rJob.findate ? ` - ${rJob.findate.split('-').slice(1).reverse().join('/')}` : ''}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Paper>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
                gap: 1,
                mb: 2,
              }}
            >
              <SummaryTile label="Work center" value={job.arbpl} />
              <SummaryTile label="Seq." value={formatNumber(job.seqno)} />
              <SummaryTile label="Start" value={formatDate(job.stdate)} />
              <SummaryTile
                label="Finish"
                value={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {formatDate(job.findate)}
                    {isNearOrOverdue(job.findate) && (
                      <Tooltip title="ใกล้ถึงกำหนดส่งหรือเกินกำหนด (ภายใน 3 วัน)" arrow>
                        <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                          <YellowWarningIcon />
                        </span>
                      </Tooltip>
                    )}
                  </span>
                }
              />
              <SummaryTile label="PRD.(Days)" value={`${formatNumber(productionDays)} วัน`} />
              <SummaryTile label="Qty" value={formatNumber(job.mgvrg)} />
            </Box>

            {/* Toggle Button for Quick Reschedule */}
            {wcList.length > 0 && (
              <Stack direction="row" sx={{ justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowQuickReschedule(!showQuickReschedule)}
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.78rem',
                    fontWeight: 850,
                    color: '#4f46e5',
                    borderColor: '#cbd5e1',
                    px: 1.5,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(79, 70, 229, 0.04)',
                      borderColor: '#4f46e5',
                    }
                  }}
                >
                  {showQuickReschedule ? '❌ ปิดเครื่องมือย้ายงาน' : '⚡ ย้ายแผนการผลิตด่วน (Quick Reschedule)'}
                </Button>
              </Stack>
            )}

            {/* Quick Reschedule Section */}
            {showQuickReschedule && wcList.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2.5,
                  borderRadius: 2.25,
                  border: '1px solid #4f46e5',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.03) 0%, rgba(99, 102, 241, 0.01) 100%)',
                }}
              >
                <Typography sx={{ color: '#4f46e5', fontWeight: 900, fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                  ⚡ QUICK RESCHEDULE · ย้ายงานทางลัด
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-end' }}>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography sx={{ fontSize: '0.74rem', color: '#475569', fontWeight: 750, mb: 0.75 }}>
                      ย้ายไปเครื่องจักร (Work Center)
                    </Typography>
                    <Select
                      size="small"
                      fullWidth
                      disabled={savingQuickMove}
                      value={targetWC}
                      onChange={(e) => setTargetWC(e.target.value)}
                      sx={{ borderRadius: 1.5, fontSize: '0.84rem', fontWeight: 800, bgcolor: '#ffffff' }}
                    >
                      {wcList.map((wc) => (
                        <MenuItem key={wc} value={wc} sx={{ fontSize: '0.84rem', fontWeight: 700 }}>
                          WC {wc}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>

                  <Box sx={{ flex: 1.5, minWidth: 160 }}>
                    <Typography sx={{ fontSize: '0.74rem', color: '#475569', fontWeight: 750, mb: 0.75 }}>
                      กำหนดวันที่เริ่มต้นแผนใหม่ (Start Date)
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        format="DD/MM/YYYY"
                        disabled={savingQuickMove}
                        value={targetDate ? dayjs(targetDate) : null}
                        onChange={(newValue) => {
                          if (newValue) {
                            setTargetDate(newValue.format('YYYY-MM-DD'));
                          }
                        }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                            sx: {
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#ffffff' },
                              '& .MuiInputBase-input': { fontSize: '0.84rem', fontWeight: 800, py: 1.05 }
                            }
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Box>

                  <Button
                    variant="contained"
                    size="medium"
                    disabled={savingQuickMove}
                    onClick={handleMoveClick}
                    sx={{
                      height: 38,
                      borderRadius: 1.5,
                      fontSize: '0.82rem',
                      fontWeight: 850,
                      bgcolor: '#4f46e5',
                      color: '#ffffff',
                      px: 2.5,
                      boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: '#4338ca',
                        boxShadow: '0 6px 14px rgba(79, 70, 229, 0.35)',
                      }
                    }}
                  >
                    {savingQuickMove ? 'กำลังบันทึก...' : 'ย้ายแผนการผลิต'}
                  </Button>
                </Stack>
              </Paper>
            )}

            <Box
              sx={{
                columnCount: { xs: 1, lg: 2 },
                columnGap: 1.5,
              }}
            >
              {detailSections.map((section) => {
                const visibleFields = section.fields.filter((field) => field.always || !isEmptyDetailValue(job[field.key]));
                if (visibleFields.length === 0) return null;

                return (
                  <Paper
                    key={section.title}
                    elevation={0}
                    sx={{
                      display: 'inline-block',
                      width: '100%',
                      mb: 1.5,
                      overflow: 'hidden',
                      breakInside: 'avoid',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      borderRadius: 1.5,
                      bgcolor: '#ffffff',
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 1,
                        borderLeft: `4px solid ${section.accent}`,
                        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
                        bgcolor: 'rgba(15, 23, 42, 0.018)',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 900, color: 'text.primary', fontSize: '0.92rem' }}>
                        {section.title}
                      </Typography>
                    </Box>

                    <Box>
                      {visibleFields.map((field) => (
                        <Box
                          key={field.key}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '120px 1fr', sm: '150px 1fr' },
                            gap: 1,
                            px: 1.5,
                            py: 0.85,
                            borderBottom: '1px solid rgba(15, 23, 42, 0.04)',
                            '&:last-of-type': { borderBottom: 0 },
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750, fontSize: '0.8rem' }}>
                            {field.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            component="div"
                            sx={{
                              color: 'text.primary',
                              fontWeight: 760,
                              minWidth: 0,
                              overflowWrap: 'anywhere',
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.95rem',
                            }}
                          >
                            {renderDetailValue(job, field, lacquerColor)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                );
              })}
          </Box>
        </Box>
      )}
    </DialogContent>
  </Dialog>
  );
}
