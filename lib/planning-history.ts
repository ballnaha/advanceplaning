import type { PlanningJob } from './planning';

export type PlanningHistoryEntry = {
  state: PlanningJob[];
  affectedJobIds: number[];
};

export function planningJobsStateEqual(left: PlanningJob[], right: PlanningJob[]) {
  if (left.length !== right.length) return false;
  return left.every((job, index) => {
    const other = right[index];
    return Boolean(other) &&
      job.id === other.id &&
      job.arbpl === other.arbpl &&
      job.seqno === other.seqno &&
      job.stdate === other.stdate &&
      job.findate === other.findate &&
      job.queueGroup === other.queueGroup &&
      job.zpg1d === other.zpg1d;
  });
}

export function undoPlanningHistory(
  currentJobs: PlanningJob[],
  initialJobs: PlanningJob[],
  history: PlanningHistoryEntry[],
) {
  const remainingHistory = [...history];
  while (remainingHistory.length > 0) {
    const entry = remainingHistory.pop()!;
    if (planningJobsStateEqual(entry.state, currentJobs)) continue;
    return {
      affectedJobIds: entry.affectedJobIds,
      history: remainingHistory,
      jobs: entry.state,
      changed: true,
    };
  }

  return {
    affectedJobIds: [] as number[],
    history: remainingHistory,
    jobs: initialJobs,
    changed: !planningJobsStateEqual(currentJobs, initialJobs),
  };
}

export function rebaseJobsAfterPartialSave(
  baseJobs: PlanningJob[],
  savedJobs: PlanningJob[],
  savedWorkCenters: Set<string>,
) {
  const workCenterOrder = Array.from(new Set([
    ...baseJobs.map((job) => job.arbpl),
    ...savedJobs.map((job) => job.arbpl),
  ]));
  const savedJobIds = new Set(
    savedJobs
      .filter((job) => savedWorkCenters.has(job.arbpl))
      .map((job) => job.id),
  );

  return workCenterOrder.flatMap((workCenter) => {
    if (savedWorkCenters.has(workCenter)) {
      return savedJobs.filter((job) => job.arbpl === workCenter);
    }
    return baseJobs.filter(
      (job) => job.arbpl === workCenter && !savedJobIds.has(job.id),
    );
  });
}

export function rebaseHistoryAfterPartialSave(
  history: PlanningHistoryEntry[],
  savedJobs: PlanningJob[],
  savedWorkCenters: Set<string>,
) {
  const savedJobById = new Map(savedJobs.map((job) => [job.id, job]));

  return history.flatMap((entry) => {
    const remainingAffectedJobIds = entry.affectedJobIds.filter((jobId) => {
      const historicalJob = entry.state.find((job) => job.id === jobId);
      const savedJob = savedJobById.get(jobId);
      return !savedWorkCenters.has(historicalJob?.arbpl ?? '') &&
        !savedWorkCenters.has(savedJob?.arbpl ?? '');
    });

    // An empty affected list means a global action such as Default Setting.
    // Keep it, but replace the portions that have already been committed.
    if (entry.affectedJobIds.length > 0 && remainingAffectedJobIds.length === 0) {
      return [];
    }

    return [{
      state: rebaseJobsAfterPartialSave(entry.state, savedJobs, savedWorkCenters),
      affectedJobIds: remainingAffectedJobIds,
    }];
  });
}
