'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SequenceChangedJob } from './SequenceChangesDialog';

type ReviewTab = 'OVERVIEW' | 'TRANSFERS' | 'QUEUE' | 'GROUPS';

type PlanningChangeReviewDialogProps = {
  changes: SequenceChangedJob[];
  isPublishing: boolean;
  open: boolean;
  onClose: () => void;
  onPublish: () => void | Promise<void>;
};

const numberFormatter = new Intl.NumberFormat('th-TH');

function formatHours(value: number) {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${numberFormatter.format(Number(value.toFixed(1)))} ชม.`;
}

function ChangeArrow() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', color: '#6366f1', fontWeight: 950, fontSize: '1.2rem' }}>
      →
    </Box>
  );
}

export default function PlanningChangeReviewDialog({
  changes,
  isPublishing,
  open,
  onClose,
  onPublish,
}: PlanningChangeReviewDialogProps) {
  const [tab, setTab] = React.useState<ReviewTab>('OVERVIEW');
  const [orderSearch, setOrderSearch] = React.useState('');
  const [riskAcknowledged, setRiskAcknowledged] = React.useState(false);

  const transfers = React.useMemo(
    () => changes.filter(({ change }) => change.previousWorkCenter !== change.currentWorkCenter),
    [changes],
  );
  const queueChanges = React.useMemo(
    () => changes.filter(({ change }) => change.previousWorkCenter === change.currentWorkCenter && change.previousSeq !== change.currentSeq),
    [changes],
  );
  const groupChanges = React.useMemo(
    () => changes.filter(({ change }) => change.previousGroup !== change.currentGroup),
    [changes],
  );
  const riskChanges = React.useMemo(
    () => transfers.filter(({ job }) => ['START', 'DONE'].includes(job.text1?.toUpperCase() || '')),
    [transfers],
  );
  const affectedWorkCenterCount = React.useMemo(
    () => new Set(changes.flatMap(({ change }) => [change.previousWorkCenter, change.currentWorkCenter])).size,
    [changes],
  );
  const workCenterImpact = React.useMemo(() => {
    const impact = new Map<string, { incoming: number; outgoing: number; hours: number }>();
    for (const { job, change } of transfers) {
      const source = impact.get(change.previousWorkCenter) ?? { incoming: 0, outgoing: 0, hours: 0 };
      source.outgoing += 1;
      source.hours -= job.optime;
      impact.set(change.previousWorkCenter, source);

      const destination = impact.get(change.currentWorkCenter) ?? { incoming: 0, outgoing: 0, hours: 0 };
      destination.incoming += 1;
      destination.hours += job.optime;
      impact.set(change.currentWorkCenter, destination);
    }
    return Array.from(impact.entries()).sort(([a], [b]) => a.localeCompare(b, 'th', { numeric: true }));
  }, [transfers]);
  const queueImpact = React.useMemo(() => {
    const impact = new Map<string, { count: number; up: number; down: number }>();
    for (const { change } of queueChanges) {
      const current = impact.get(change.currentWorkCenter) ?? { count: 0, up: 0, down: 0 };
      current.count += 1;
      if (change.currentSeq < change.previousSeq) current.up += 1;
      if (change.currentSeq > change.previousSeq) current.down += 1;
      impact.set(change.currentWorkCenter, current);
    }
    return Array.from(impact.entries()).sort(([a], [b]) => a.localeCompare(b, 'th', { numeric: true }));
  }, [queueChanges]);

  const visibleChanges = React.useMemo(() => {
    const source = tab === 'TRANSFERS' ? transfers : tab === 'QUEUE' ? queueChanges : tab === 'GROUPS' ? groupChanges : transfers;
    const query = orderSearch.trim().toLocaleUpperCase('th-TH');
    return query ? source.filter(({ job }) => job.aufnr.toLocaleUpperCase('th-TH').includes(query)) : source;
  }, [groupChanges, orderSearch, queueChanges, tab, transfers]);

  return (
    <Dialog
      open={open}
      onClose={isPublishing ? undefined : onClose}
      fullWidth
      maxWidth="xl"
      disableScrollLock
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(15, 23, 42, 0.48)', backdropFilter: 'blur(4px)' } },
        paper: {
          sx: {
            height: { xs: '94vh', md: '88vh' },
            maxHeight: '920px',
            borderRadius: { xs: 2, md: 3 },
            overflow: 'hidden',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 32px 100px rgba(15, 23, 42, 0.24)',
          },
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, md: 3 }, py: 1.75, borderBottom: '1px solid rgba(15, 23, 42, 0.08)', bgcolor: '#ffffff' }}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.4 }}>
              <Typography variant="h6" sx={{ color: '#172033', fontWeight: 950 }}>Production Plan Change Review</Typography>
              <Chip size="small" label="DRAFT" sx={{ height: 22, bgcolor: '#f59e0b', color: '#ffffff', fontWeight: 950 }} />
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 650 }}>
              ตรวจสอบการย้าย Operation และผลกระทบต่อคิวก่อนเผยแพร่แผน
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={isPublishing} aria-label="close review" size="small" sx={{ bgcolor: '#f1f5f9' }}>
            <Typography component="span" sx={{ fontWeight: 900, lineHeight: 1 }}>×</Typography>
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#f4f7fb' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '280px minmax(0, 1fr)' }, minHeight: '100%' }}>
          <Box sx={{ p: 2, bgcolor: '#ffffff', borderRight: { lg: '1px solid rgba(15, 23, 42, 0.08)' } }}>
            <Typography variant="overline" sx={{ color: '#94a3b8', fontWeight: 950 }}>CHANGE SET SUMMARY</Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {[
                { label: 'Operation ที่ย้ายเครื่อง', value: transfers.length, color: '#dc2626', bg: '#fef2f2' },
                { label: 'ผลกระทบต่อลำดับคิว', value: queueChanges.length, color: '#d97706', bg: '#fffbeb' },
                { label: 'รายการเปลี่ยนกลุ่ม', value: groupChanges.length, color: '#7c3aed', bg: '#f5f3ff' },
                { label: 'Work Center ที่กระทบ', value: affectedWorkCenterCount, color: '#0891b2', bg: '#ecfeff' },
              ].map((item) => (
                <Paper key={item.label} elevation={0} sx={{ p: 1.25, borderRadius: 1.5, bgcolor: item.bg, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 750 }}>{item.label}</Typography>
                  <Typography variant="h6" sx={{ mt: 0.15, color: item.color, fontWeight: 950 }}>{numberFormatter.format(item.value)}</Typography>
                </Paper>
              ))}
            </Stack>

            {riskChanges.length > 0 && (
              <Paper elevation={0} sx={{ mt: 1.5, p: 1.25, borderRadius: 1.5, bgcolor: '#fff1f2', border: '1px solid #fecdd3' }}>
                <Typography variant="caption" sx={{ display: 'block', color: '#be123c', fontWeight: 950 }}>ต้องตรวจสอบ</Typography>
                <Typography variant="body2" sx={{ mt: 0.35, color: '#9f1239', fontWeight: 750 }}>
                  มี {numberFormatter.format(riskChanges.length)} Operation สถานะ START/DONE ถูกย้าย Work Center
                </Typography>
                <FormControlLabel
                  sx={{ mt: 0.65, mr: 0, alignItems: 'flex-start', '& .MuiFormControlLabel-label': { fontSize: '0.75rem', color: '#9f1239', fontWeight: 750 } }}
                  control={<Checkbox size="small" checked={riskAcknowledged} onChange={(event) => setRiskAcknowledged(event.target.checked)} sx={{ pt: 0.2 }} />}
                  label="ตรวจสอบแล้วและยืนยันการย้ายงานที่เริ่มผลิต"
                />
              </Paper>
            )}
          </Box>

          <Box sx={{ minWidth: 0, p: { xs: 1.5, md: 2.5 } }}>
            <Paper elevation={0} sx={{ p: 1, mb: 1.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.07)' }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
                <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto' }}>
                  {[
                    { value: 'OVERVIEW' as const, label: 'Overview' },
                    { value: 'TRANSFERS' as const, label: `Transfers (${transfers.length})` },
                    { value: 'QUEUE' as const, label: `Queue impact (${queueChanges.length})` },
                    { value: 'GROUPS' as const, label: `Groups (${groupChanges.length})` },
                  ].map((item) => (
                    <Button
                      key={item.value}
                      size="small"
                      onClick={() => setTab(item.value)}
                      sx={{
                        flex: '0 0 auto',
                        borderRadius: 1.5,
                        fontWeight: 850,
                        color: tab === item.value ? '#ffffff' : '#64748b',
                        bgcolor: tab === item.value ? '#334155' : 'transparent',
                        '&:hover': { bgcolor: tab === item.value ? '#1e293b' : '#f1f5f9' },
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
                {tab !== 'OVERVIEW' && (
                  <TextField
                    size="small"
                    type="search"
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="ค้นหา Order Number"
                    sx={{ minWidth: { md: 230 }, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                  />
                )}
              </Stack>
            </Paper>

            {tab === 'OVERVIEW' ? (
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#172033', fontWeight: 950, mb: 1 }}>Work Center load movement</Typography>
                  {workCenterImpact.length > 0 ? (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                      {workCenterImpact.map(([workCenter, impact]) => (
                        <Paper key={workCenter} elevation={0} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid rgba(15, 23, 42, 0.07)', bgcolor: '#ffffff' }}>
                          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 950 }}>WC {workCenter}</Typography>
                            <Chip
                              size="small"
                              label={formatHours(impact.hours)}
                              sx={{ height: 22, color: impact.hours > 0 ? '#b45309' : '#047857', bgcolor: impact.hours > 0 ? '#fffbeb' : '#ecfdf5', fontWeight: 950 }}
                            />
                          </Stack>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.6, color: 'text.secondary', fontWeight: 750 }}>
                            เข้า {impact.incoming} · ออก {impact.outgoing} Operations
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 1.5, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 750 }}>ไม่มีการย้ายข้าม Work Center</Typography>
                    </Paper>
                  )}
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#172033', fontWeight: 950, mb: 1 }}>Queue impact by Work Center</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' }, gap: 1 }}>
                    {queueImpact.map(([workCenter, impact]) => (
                      <Paper key={workCenter} elevation={0} sx={{ p: 1.25, borderRadius: 1.5, border: '1px solid rgba(15, 23, 42, 0.07)', bgcolor: '#ffffff' }}>
                        <Typography variant="body2" sx={{ fontWeight: 950 }}>WC {workCenter}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontWeight: 750 }}>
                          กระทบ {impact.count} รายการ · ขึ้น {impact.up} · ลง {impact.down}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={0.8}>
                {visibleChanges.map(({ job, change }) => (
                  <Paper key={job.id} elevation={0} sx={{ p: 1.25, borderRadius: 1.75, border: '1px solid rgba(15, 23, 42, 0.08)', bgcolor: '#ffffff' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(190px, 1.1fr) minmax(160px, 1fr) 36px minmax(160px, 1fr)' }, gap: 1, alignItems: 'center' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ color: '#172033', fontWeight: 950 }}>{job.aufnr}</Typography>
                          <Chip size="small" label={job.text1 || 'NOT START'} sx={{ height: 19, fontSize: '0.58rem', fontWeight: 900 }} />
                        </Stack>
                        <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary', fontWeight: 700 }}>
                          {[job.vornr, job.ltxa1].filter(Boolean).join(' ') || job.zptkx || '-'}
                        </Typography>
                      </Box>
                      <Paper elevation={0} sx={{ p: 0.85, bgcolor: '#f8fafc', borderRadius: 1.25 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 850 }}>BEFORE</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>WC {change.previousWorkCenter} · Seq {change.previousSeq}</Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block', color: 'text.secondary' }}>{change.previousGroup || '-'}</Typography>
                      </Paper>
                      <ChangeArrow />
                      <Paper elevation={0} sx={{ p: 0.85, bgcolor: '#eef2ff', borderRadius: 1.25, border: '1px solid #c7d2fe' }}>
                        <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 850 }}>AFTER</Typography>
                        <Typography variant="body2" sx={{ color: '#312e81', fontWeight: 950 }}>WC {change.currentWorkCenter} · Seq {change.currentSeq}</Typography>
                        <Typography variant="caption" noWrap sx={{ display: 'block', color: '#6366f1' }}>{change.currentGroup || '-'}</Typography>
                      </Paper>
                    </Box>
                  </Paper>
                ))}
                {visibleChanges.length === 0 && (
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 750 }}>ไม่พบรายการในหมวดนี้</Typography>
                  </Paper>
                )}
              </Stack>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderTop: '1px solid rgba(15, 23, 42, 0.08)', bgcolor: '#ffffff', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>
          การ Publish จะบันทึก Work Center ต้นทางและปลายทางพร้อมกัน
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={isPublishing}>กลับไปแก้ไข</Button>
          <Button
            variant="contained"
            disabled={changes.length === 0 || isPublishing || (riskChanges.length > 0 && !riskAcknowledged)}
            onClick={onPublish}
            sx={{ px: 2.5, fontWeight: 950, boxShadow: 'none' }}
          >
            {isPublishing ? 'Publishing…' : `Publish ${numberFormatter.format(changes.length)} changes`}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
