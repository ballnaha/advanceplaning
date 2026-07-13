'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ZPG1D_GROUPS, getJobGroupId } from '@/lib/zpg1d-helpers';
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
  isDirty: boolean;
  isSaving: boolean;
  lacquerColorMap: Map<string, { bg: string; chipBg: string; text: string; border: string }>;
  collapsedGroups: Record<string, boolean>;
  selectedJobIds: Set<number>;
  sequenceChanges: Map<number, SequenceChange>;
  onToggleSelect: (jobId: number) => void;
  onToggleSelectAllGroup: (jobIds: number[], selectAll: boolean) => void;
  onAutoArrange: (workCenter: string, jobIds: number[]) => void;
  onResetToInitial: (workCenter: string) => void;
  onSave: (workCenter: string) => void;
  onToggleCollapse: (key: string) => void;
  onDragStart: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDrag: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLTableRowElement>, jobId: number) => void;
  onDragLeave: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: (event: React.DragEvent<HTMLTableRowElement>, targetJobId: number, workCenter: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onMoveJobOneStep: (workCenter: string, jobId: number, direction: 'up' | 'down') => void;
}

const WorkCenterCard = React.memo(({
  workCenter,
  group,
  isDirty,
  isSaving,
  lacquerColorMap,
  collapsedGroups,
  selectedJobIds,
  sequenceChanges,
  onToggleSelect,
  onToggleSelectAllGroup,
  onAutoArrange,
  onResetToInitial,
  onSave,
  onToggleCollapse,
  onDragStart,
  onDrag,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onMoveJobOneStep,
}: WorkCenterCardProps) => {
  const [changesOpen, setChangesOpen] = React.useState(false);
  const groupStats = React.useMemo(() => {
    const byGroupId = new Map<string, ProductGroupStats>();
    let hours = 0;

    for (const job of group) {
      const groupId = getJobGroupId(job.zpg1d);
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
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 850 }}>
            Work center {workCenter}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {formatNumber(group.length)} งาน / {formatNumber(Number(groupStats.hours.toFixed(1)))} ชม. / เปลี่ยน L/Q {formatNumber(groupStats.changeovers)} ครั้ง
          </Typography>
          {changedJobCount > 0 && (
            <Chip
              size="small"
              label={`เปลี่ยนลำดับ ${formatNumber(changedJobCount)} งาน`}
              sx={{
                mt: 0.75,
                width: 'fit-content',
                bgcolor: 'rgba(245, 158, 11, 0.14)',
                color: '#92400e',
                border: '1px solid rgba(245, 158, 11, 0.32)',
                fontWeight: 850,
              }}
            />
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => onAutoArrange(workCenter, group.map((job) => job.id))}>
            จัดลำดับงานด่วน
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onResetToInitial(workCenter)}
          >
            DEFAULT SETTING
          </Button>
          <Button
            size="small"
            variant={isDirty ? 'contained' : 'outlined'}
            disabled={isSaving}
            onClick={() => onSave(workCenter)}
            sx={{ boxShadow: 'none' }}
          >
            {isSaving ? 'SAVING...' : 'SAVE'}
          </Button>
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {ZPG1D_GROUPS.map((groupDef) => {
        const productGroupStats = groupStats.byGroupId.get(groupDef.id);
        const groupJobs = productGroupStats?.jobs ?? [];
        const collapseKey = `${workCenter}|${groupDef.id}`;
        const isCollapsed = collapsedGroups[collapseKey] ?? false;

        return (
          <Box key={groupDef.id} sx={{ mb: 2 }}>
            {/* Group Header */}
            <Box
              onClick={() => onToggleCollapse(collapseKey)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.25,
                cursor: 'pointer',
                borderRadius: 1.5,
                bgcolor: isCollapsed ? 'rgba(15, 23, 42, 0.015)' : 'rgba(15, 23, 42, 0.035)',
                borderLeft: `5px solid ${groupDef.colorAccent}`,
                transition: 'all 180ms ease',
                '&:hover': {
                  bgcolor: isCollapsed ? 'rgba(15, 23, 42, 0.03)' : 'rgba(15, 23, 42, 0.06)',
                },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    color: groupDef.colorAccent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ fontSize: '0.9rem', display: 'inline-block', width: '12px' }}>
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
                    fontWeight: 800,
                    bgcolor: groupJobs.length > 0 ? groupDef.colorAccent : 'rgba(15, 23, 42, 0.08)',
                    color: groupJobs.length > 0 ? '#ffffff' : 'text.secondary',
                  }}
                />
              </Stack>
              {groupJobs.length > 0 && (
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    ชั่วโมง: <Box component="span" sx={{ color: 'text.primary', fontWeight: 850 }}>{formatNumber(Number((productGroupStats?.hours ?? 0).toFixed(1)))} ชม.</Box>
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    จำนวนผลิต: <Box component="span" sx={{ color: 'text.primary', fontWeight: 850 }}>{formatNumber(productGroupStats?.quantity ?? 0)}</Box>
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                    เปลี่ยน L/Q: <Box component="span" sx={{ color: 'text.primary', fontWeight: 850 }}>{formatNumber(productGroupStats?.changeovers ?? 0)} ครั้ง</Box>
                  </Typography>
                </Stack>
              )}
            </Box>

            <PlanningGroupTable
              groupJobs={groupJobs}
              group={group}
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
    prevProps.isDirty === nextProps.isDirty &&
    prevProps.isSaving === nextProps.isSaving &&
    ZPG1D_GROUPS.every((groupDef) => {
      const key = `${prevProps.workCenter}|${groupDef.id}`;
      return prevProps.collapsedGroups[key] === nextProps.collapsedGroups[key];
    }) &&
    prevProps.group.length === nextProps.group.length &&
    prevProps.group.every((job, i) => {
      const next = nextProps.group[i];
      return job === next || (job.id === next.id && job.zpg1d === next.zpg1d);
    }) &&
    prevProps.group.every((job) => prevProps.selectedJobIds.has(job.id) === nextProps.selectedJobIds.has(job.id)) &&
    prevProps.group.every((job) => prevProps.sequenceChanges.get(job.id) === nextProps.sequenceChanges.get(job.id))
  );
});

WorkCenterCard.displayName = 'WorkCenterCard';

export default WorkCenterCard;
