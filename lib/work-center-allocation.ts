import { sortJobsWithZpg3dTransition, type SortableJob } from './zpg1d-helpers';

export const AUTO_WORK_CENTER_IDS = ['111001', '111003', '111004', '111005'] as const;

type AllocatableJob = SortableJob & {
  id: number;
  optime: number;
  zlg3d?: string | null;
};

export type WorkCenterAllocationSummary = {
  beforeChangeovers: number;
  afterChangeovers: number;
  movedOrders: number;
  workCenters: Array<{
    workCenter: string;
    orders: number;
    jobs: number;
    hours: number;
    changeovers: number;
  }>;
};

function lqKey(job: AllocatableJob) {
  return job.zlg3d?.trim() || job.zlmat?.trim() || 'ไม่ระบุ L/Q';
}

function countQueueChangeovers<T extends AllocatableJob>(jobs: T[]) {
  let count = 0;
  for (let index = 1; index < jobs.length; index += 1) {
    if (lqKey(jobs[index - 1]) !== lqKey(jobs[index])) count += 1;
  }
  return count;
}

function jobWorkload(job: AllocatableJob) {
  return job.optime > 0 ? job.optime : 0.25;
}

function sortQueue<T extends AllocatableJob>(jobs: T[], workCenter: string) {
  return sortJobsWithZpg3dTransition(
    jobs.map((job) => ({ ...job, arbpl: workCenter })),
  );
}

export function countWorkCenterLqChangeovers<T extends AllocatableJob>(jobs: T[]) {
  const queues = new Map<string, T[]>();
  for (const job of jobs) {
    const queue = queues.get(job.arbpl);
    if (queue) queue.push(job);
    else queues.set(job.arbpl, [job]);
  }

  let total = 0;
  for (const queue of queues.values()) total += countQueueChangeovers(queue);
  return total;
}

/**
 * Experimental allocator: keep an entire Work Order on one machine, prefer a
 * machine that adds fewer L/Q changes, and penalize assignments above the
 * average operation-hour load. The established queue sorter is applied after
 * every assignment and once more to produce the final machine queues.
 */
export function allocateWorkOrdersToWorkCenters<T extends AllocatableJob>(
  jobs: T[],
  targetWorkCenters: readonly string[] = AUTO_WORK_CENTER_IDS,
): { jobs: T[]; summary: WorkCenterAllocationSummary } {
  if (jobs.length === 0 || targetWorkCenters.length === 0) {
    return {
      jobs,
      summary: {
        beforeChangeovers: 0,
        afterChangeovers: 0,
        movedOrders: 0,
        workCenters: [],
      },
    };
  }

  const orders = new Map<string, T[]>();
  for (const job of jobs) {
    const orderJobs = orders.get(job.aufnr);
    if (orderJobs) orderJobs.push(job);
    else orders.set(job.aufnr, [job]);
  }

  const orderGroups = Array.from(orders.entries())
    .map(([order, orderJobs]) => ({
      order,
      jobs: orderJobs,
      workload: orderJobs.reduce((sum, job) => sum + jobWorkload(job), 0),
      lqSignature: Array.from(new Set(orderJobs.map(lqKey)))
        .sort((a, b) => a.localeCompare(b, 'th', { numeric: true }))
        .join('\u0000'),
    }))
    .sort((a, b) =>
      a.lqSignature.localeCompare(b.lqSignature, 'th', { numeric: true }) ||
      b.workload - a.workload ||
      a.order.localeCompare(b.order, 'th', { numeric: true }),
    );

  const totalWorkload = orderGroups.reduce((sum, group) => sum + group.workload, 0);
  const targetAverageLoad = totalWorkload / targetWorkCenters.length;
  const queues = new Map<string, T[]>(targetWorkCenters.map((workCenter) => [workCenter, []]));
  const loads = new Map<string, number>(targetWorkCenters.map((workCenter) => [workCenter, 0]));

  for (const orderGroup of orderGroups) {
    let bestWorkCenter = targetWorkCenters[0];
    let bestScore = Number.POSITIVE_INFINITY;
    let bestQueue: T[] = [];

    for (const workCenter of targetWorkCenters) {
      const currentQueue = queues.get(workCenter) ?? [];
      const candidateQueue = sortQueue([...currentQueue, ...orderGroup.jobs], workCenter);
      const addedChangeovers = countQueueChangeovers(candidateQueue) - countQueueChangeovers(currentQueue);
      const projectedLoad = (loads.get(workCenter) ?? 0) + orderGroup.workload;
      const loadRatio = targetAverageLoad > 0 ? projectedLoad / targetAverageLoad : 0;
      // Let the L/Q objective lead while strongly discouraging any machine from
      // drifting beyond roughly 105% of the average operation-hour workload.
      const overloadPenalty = Math.max(0, loadRatio - 1.05) ** 2 * 50_000;
      const score = addedChangeovers * 100 + overloadPenalty + loadRatio;

      if (score < bestScore) {
        bestScore = score;
        bestWorkCenter = workCenter;
        bestQueue = candidateQueue;
      }
    }

    queues.set(bestWorkCenter, bestQueue);
    loads.set(bestWorkCenter, (loads.get(bestWorkCenter) ?? 0) + orderGroup.workload);
  }

  const allocatedJobs: T[] = [];
  const workCenterSummary: WorkCenterAllocationSummary['workCenters'] = [];
  for (const workCenter of targetWorkCenters) {
    const queue = sortQueue(queues.get(workCenter) ?? [], workCenter)
      .map((job, index) => ({ ...job, seqno: index + 1 } as T));
    allocatedJobs.push(...queue);
    workCenterSummary.push({
      workCenter,
      orders: new Set(queue.map((job) => job.aufnr)).size,
      jobs: queue.length,
      hours: Number(queue.reduce((sum, job) => sum + job.optime, 0).toFixed(1)),
      changeovers: countQueueChangeovers(queue),
    });
  }

  const originalWorkCentersByOrder = new Map<string, Set<string>>();
  for (const job of jobs) {
    const workCenters = originalWorkCentersByOrder.get(job.aufnr) ?? new Set<string>();
    workCenters.add(job.arbpl);
    originalWorkCentersByOrder.set(job.aufnr, workCenters);
  }
  const allocatedWorkCenterByOrder = new Map(allocatedJobs.map((job) => [job.aufnr, job.arbpl]));
  const movedOrders = Array.from(originalWorkCentersByOrder.entries()).filter(([order, workCenters]) => {
    const allocatedWorkCenter = allocatedWorkCenterByOrder.get(order);
    return workCenters.size !== 1 || !allocatedWorkCenter || !workCenters.has(allocatedWorkCenter);
  }).length;

  return {
    jobs: allocatedJobs,
    summary: {
      beforeChangeovers: countWorkCenterLqChangeovers(jobs),
      afterChangeovers: countWorkCenterLqChangeovers(allocatedJobs),
      movedOrders,
      workCenters: workCenterSummary,
    },
  };
}
