'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grow,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { PlanningJob } from '@/lib/planning';
import type { SequenceChange } from './PlanningGroupTable';

const numberFormatter = new Intl.NumberFormat('th-TH');

export type SequenceChangedJob = {
  job: PlanningJob;
  change: SequenceChange;
};

type SequenceChangesDialogProps = {
  changes: SequenceChangedJob[];
  description: string;
  open: boolean;
  showWorkCenter?: boolean;
  title: string;
  onClose: () => void;
  isPublishing?: boolean;
  onPublish?: () => void | Promise<void>;
};

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatChangeDirection(change: SequenceChange) {
  if (change.previousWorkCenter !== change.currentWorkCenter) return 'ย้าย Work Center';
  const diff = change.previousSeq - change.currentSeq;
  if (diff > 0) return `ขึ้น ${formatNumber(diff)} ลำดับ`;
  if (diff < 0) return `ลง ${formatNumber(Math.abs(diff))} ลำดับ`;
  if (change.previousGroup !== change.currentGroup) return 'เปลี่ยนกลุ่ม';
  return 'เปลี่ยนแปลง';
}

export default function SequenceChangesDialog({
  changes,
  description,
  open,
  showWorkCenter = false,
  title,
  onClose,
  isPublishing = false,
  onPublish,
}: SequenceChangesDialogProps) {
  const [changeFilter, setChangeFilter] = React.useState<'ALL' | 'WORK_CENTER' | 'SEQUENCE' | 'GROUP'>('ALL');
  const [orderSearch, setOrderSearch] = React.useState('');
  const stats = React.useMemo(() => ({
    workCenterMoves: changes.filter(({ change }) => change.previousWorkCenter !== change.currentWorkCenter).length,
    sequenceMoves: changes.filter(({ change }) => change.previousSeq !== change.currentSeq).length,
    groupMoves: changes.filter(({ change }) => change.previousGroup !== change.currentGroup).length,
    affectedWorkCenters: new Set(changes.flatMap(({ change }) => [change.previousWorkCenter, change.currentWorkCenter])).size,
  }), [changes]);
  const filteredChanges = React.useMemo(() => {
    const query = orderSearch.trim().toLocaleUpperCase('th-TH');
    return changes.filter(({ job, change }) => {
      if (query && !job.aufnr.toLocaleUpperCase('th-TH').includes(query)) return false;
      if (changeFilter === 'WORK_CENTER') return change.previousWorkCenter !== change.currentWorkCenter;
      if (changeFilter === 'SEQUENCE') return change.previousSeq !== change.currentSeq;
      if (changeFilter === 'GROUP') return change.previousGroup !== change.currentGroup;
      return true;
    });
  }, [changeFilter, changes, orderSearch]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={showWorkCenter ? 'lg' : 'md'}
      disableScrollLock
      keepMounted
      slots={{ transition: Grow }}
      transitionDuration={{ enter: 280, exit: 220 }}
      slotProps={{
        transition: {
          easing: {
            enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
            exit: 'cubic-bezier(0.4, 0, 1, 1)',
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
            <Typography component="h2" variant="h6" sx={{ fontWeight: 900, fontSize: '1.25rem' }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 650, fontSize: '0.92rem' }}>
              {description}
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
        {changes.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', p: 2.5 }}>
            ยังไม่มีรายการเปลี่ยนแปลง
          </Typography>
        ) : (
          <Box sx={{ p: 2.5 }}>
            {showWorkCenter && (
              <>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  {[
                    { label: 'รายการเปลี่ยนแปลง', value: changes.length, color: '#4f46e5' },
                    { label: 'ย้าย Work Center', value: stats.workCenterMoves, color: '#dc2626' },
                    { label: 'เปลี่ยนลำดับ', value: stats.sequenceMoves, color: '#d97706' },
                    { label: 'Work Center ที่กระทบ', value: stats.affectedWorkCenters, color: '#0891b2' },
                  ].map((item) => (
                    <Paper key={item.label} elevation={0} sx={{ p: 1.25, border: '1px solid rgba(15, 23, 42, 0.07)', borderRadius: 1.5, bgcolor: '#ffffff' }}>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 750 }}>{item.label}</Typography>
                      <Typography variant="h6" sx={{ mt: 0.2, color: item.color, fontWeight: 950 }}>{formatNumber(item.value)}</Typography>
                    </Paper>
                  ))}
                </Box>

                <Paper elevation={0} sx={{ p: 1.25, mb: 1.5, border: '1px solid rgba(15, 23, 42, 0.07)', borderRadius: 1.5, bgcolor: '#ffffff' }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
                    <Stack direction="row" spacing={0.6} sx={{ flexWrap: 'wrap', rowGap: 0.6 }}>
                      {[
                        { value: 'ALL' as const, label: `ทั้งหมด ${changes.length}` },
                        { value: 'WORK_CENTER' as const, label: `ย้ายเครื่อง ${stats.workCenterMoves}` },
                        { value: 'SEQUENCE' as const, label: `เปลี่ยนลำดับ ${stats.sequenceMoves}` },
                        { value: 'GROUP' as const, label: `เปลี่ยนกลุ่ม ${stats.groupMoves}` },
                      ].map((filter) => (
                        <Chip
                          key={filter.value}
                          clickable
                          size="small"
                          label={filter.label}
                          color={changeFilter === filter.value ? 'primary' : 'default'}
                          variant={changeFilter === filter.value ? 'filled' : 'outlined'}
                          onClick={() => setChangeFilter(filter.value)}
                          sx={{ fontWeight: 850 }}
                        />
                      ))}
                    </Stack>
                    <TextField
                      size="small"
                      type="search"
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                      placeholder="ค้นหา Order Number"
                      sx={{ minWidth: { md: 230 }, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    />
                  </Stack>
                </Paper>
              </>
            )}

            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: '1px solid rgba(15, 23, 42, 0.06)',
                borderRadius: 1.5,
                bgcolor: '#ffffff',
                maxHeight: { xs: '58vh', md: '62vh' },
                overflow: 'auto',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {showWorkCenter && <TableCell width={120}>Work Center</TableCell>}
                    <TableCell width={150}>Order</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell width={90} align="center">เดิม</TableCell>
                    <TableCell width={90} align="center">ใหม่</TableCell>
                    <TableCell width={140}>เปลี่ยน</TableCell>
                    <TableCell width={160}>กลุ่ม</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredChanges.map(({ job, change }) => (
                    <TableRow key={job.id}>
                      {showWorkCenter && (
                        <TableCell>
                          <Stack spacing={0.35} sx={{ alignItems: 'flex-start' }}>
                            <Chip size="small" variant="outlined" label={change.previousWorkCenter} sx={{ height: 20, fontSize: '0.66rem' }} />
                            {change.previousWorkCenter !== change.currentWorkCenter && (
                              <>
                                <Typography variant="caption" sx={{ pl: 1, color: '#94a3b8', fontWeight: 900, lineHeight: 1 }}>↓</Typography>
                                <Chip size="small" color="primary" label={change.currentWorkCenter} sx={{ height: 20, fontSize: '0.66rem' }} />
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {job.aufnr}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap title={job.zptkx || '-'}>
                          {job.zptkx || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={change.previousSeq} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" color="warning" label={change.currentSeq} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 750, color: '#92400e' }}>
                          {formatChangeDirection(change)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                          {change.previousGroup !== change.currentGroup
                            ? `${change.previousGroup || '-'} -> ${change.currentGroup || '-'}`
                            : change.currentGroup || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredChanges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={showWorkCenter ? 7 : 6} align="center" sx={{ py: 4, color: 'text.secondary', fontWeight: 750 }}>
                        ไม่พบรายการที่ตรงกับตัวกรอง
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.25, borderTop: '1px solid rgba(15, 23, 42, 0.08)', bgcolor: '#ffffff', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>
          แสดง {formatNumber(filteredChanges.length)} จาก {formatNumber(changes.length)} รายการ
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} disabled={isPublishing}>กลับไปแก้ไข</Button>
          {onPublish && (
            <Button
              variant="contained"
              disabled={changes.length === 0 || isPublishing}
              onClick={onPublish}
              sx={{ px: 2.5, fontWeight: 900, boxShadow: 'none' }}
            >
              {isPublishing ? 'Publishing…' : `Publish ${formatNumber(changes.length)} changes`}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
