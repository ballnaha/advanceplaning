'use client';

import * as React from 'react';
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ZPG1D_GROUPS, getQueueGroupId } from '@/lib/zpg1d-helpers';
import type { PlanningJob } from '@/lib/planning';
import PlanningGroupTable from './PlanningGroupTable';
import type { SequenceChange } from './PlanningGroupTable';
import SequenceChangesDialog from './SequenceChangesDialog';

const numberFormatter = new Intl.NumberFormat('th-TH');

type ProductGroupStats = {
  changeovers: number;
  hours: number;
  jobs: PlanningJob[];
  quantity: number;
};

function calculateChangeovers(jobs: PlanningJob[]) {
  let count = 0;
  for (let index = 0; index < jobs.length - 1; index += 1) {
    if (getLacquerKey(jobs[index]) !== getLacquerKey(jobs[index + 1])) {
      count += 1;
    }
  }
  return count;
}

function getLacquerKey(job: PlanningJob) {
  return job.zlg3d?.trim() || 'ไม่ระบุ Lacquer';
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

interface WorkCenterCardProps {
  workCenter: string;
  group: PlanningJob[];
  lacquerColorMap: Map<string, { bg: string; chipBg: string; text: string; border: string }>;
  collapsedGroups: Record<string, boolean>;
  selectedJobIds: Set<number>;
  sequenceChanges: Map<number, SequenceChange>;
  onToggleSelect: (jobId: number) => void;
  onToggleSelectAllGroup: (jobIds: number[], selectAll: boolean) => void;
  onToggleCollapse: (key: string) => void;
  onDragStart: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDrag: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDragLeave: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (event: React.DragEvent<HTMLTableRowElement>, targetJobId: number, workCenter: string) => void;
  onDropToGroup: (event: React.DragEvent<HTMLElement>, workCenter: string, groupLabel: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onMoveJobOneStep: (workCenter: string, jobId: number, direction: 'up' | 'down') => void;
}

const WorkCenterCard = React.memo(({
  workCenter,
  group,
  lacquerColorMap,
  collapsedGroups,
  selectedJobIds,
  sequenceChanges,
  onToggleSelect,
  onToggleSelectAllGroup,
  onToggleCollapse,
  onDragStart,
  onDrag,
  onDragOver,
  onDragLeave,
  onDrop,
  onDropToGroup,
  onDragEnd,
  onMoveJobOneStep,
}: WorkCenterCardProps) => {
  const [changesOpen, setChangesOpen] = React.useState(false);
  const groupStats = React.useMemo(() => {
    const byGroupId = new Map<string, ProductGroupStats>();
    let hours = 0;

    for (const job of group) {
      const groupId = getQueueGroupId(job);
      const currentStats = byGroupId.get(groupId);
      if (currentStats) {
        currentStats.jobs.push(job);
        currentStats.hours += job.optime;
        currentStats.quantity += job.mgvrg;
      } else {
        byGroupId.set(groupId, {
          changeovers: 0,
          hours: job.optime,
          jobs: [job],
          quantity: job.mgvrg,
        });
      }
      hours += job.optime;
    }

    for (const stats of byGroupId.values()) {
      stats.changeovers = calculateChangeovers(stats.jobs);
    }

    return {
      hours,
      changeovers: calculateChangeovers(group),
      byGroupId,
    };
  }, [group]);

  const changedJobCount = React.useMemo(
    () => group.reduce((count, job) => count + (sequenceChanges.has(job.id) ? 1 : 0), 0),
    [group, sequenceChanges],
  );
  const changedJobs = React.useMemo(
    () =>
      group
        .map((job) => {
          const change = sequenceChanges.get(job.id);
          return change ? { job, change } : null;
        })
        .filter((item): item is { job: PlanningJob; change: SequenceChange } => Boolean(item))
        .sort((a, b) => a.change.currentSeq - b.change.currentSeq),
    [group, sequenceChanges],
  );

  const handleMoveUp = React.useCallback((jobId: number) => {
    onMoveJobOneStep(workCenter, jobId, 'up');
  }, [onMoveJobOneStep, workCenter]);

  const handleMoveDown = React.useCallback((jobId: number) => {
    onMoveJobOneStep(workCenter, jobId, 'down');
  }, [onMoveJobOneStep, workCenter]);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.01)' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2.5 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 950, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Work center {workCenter}
          </Typography>
          {changedJobCount > 0 && (
            <Chip
              size="small"
              label={`เปลี่ยนลำดับ ${formatNumber(changedJobCount)} งาน`}
              sx={{
                mt: 0.75,
                width: 'fit-content',
                bgcolor: 'rgba(245, 158, 11, 0.12)',
                color: '#b45309',
                border: '1px solid rgba(245, 158, 11, 0.28)',
                fontWeight: 900,
                fontSize: '0.72rem',
                borderRadius: 1.5,
              }}
            />
          )}
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ px: 1.5, py: 0.75, borderRadius: 2, border: '1px solid #f1f5f9', bgcolor: '#f8fafc', minWidth: 80, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 800, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Orders</Typography>
            <Typography variant="body2" sx={{ fontWeight: 950, color: '#0f172a', mt: 0.25 }}>{formatNumber(group.length)} งาน</Typography>
          </Box>
          
          <Box sx={{ px: 1.5, py: 0.75, borderRadius: 2, border: '1px solid #f1f5f9', bgcolor: '#f8fafc', minWidth: 80, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 800, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>สลับ L/Q</Typography>
            <Typography variant="body2" sx={{ fontWeight: 950, color: '#0891b2', mt: 0.25 }}>{formatNumber(groupStats.changeovers)} ครั้ง</Typography>
          </Box>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />

      {ZPG1D_GROUPS.map((groupDef) => {
        const productGroupStats = groupStats.byGroupId.get(groupDef.id);
        const groupJobs = productGroupStats?.jobs ?? [];
        const collapseKey = `${workCenter}|${groupDef.id}`;
        const isCollapsed = collapsedGroups[collapseKey] ?? false;

        return (
          <Box key={groupDef.id} sx={{ mb: 2.5 }}>
            {/* Group Header */}
            <Box
              onClick={() => onToggleCollapse(collapseKey)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.25,
                cursor: 'pointer',
                borderRadius: 2.5,
                bgcolor: isCollapsed ? 'rgba(15, 23, 42, 0.015)' : 'rgba(15, 23, 42, 0.035)',
                border: '1px solid',
                borderColor: isCollapsed ? 'rgba(15, 23, 42, 0.05)' : `${groupDef.colorAccent}25`,
                borderLeft: `5px solid ${groupDef.colorAccent}`,
                transition: 'all 180ms ease',
                '&:hover': {
                  bgcolor: isCollapsed ? 'rgba(15, 23, 42, 0.03)' : 'rgba(15, 23, 42, 0.06)',
                  borderColor: `${groupDef.colorAccent}45`,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 900,
                    color: groupDef.colorAccent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', display: 'inline-block', width: '12px' }}>
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                  {groupDef.label}
                </Typography>
                <Chip
                  size="small"
                  label={`${groupJobs.length} งาน`}
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    bgcolor: groupJobs.length > 0 ? groupDef.colorAccent : 'rgba(15, 23, 42, 0.08)',
                    color: groupJobs.length > 0 ? '#ffffff' : 'text.secondary',
                    borderRadius: 1,
                  }}
                />
              </Stack>
              {groupJobs.length > 0 && (
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.72rem' }}>
                    ชั่วโมง: <Box component="span" sx={{ color: '#0f172a', fontWeight: 950 }}>{formatNumber(Number((productGroupStats?.hours ?? 0).toFixed(1)))} ชม.</Box>
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.72rem' }}>
                    จำนวนผลิต: <Box component="span" sx={{ color: '#0f172a', fontWeight: 950 }}>{formatNumber(productGroupStats?.quantity ?? 0)}</Box>
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 800, fontSize: '0.72rem' }}>
                    เปลี่ยน L/Q: <Box component="span" sx={{ color: '#0f172a', fontWeight: 950 }}>{formatNumber(productGroupStats?.changeovers ?? 0)} ครั้ง</Box>
                  </Typography>
                </Stack>
              )}
            </Box>

            <PlanningGroupTable
              groupJobs={groupJobs}
              group={group}
              groupLabel={groupDef.label}
              workCenter={workCenter}
              isCollapsed={isCollapsed}
              lacquerColorMap={lacquerColorMap}
              selectedJobIds={selectedJobIds}
              onToggleSelect={onToggleSelect}
              onToggleSelectAllGroup={onToggleSelectAllGroup}
              onDragStart={onDragStart}
              onDrag={onDrag}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDropToGroup={onDropToGroup}
              onDragEnd={onDragEnd}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </Box>
        );
      })}

      <SequenceChangesDialog
        open={changesOpen}
        onClose={() => setChangesOpen(false)}
        changes={changedJobs}
        title={`การเปลี่ยนแปลง Work center ${workCenter}`}
        description="เฉพาะงานที่ลำดับหรือกลุ่มเปลี่ยนจากข้อมูลเดิม"
      />
    </Paper>
  );
}, (prevProps, nextProps) => {
  return (
    ZPG1D_GROUPS.every((groupDef) => {
      const key = `${prevProps.workCenter}|${groupDef.id}`;
      return prevProps.collapsedGroups[key] === nextProps.collapsedGroups[key];
    }) &&
    prevProps.group.length === nextProps.group.length &&
    prevProps.group.every((job, i) => {
      const next = nextProps.group[i];
      return job === next || (
        job.id === next.id &&
        job.seqno === next.seqno &&
        job.arbpl === next.arbpl &&
        job.zpg1d === next.zpg1d &&
        job.queueGroup === next.queueGroup
      );
    }) &&
    prevProps.group.every((job) => prevProps.selectedJobIds.has(job.id) === nextProps.selectedJobIds.has(job.id)) &&
    prevProps.group.every((job) => prevProps.sequenceChanges.get(job.id) === nextProps.sequenceChanges.get(job.id))
  );
});

WorkCenterCard.displayName = 'WorkCenterCard';

export default WorkCenterCard;
