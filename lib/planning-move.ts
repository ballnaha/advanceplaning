import type { PlanningJob } from './planning';
import {
  findOperationPrecedenceViolation,
  formatOperationPrecedenceError,
  type OperationPrecedenceViolation,
} from './operation-precedence';

export type PlanningMovePosition = 'before' | 'after';

type MovePlanningJobsOptions = {
  jobs: PlanningJob[];
  draggedJobIds: number[];
  targetWorkCenter: string;
  targetJobId?: number;
  position?: PlanningMovePosition;
  patchJob?: (job: PlanningJob, targetJob: PlanningJob | null) => PlanningJob;
  resequence?: boolean;
  validatePrecedence?: boolean;
};

type MovePlanningJobsResult = {
  affectedWorkCenters: Set<string>;
  jobs: PlanningJob[];
  moved: boolean;
  validationError?: string;
  violation?: OperationPrecedenceViolation;
};

/**
 * Shared queue-movement engine used by every planning view.
 * UI components own drag state and notifications; queue placement, Work Center
 * changes, and sequence numbering are handled here so all views behave alike.
 */
export function movePlanningJobs({
  jobs,
  draggedJobIds,
  targetWorkCenter,
  targetJobId,
  position = 'after',
  patchJob,
  resequence = true,
  validatePrecedence = true,
}: MovePlanningJobsOptions): MovePlanningJobsResult {
  const draggedIdSet = new Set(draggedJobIds);
  if (draggedIdSet.size === 0 || (targetJobId !== undefined && draggedIdSet.has(targetJobId))) {
    return { affectedWorkCenters: new Set(), jobs, moved: false };
  }

  const draggedJobs = jobs.filter((job) => draggedIdSet.has(job.id));
  if (draggedJobs.length === 0) {
    return { affectedWorkCenters: new Set(), jobs, moved: false };
  }

  const targetJob = targetJobId === undefined
    ? null
    : jobs.find((job) => job.id === targetJobId && job.arbpl === targetWorkCenter) ?? null;
  if (targetJobId !== undefined && !targetJob) {
    return { affectedWorkCenters: new Set(), jobs, moved: false };
  }

  const affectedWorkCenters = new Set([
    targetWorkCenter,
    ...draggedJobs.map((job) => job.arbpl),
  ]);
  const remaining = jobs.filter((job) => !draggedIdSet.has(job.id));
  const targetQueue = remaining.filter((job) => job.arbpl === targetWorkCenter);
  const movedJobs = draggedJobs.map((job) => {
    const movedJob = { ...job, arbpl: targetWorkCenter };
    return patchJob?.(movedJob, targetJob) ?? movedJob;
  });

  let insertIndex = targetQueue.length;
  if (targetJob) {
    const targetIndex = targetQueue.findIndex((job) => job.id === targetJob.id);
    if (targetIndex < 0) {
      return { affectedWorkCenters: new Set(), jobs, moved: false };
    }
    insertIndex = targetIndex + (position === 'after' ? 1 : 0);
  }
  targetQueue.splice(insertIndex, 0, ...movedJobs);

  const firstTargetIndex = remaining.findIndex((job) => job.arbpl === targetWorkCenter);
  const outsideTarget = remaining.filter((job) => job.arbpl !== targetWorkCenter);
  const blockInsertIndex = firstTargetIndex < 0
    ? outsideTarget.length
    : remaining
      .slice(0, firstTargetIndex)
      .filter((job) => job.arbpl !== targetWorkCenter)
      .length;
  const nextJobs = [...outsideTarget];
  nextJobs.splice(blockInsertIndex, 0, ...targetQueue);

  let resultJobs = nextJobs;
  if (resequence) {
    const nextSequenceById = new Map<number, number>();
    for (const workCenter of affectedWorkCenters) {
      nextJobs
        .filter((job) => job.arbpl === workCenter)
        .forEach((job, index) => nextSequenceById.set(job.id, index + 1));
    }
    resultJobs = nextJobs.map((job) => (
      nextSequenceById.has(job.id)
        ? { ...job, seqno: nextSequenceById.get(job.id)! }
        : job
    ));
  }

  const movedOrders = new Set(draggedJobs.map((job) => job.aufnr));
  const violation = validatePrecedence
    ? findOperationPrecedenceViolation(resultJobs.filter((job) => movedOrders.has(job.aufnr)))
    : null;
  if (violation) {
    return {
      affectedWorkCenters: new Set(),
      jobs,
      moved: false,
      validationError: formatOperationPrecedenceError(violation),
      violation,
    };
  }

  return {
    affectedWorkCenters,
    jobs: resultJobs,
    moved: true,
  };
}
