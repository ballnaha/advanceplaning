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
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
};

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatChangeDirection(change: SequenceChange) {
  const diff = change.previousSeq - change.currentSeq;
  if (diff > 0) return `ขึ้น ${formatNumber(diff)} ลำดับ`;
  if (diff < 0) return `ลง ${formatNumber(Math.abs(diff))} ลำดับ`;
  if (change.previousWorkCenter !== change.currentWorkCenter) return 'ย้าย Work center';
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
}: SequenceChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      disableScrollLock
      keepMounted
      transitionDuration={0}
      slotProps={{
        backdrop: {
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.35)',
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
                  {changes.map(({ job, change }) => (
                    <TableRow key={job.id}>
                      {showWorkCenter && (
                        <TableCell>
                          <Chip size="small" label={change.currentWorkCenter} />
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
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.25, borderTop: '1px solid rgba(15, 23, 42, 0.08)', bgcolor: '#ffffff' }}>
        <Button onClick={onClose}>ปิด</Button>
      </DialogActions>
    </Dialog>
  );
}
