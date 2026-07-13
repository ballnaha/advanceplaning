'use client';

import * as React from 'react';
import { Box, Checkbox, Chip, Paper, Stack, Typography } from '@mui/material';
import { HambergerMenu } from 'iconsax-react';
import type { PlanningJob, WorkCenterSummary } from '@/lib/planning';
import JobDetailDialog from './JobDetailDialog';

type LacquerColor = { bg: string; chipBg: string; text: string; border: string };

type RoutingMatrixProps = {
  workCenters: WorkCenterSummary[];
  groupedJobs: Record<string, PlanningJob[]>;
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

const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: '2-digit' });

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : '-';
}

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

function getStatusStyle(status: string | null) {
  switch (status?.toUpperCase()) {
    case 'DONE':
      return { color: '#047857', bgcolor: '#ecfdf5', borderColor: '#a7f3d0' };
    case 'START':
      return { color: '#0369a1', bgcolor: '#f0f9ff', borderColor: '#bae6fd' };
    case 'WAIT':
      return { color: '#b45309', bgcolor: '#fffbeb', borderColor: '#fde68a' };
    default:
      return { color: '#64748b', bgcolor: '#f8fafc', borderColor: '#e2e8f0' };
  }
}

type MatrixOperationProps = {
  job: PlanningJob;
  selected: boolean;
  lacquerColor: LacquerColor;
  onToggleSelect: (jobId: number) => void;
  onOpen: (job: PlanningJob) => void;
  onDragStart: RoutingMatrixProps['onDragStart'];
  onDrag: RoutingMatrixProps['onDrag'];
  onDragOverJob: RoutingMatrixProps['onDragOverJob'];
  onDragLeaveJob: RoutingMatrixProps['onDragLeaveJob'];
  onDropOnJob: RoutingMatrixProps['onDropOnJob'];
  onDragEnd: RoutingMatrixProps['onDragEnd'];
};

const MatrixOperation = React.memo(function MatrixOperation({
  job,
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
}: MatrixOperationProps) {
  const status = getStatusStyle(job.text1);

  return (
    <Paper
      data-job-id={job.id}
      draggable
      elevation={0}
      onClick={() => onOpen(job)}
      onDragStart={(event) => onDragStart(event, job.id)}
      onDrag={onDrag}
      onDragOver={(event) => {
        event.stopPropagation();
        onDragOverJob(event, job.id);
      }}
      onDragLeave={onDragLeaveJob}
      onDrop={(event) => {
        event.stopPropagation();
        onDropOnJob(event, job.id, job.arbpl);
      }}
      onDragEnd={onDragEnd}
      sx={{
        position: 'relative',
        willChange: 'opacity',
        p: 0.75,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: selected ? '#818cf8' : lacquerColor.border,
        bgcolor: selected ? '#f5f7ff' : '#ffffff',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 2px rgba(99, 102, 241, 0.1)' : '0 2px 7px rgba(15, 23, 42, 0.05)',
        transition: 'opacity 120ms ease, border-color 120ms ease',
        '&:hover': { borderColor: '#6366f1' },
        '&.dragging-row': { opacity: 0.35 },
        '&.drop-before-row': { borderTopColor: '#4f46e5' },
        '&.drop-after-row': { borderBottomColor: '#4f46e5' },
        '&.drop-before-row::before, &.drop-after-row::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          height: 3,
          borderRadius: 999,
          bgcolor: '#4f46e5',
        },
        '&.drop-before-row::before': { top: -4 },
        '&.drop-after-row::after': { bottom: -4 },
      }}
    >
      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
        <Checkbox
          size="small"
          checked={selected}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggleSelect(job.id)}
          sx={{ p: 0.1 }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" noWrap sx={{ color: '#172033', fontWeight: 950 }}>
              {job.vornr || 'OP'} {job.ltxa1 || ''}
            </Typography>
            <HambergerMenu size="13" color="#94a3b8" />
          </Stack>
          <Stack direction="row" spacing={0.45} sx={{ mt: 0.35, alignItems: 'center', minWidth: 0 }}>
            <Chip
              size="small"
              label={job.text1 || 'NOT START'}
              sx={{
                height: 18,
                fontSize: '0.58rem',
                fontWeight: 900,
                color: status.color,
                bgcolor: status.bgcolor,
                border: '1px solid',
                borderColor: status.borderColor,
              }}
            />
            <Typography variant="caption" noWrap sx={{ color: '#64748b', fontWeight: 750 }}>
              Finish {formatDate(job.findate)} · {Number(job.optime.toFixed(1))} ชม.
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
});

