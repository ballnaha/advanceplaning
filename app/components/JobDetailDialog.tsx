'use client';

import * as React from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import { cleanZpg2d } from '@/lib/zpg1d-helpers';
import type { PlanningJob } from '@/lib/planning';

const numberFormatter = new Intl.NumberFormat('th-TH');
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

type LacquerColor = {
  bg: string;
  chipBg: string;
  text: string;
  border: string;
};

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
  job,
  lacquerColorMap,
  onClose,
}: JobDetailDialogProps) {
  const lacquerColor = job ? lacquerColorMap.get(getLacquerKey(job)) ?? fallbackLacquerColor : fallbackLacquerColor;
  const productionDays = job ? calculateInclusiveProductionDays(job.stdate, job.findate) ?? job.prdday ?? 0 : 0;

  return (
    <Dialog
      open={job !== null}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      disableScrollLock
      transitionDuration={{ enter: 150, exit: 100 }}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.35)',
            backdropFilter: 'blur(3px)',
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
              {job?.text1 && (
                <Chip
                  size="small"
                  color={job.text1.toUpperCase() === 'WAIT' ? 'warning' : 'default'}
                  label={job.text1}
                  sx={{ height: 22, borderRadius: 1, fontWeight: 850 }}
                />
              )}
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
