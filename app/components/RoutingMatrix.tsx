'use client';

import * as React from 'react';
import { Box, Checkbox, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { HambergerMenu } from 'iconsax-react';
import type { PlanningJob, WorkCenterSummary } from '@/lib/planning';
import { cleanZpg2d, getQueueGroupId, ZPG1D_GROUPS } from '@/lib/zpg1d-helpers';
import { FinishDateWarningIcon, isFinishDateWithinWarningWindow } from './FinishDateWarning';
import JobDetailDialog from './JobDetailDialog';

type LacquerColor = { bg: string; chipBg: string; text: string; border: string };

type RoutingMatrixProps = {
  workCenters: WorkCenterSummary[];
  groupedJobs: Record<string, PlanningJob[]>;
  externalRoutingJobs: PlanningJob[];
  selectedJobIds: Set<number>;
  lacquerColorMap: Map<string, LacquerColor>;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
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

const dateFormatter = new Intl.DateTimeFormat('th-TH', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : '-';
}

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

function isWhiteLacquer(job: PlanningJob) {
  const group = `${job.zpg3d ?? ''} ${job.zlg3d ?? ''}`.toLocaleLowerCase('th-TH');
  return group.includes('ขาว') || group.includes('white') || group.includes('plain');
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
  sequence: number;
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
  sequence,
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
  const hasWhiteLacquer = isWhiteLacquer(job);
  const cardShadow = selected
    ? '0 0 0 2px rgba(99, 102, 241, 0.1)'
    : '0 2px 6px rgba(15, 23, 42, 0.04)';
  const visibleCardShadow = hasWhiteLacquer
    ? `inset 1px 0 0 #94a3b8, ${cardShadow}`
    : cardShadow;
  const hoverShadow = hasWhiteLacquer
    ? 'inset 1px 0 0 #94a3b8, 0 3px 8px rgba(15, 23, 42, 0.06)'
    : '0 3px 8px rgba(15, 23, 42, 0.06)';

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
        contentVisibility: 'auto',
        containIntrinsicSize: '112px',
        p: 0.85,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: selected ? '#818cf8' : hasWhiteLacquer ? '#cbd5e1' : 'rgba(15, 23, 42, 0.08)',
        borderLeft: `4px solid ${hasWhiteLacquer ? '#ffffff' : lacquerColor.text}`,
        bgcolor: selected ? '#f5f7ff' : '#ffffff',
        cursor: 'grab',
        boxShadow: visibleCardShadow,
        transition: 'opacity 160ms ease, transform 160ms cubic-bezier(0.2, 0, 0, 1), border-color 140ms ease, box-shadow 140ms ease',
        '&:active': { cursor: 'grabbing' },
        '&:hover': { borderColor: '#6366f1', borderLeftColor: hasWhiteLacquer ? '#ffffff' : lacquerColor.text, boxShadow: hoverShadow },
        '&.dragging-row': { opacity: 0.42, transform: 'scale(0.985)', willChange: 'opacity, transform' },
        '&.drop-target-row': { willChange: 'border-color, box-shadow' },
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
      <Stack spacing={0.7}>
        <Stack direction="row" spacing={0.65} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Checkbox
              size="small"
              disableRipple
              checked={selected}
              onClick={(event) => event.stopPropagation()}
              onChange={() => onToggleSelect(job.id)}
              sx={{ p: 0.1 }}
            />
            <Box
              title={`Operation ${job.vornr || '-'}`}
              sx={{
                px: 0.9,
                py: 0.35,
                borderRadius: 1,
                color: '#ffffff',
                bgcolor: '#4f46e5',
                border: '1px solid #4338ca',
                boxShadow: '0 3px 8px rgba(79, 70, 229, 0.22)',
                fontSize: '0.82rem',
                lineHeight: 1.15,
                fontWeight: 950,
                whiteSpace: 'nowrap',
              }}
            >
              OP {job.vornr || '-'}
            </Box>
            <Typography variant="body2" noWrap sx={{ color: '#334155', fontSize: '0.8rem', fontWeight: 850, maxWidth: 105 }}>
              {job.ltxa1 || '-'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.55} sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Box
              title={`ลำดับคิวที่ ${sequence}`}
              sx={{
                px: 0.65,
                py: 0.25,
                borderRadius: 0.85,
                color: '#475569',
                bgcolor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                fontSize: '0.7rem',
                lineHeight: 1.15,
                fontWeight: 950,
                whiteSpace: 'nowrap',
              }}
            >
              ลำดับ #{String(sequence).padStart(2, '0')}
            </Box>
            <HambergerMenu size="15" color="#94a3b8" style={{ cursor: 'grab' }} />
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            title={`ZPG2D: ${cleanZpg2d(job.zpg2d) || '-'}`}
            sx={{ px: 0.65, py: 0.15, borderRadius: 0.85, bgcolor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', fontSize: '0.74rem', fontWeight: 900, whiteSpace: 'nowrap' }}
          >
            {cleanZpg2d(job.zpg2d) || '-'}
          </Box>
          <Box
            title={`ZPG3D: ${job.zpg3d || '-'}`}
            sx={{ minWidth: 0, px: 0.65, py: 0.15, borderRadius: 0.85, bgcolor: lacquerColor.chipBg, color: lacquerColor.text, border: `1px solid ${lacquerColor.border}`, fontSize: '0.74rem', fontWeight: 900, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}
          >
            {job.zpg3d || '-'}
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip
            size="small"
            label={job.text1 || 'NOT START'}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 900,
              color: status.color,
              bgcolor: status.bgcolor,
              border: '1px solid',
              borderColor: status.borderColor,
              borderRadius: 1,
            }}
          />
          <Box
            title={job.zltkx || '-'}
            sx={{
              minWidth: 0,
              px: 0.65,
              py: 0.15,
              borderRadius: 0.85,
              bgcolor: lacquerColor.chipBg,
              border: `1px solid ${lacquerColor.border}`,
              color: lacquerColor.text,
              fontSize: '0.74rem',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            L/Q {job.zltkx || '-'}
          </Box>
        </Stack>

        <Typography variant="caption" noWrap sx={{ color: '#475569', fontSize: '0.74rem', fontWeight: 750 }}>
          FW {job.usr00 || '-'} · TEMP {job.usr02 || '-'}
        </Typography>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
          <Typography variant="caption" noWrap sx={{ minWidth: 0, color: '#475569', fontSize: '0.76rem', fontWeight: 800 }}>
            Start {formatDate(job.stdate)} → Finish {formatDate(job.findate)}
          </Typography>
          {isFinishDateWithinWarningWindow(job.findate) && (
            <Tooltip title="Finish Date อยู่ภายใน 3 วัน (นับรวมวันนี้)" arrow>
              <span style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help' }}>
                <FinishDateWarningIcon />
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
});

function RoutingMatrix({
  workCenters,
  groupedJobs,
  externalRoutingJobs,
  selectedJobIds,
  lacquerColorMap,
  collapsedGroups,
  onToggleGroup,
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
  const draggingOrderRef = React.useRef<string | null>(null);
  const selectedJobIdsRef = React.useRef(selectedJobIds);

  React.useEffect(() => {
    selectedJobIdsRef.current = selectedJobIds;
  }, [selectedJobIds]);

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
  const jobById = React.useMemo(
    () => new Map(orderRows.flatMap((row) => row.jobs).map((job) => [job.id, job])),
    [orderRows],
  );
  const sequenceByJobId = React.useMemo(() => {
    const map = new Map<number, number>();
    for (const workCenter of workCenters) {
      (groupedJobs[workCenter.arbpl] ?? []).forEach((job, index) => {
        map.set(job.id, index + 1);
      });
    }
    return map;
  }, [groupedJobs, workCenters]);
  const steelGroups = React.useMemo(() => {
    return ZPG1D_GROUPS
      .map((definition) => ({
        definition,
        rows: orderRows.filter((row) => getQueueGroupId(row.jobs[0] ?? { zpg1d: null }) === definition.id),
      }))
      .filter((group) => group.rows.length > 0);
  }, [orderRows]);
  const externalRoutingByOrder = React.useMemo(() => {
    const byOrder = new Map<string, PlanningJob[]>();
    for (const job of externalRoutingJobs) {
      const orderJobs = byOrder.get(job.aufnr) ?? [];
      orderJobs.push(job);
      byOrder.set(job.aufnr, orderJobs);
    }
    for (const orderJobs of byOrder.values()) {
      orderJobs.sort((a, b) => {
        const operationCompare = (a.vornr ?? '').localeCompare(b.vornr ?? '', 'th', { numeric: true });
        return operationCompare !== 0 ? operationCompare : a.sourceRow - b.sourceRow;
      });
    }
    return byOrder;
  }, [externalRoutingJobs]);

  const clearActiveCell = React.useCallback(() => {
    activeCellRef.current?.classList.remove('matrix-drop-active');
    activeCellRef.current = null;
  }, []);
  const handleMatrixDragStart = React.useCallback((event: React.DragEvent<HTMLElement>, jobId: number) => {
    const selectedIds = selectedJobIdsRef.current;
    const draggedIds = selectedIds.has(jobId) ? Array.from(selectedIds) : [jobId];
    const draggedJobs = draggedIds.map((id) => jobById.get(id));
    const firstOrder = draggedJobs[0]?.aufnr ?? null;
    draggingOrderRef.current =
      firstOrder && draggedJobs.every((job) => job?.aufnr === firstOrder) ? firstOrder : null;
    onDragStart(event, jobId);
  }, [jobById, onDragStart]);
  const handleMatrixDragOverJob = React.useCallback((event: React.DragEvent<HTMLElement>, jobId: number) => {
    if (jobById.get(jobId)?.aufnr !== draggingOrderRef.current) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'none';
      clearActiveCell();
      return;
    }
    onDragOverJob(event, jobId);
  }, [clearActiveCell, jobById, onDragOverJob]);
  const handleMatrixDropOnJob = React.useCallback((
    event: React.DragEvent<HTMLElement>,
    targetJobId: number,
    workCenter: string,
  ) => {
    if (jobById.get(targetJobId)?.aufnr !== draggingOrderRef.current) {
      event.preventDefault();
      clearActiveCell();
      return;
    }
    onDropOnJob(event, targetJobId, workCenter);
  }, [clearActiveCell, jobById, onDropOnJob]);
  const handleMatrixDragEnd = React.useCallback((event: React.DragEvent<HTMLElement>) => {
    clearActiveCell();
    draggingOrderRef.current = null;
    onDragEnd(event);
  }, [clearActiveCell, onDragEnd]);

  const orderColumnWidth = 290;
  const gridTemplate = `${orderColumnWidth}px repeat(${Math.max(workCenters.length, 1)}, minmax(280px, 1fr))`;

  return (
    <>
      <Paper elevation={0} sx={{ overflow: 'hidden', borderRadius: 2.5, border: '1px solid rgba(15, 23, 42, 0.08)' }}>
        <Box sx={{ overflow: 'auto', maxHeight: '82vh' }}>
          <Box sx={{ minWidth: `${orderColumnWidth + workCenters.length * 290}px` }}>
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
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 950 }}>ORDER / Description 1</Typography>
              </Box>
              {workCenters.map((workCenter, index) => (
                <Box key={workCenter.arbpl} sx={{ p: 1.25, bgcolor: '#ffffff', borderRight: '1px solid rgba(15, 23, 42, 0.06)' }}>
                  <Typography variant="body2" sx={{ color: '#172033', fontSize: '0.9rem', fontWeight: 950 }}>WC {workCenter.arbpl}</Typography>
                  
                </Box>
              ))}
            </Box>

            {steelGroups.map((steelGroup) => {
              const collapseKey = `matrix|${steelGroup.definition.id}`;
              const isCollapsed = collapsedGroups[collapseKey] ?? false;

              return (
              <React.Fragment key={steelGroup.definition.id}>
                <Box
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isCollapsed}
                  onClick={() => onToggleGroup(collapseKey)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onToggleGroup(collapseKey);
                    }
                  }}
                  sx={{
                    position: 'relative',
                    px: 1.25,
                    py: 1,
                    bgcolor: `${steelGroup.definition.colorAccent}0d`,
                    borderTop: `1px solid ${steelGroup.definition.colorAccent}40`,
                    borderBottom: `1px solid ${steelGroup.definition.colorAccent}40`,
                    cursor: 'pointer',
                    transition: 'background-color 150ms ease',
                    '&:hover': { bgcolor: `${steelGroup.definition.colorAccent}16` },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ position: 'sticky', left: 10, width: 'fit-content', alignItems: 'center' }}
                  >
                    <Typography component="span" aria-hidden sx={{ color: steelGroup.definition.colorAccent, fontSize: '0.82rem', fontWeight: 950 }}>
                      {isCollapsed ? '▶' : '▼'}
                    </Typography>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: steelGroup.definition.colorAccent }} />
                    <Typography variant="caption" sx={{ color: steelGroup.definition.colorAccent, fontSize: '0.88rem', fontWeight: 950 }}>
                      ประเภทเหล็ก: {steelGroup.definition.label}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${steelGroup.rows.length} Order`}
                      sx={{
                        height: 22,
                        color: steelGroup.definition.colorAccent,
                        bgcolor: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 900,
                      }}
                    />
                  </Stack>
                </Box>

                {!isCollapsed && steelGroup.rows.map(({ order, jobs }, rowIndex) => {
                  const firstJob = jobs[0];
                  const externalOperations = externalRoutingByOrder.get(order) ?? [];
                  const visibleExternalOperations = externalOperations.slice(0, 3);
                  const hiddenExternalOperationCount = Math.max(externalOperations.length - visibleExternalOperations.length, 0);
                  return (
                <Box
                  key={order}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: gridTemplate,
                    minHeight: 158,
                    contentVisibility: 'auto',
                    containIntrinsicSize: '158px',
                    bgcolor: rowIndex % 2 === 0 ? '#ffffff' : '#fbfcfe',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                  }}
                >
                  <Box sx={{ position: 'sticky', left: 0, zIndex: 4, p: 1.15, bgcolor: rowIndex % 2 === 0 ? '#ffffff' : '#fbfcfe', borderRight: '1px solid rgba(15, 23, 42, 0.08)' }}>
                    <Typography variant="body2" sx={{ color: '#172033', fontSize: '0.9rem', fontWeight: 950 }}>{order}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: '-webkit-box',
                        mt: 0.35,
                        color: '#64748b',
                        fontSize: '0.76rem',
                        fontWeight: 650,
                        lineHeight: 1.3,
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {firstJob?.zptkx || '-'}
                    </Typography>
                    {externalOperations.length > 0 && (
                      <Box
                        sx={{
                          mt: 0.9,
                          p: 0.75,
                          borderRadius: 1.25,
                          bgcolor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderLeft: '3px solid #f59e0b',
                        }}
                      >
                        <Stack direction="row" sx={{ mb: 0.6, alignItems: 'center', justifyContent: 'space-between', gap: 0.75 }}>
                          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.7rem', fontWeight: 950 }}>
                            ขั้นตอนนอกขอบเขต ({externalOperations.length})
                          </Typography>
                          <Box
                            component="span"
                            sx={{ px: 0.55, py: 0.15, borderRadius: 0.75, color: '#92400e', bgcolor: '#fef3c7', fontSize: '0.6rem', fontWeight: 950, whiteSpace: 'nowrap' }}
                          >
                            READ ONLY
                          </Box>
                        </Stack>
                        <Stack spacing={0.45}>
                          {visibleExternalOperations.map((operation) => (
                            <Tooltip
                              key={operation.id}
                              title={`OP ${operation.vornr || '-'} · ${operation.ltxa1 || 'ไม่ระบุชื่อขั้นตอน'} · Work Center ${operation.arbpl}`}
                              arrow
                            >
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                                  columnGap: 0.55,
                                  rowGap: 0.1,
                                  alignItems: 'center',
                                  px: 0.6,
                                  py: 0.45,
                                  borderRadius: 0.9,
                                  bgcolor: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{ gridRow: '1 / 3', px: 0.55, py: 0.25, borderRadius: 0.7, color: '#ffffff', bgcolor: '#64748b', fontSize: '0.68rem', fontWeight: 950, whiteSpace: 'nowrap' }}
                                >
                                  OP {operation.vornr || '-'}
                                </Box>
                                <Typography noWrap variant="caption" sx={{ minWidth: 0, color: '#1e293b', fontSize: '0.7rem', lineHeight: 1.15, fontWeight: 900 }}>
                                  {operation.ltxa1 || 'ไม่ระบุชื่อขั้นตอน'}
                                </Typography>
                                <Typography noWrap variant="caption" sx={{ minWidth: 0, color: '#0369a1', fontSize: '0.65rem', lineHeight: 1.15, fontWeight: 850 }}>
                                  Work Center · {operation.arbpl}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ))}
                          {hiddenExternalOperationCount > 0 && (
                            <Tooltip
                              title={externalOperations
                                .slice(visibleExternalOperations.length)
                                .map((operation) => `OP ${operation.vornr || '-'} · ${operation.ltxa1 || 'ไม่ระบุชื่อขั้นตอน'} · WC ${operation.arbpl}`)
                                .join('\n')}
                              arrow
                            >
                              <Box
                                component="span"
                                sx={{
                                  alignSelf: 'flex-start',
                                  px: 0.6,
                                  py: 0.25,
                                  color: '#475569',
                                  bgcolor: '#ffffff',
                                  border: '1px dashed #94a3b8',
                                  borderRadius: 0.85,
                                  fontSize: '0.65rem',
                                  lineHeight: 1.15,
                                  fontWeight: 950,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ดูอีก {hiddenExternalOperationCount} ขั้นตอน
                              </Box>
                            </Tooltip>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  {workCenters.map((workCenter) => {
                    const cellJobs = jobs.filter((job) => job.arbpl === workCenter.arbpl);
                    return (
                      <Stack
                        key={workCenter.arbpl}
                        spacing={0.8}
                        onDragOver={(event) => {
                          event.preventDefault();
                          if (draggingOrderRef.current !== order) {
                            event.dataTransfer.dropEffect = 'none';
                            clearActiveCell();
                            return;
                          }
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
                          if (draggingOrderRef.current !== order) {
                            event.preventDefault();
                            return;
                          }
                          onDropToLane(event, workCenter.arbpl);
                        }}
                        sx={{
                          p: 1,
                          minHeight: 158,
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
                            sequence={sequenceByJobId.get(job.id) ?? 0}
                            selected={selectedJobIds.has(job.id)}
                            lacquerColor={lacquerColorMap.get(getLacquerKey(job)) ?? fallbackLacquerColor}
                            onToggleSelect={onToggleSelect}
                            onOpen={setSelectedJob}
                            onDragStart={handleMatrixDragStart}
                            onDrag={onDrag}
                            onDragOverJob={handleMatrixDragOverJob}
                            onDragLeaveJob={onDragLeaveJob}
                            onDropOnJob={handleMatrixDropOnJob}
                            onDragEnd={handleMatrixDragEnd}
                          />
                        ))}
                        {cellJobs.length === 0 && (
                          <Box sx={{ minHeight: 48, display: 'grid', placeItems: 'center', border: '1px dashed rgba(100, 116, 139, 0.16)', borderRadius: 1.25 }}>
                            <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '0.74rem', fontWeight: 800 }}>วาง Operation</Typography>
                          </Box>
                        )}
                      </Stack>
                    );
                  })}
                </Box>
                  );
                })}
              </React.Fragment>
              );
            })}

            {orderRows.length === 0 && (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', fontWeight: 750 }}>ไม่พบ Order ตามตัวกรองปัจจุบัน</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <JobDetailDialog
        fallbackLacquerColor={fallbackLacquerColor}
        job={selectedJob ? jobById.get(selectedJob.id) ?? selectedJob : null}
        lacquerColorMap={lacquerColorMap}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
}

export default React.memo(RoutingMatrix);