export default function RoutingMatrix({
  workCenters,
  groupedJobs,
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
}: RoutingMatrixProps) {
  const [selectedJob, setSelectedJob] = React.useState<PlanningJob | null>(null);
  const activeCellRef = React.useRef<HTMLElement | null>(null);
  const orderRows = React.useMemo(() => {
    const byOrder = new Map<string, PlanningJob[]>();
    for (const workCenter of workCenters) {
      for (const job of groupedJobs[workCenter.arbpl] ?? []) {
        const current = byOrder.get(job.aufnr) ?? [];
        current.push(job);
        byOrder.set(job.aufnr, current);
      }
    }
    return Array.from(byOrder.entries()).map(([order, jobs]) => ({ order, jobs }));
  }, [groupedJobs, workCenters]);

  const clearActiveCell = React.useCallback(() => {
    activeCellRef.current?.classList.remove('matrix-drop-active');
    activeCellRef.current = null;
  }, []);
  const handleMatrixDragEnd = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    clearActiveCell();
    onDragEnd(event);
  }, [clearActiveCell, onDragEnd]);

  const gridTemplate = `190px repeat(${Math.max(workCenters.length, 1)}, minmax(220px, 1fr))`;

  return (
    <>
      <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 2.5, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <Box sx={{ overflow: 'auto', maxHeight: '72vh' }}>
          <Box sx={{ minWidth: `${190 + workCenters.length * 230}px` }}>
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 8,
                display: 'grid',
                gridTemplateColumns: gridTemplate,
                bgcolor: '#ffffff',
                borderBottom: '1px solid rgba(15, 23, 42, 0.1)',
              }}
            >
              <Box sx={{ position: 'sticky', left: 0, zIndex: 9, p: 1.25, bgcolor: '#f8fafc', borderRight: '1px solid rgba(15, 23, 42, 0.08)' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 950 }}>ORDER / ROUTING</Typography>
              </Box>
              {workCenters.map((workCenter, index) => (
                <Box key={workCenter.arbpl} sx={{ p: 1.25, bgcolor: '#ffffff', borderRight: '1px solid rgba(15, 23, 42, 0.06)' }}>
                  <Typography variant="body2" sx={{ color: '#172033', fontWeight: 950 }}>WC {workCenter.arbpl}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 750 }}>Routing step {index + 1}</Typography>
                </Box>
              ))}
            </Box>

            {orderRows.map(({ order, jobs }, rowIndex) => {
              const firstJob = jobs[0];
              return (
                <Box
                  key={order}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    minHeight: 94,
                    contentVisibility: 'auto',
                    containIntrinsicSize: '94px',
                    bgcolor: rowIndex % 2 === 0 ? '#ffffff' : '#fbfcfe',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <Box sx={{ position: 'sticky', left: 0, zIndex: 4, p: 1.15, bgcolor: rowIndex % 2 === 0 ? '#ffffff' : '#fbfcfe', borderRight: '1px solid rgba(15, 23, 42, 0.08)' }}>
                    <Typography variant="body2" sx={{ color: '#172033', fontWeight: 950 }}>{order}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: '-webkit-box',
                        mt: 0.35,
                        color: '#64748b',
                        fontWeight: 650,
                        lineHeight: 1.3,
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {firstJob?.zptkx || '-'}
                    </Typography>
                  </Box>

                  {workCenters.map((workCenter) => {
                    const cellJobs = jobs.filter((job) => job.arbpl === workCenter.arbpl);
                    return (
                      <Stack
                        key={workCenter.arbpl}
                        spacing={0.6}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          if (activeCellRef.current !== event.currentTarget) {
                            clearActiveCell();
                            activeCellRef.current = event.currentTarget;
                            event.currentTarget.classList.add('matrix-drop-active');
                          }
                        }}
                        onDragLeave={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) clearActiveCell();
                        }}
                        onDrop={(event) => {
                          clearActiveCell();
                          onDropToLane(event, workCenter.arbpl);
                        }}
                        sx={{
                          p: 0.75,
                          minHeight: 94,
                          borderRight: '1px solid rgba(15, 23, 42, 0.06)',
                          transition: 'background-color 100ms ease, box-shadow 100ms ease',
                          '&.matrix-drop-active': {
                            bgcolor: '#eef2ff',
                            boxShadow: 'inset 0 0 0 2px #818cf8',
                          },
                        }}
                      >
                        {cellJobs.map((job) => (
                          <MatrixOperation
                            key={job.id}
                            job={job}
                            selected={selectedJobIds.has(job.id)}
                            lacquerColor={lacquerColorMap.get(getLacquerKey(job)) ?? fallbackLacquerColor}
                            onToggleSelect={onToggleSelect}
                            onOpen={setSelectedJob}
                            onDragStart={onDragStart}
                            onDrag={onDrag}
                            onDragOverJob={onDragOverJob}
                            onDragLeaveJob={onDragLeaveJob}
                            onDropOnJob={onDropOnJob}
                            onDragEnd={handleMatrixDragEnd}
                          />
                        ))}
                        {cellJobs.length === 0 && (
                          <Box sx={{ minHeight: 48, display: 'grid', placeItems: 'center', border: '1px dashed rgba(100, 116, 139, 0.16)', borderRadius: 1.25 }}>
                            <Typography variant="caption" sx={{ color: '#cbd5e1', fontWeight: 800 }}>วาง Operation</Typography>
                          </Box>
                        )}
                      </Stack>
                    );
                  })}
                </Box>
              );
            })}

            {orderRows.length === 0 && (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 750 }}>ไม่พบ Order ตามตัวกรองปัจจุบัน</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <JobDetailDialog
        fallbackLacquerColor={fallbackLacquerColor}
        job={selectedJob}
        lacquerColorMap={lacquerColorMap}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
}
