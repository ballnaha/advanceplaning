import type { PlanningJob } from './planning';
import { DEFAULT_PLANNING_RULES } from './planning-rules';
import { cleanZpg2d, getQueueGroupId } from './zpg1d-helpers';

export type ScenarioMetrics = {
  jobs: number;
  lqChanges: number;
  sizeChanges: number;
  colorChanges: number;
  movedJobs: number;
  operationOrderWarnings: number;
  dueDateOrderWarnings: number;
  score: number;
};

export type ScenarioConstraintCheck = {
  id: 'work-center' | 'steel-group' | 'start-date' | 'operation-order' | 'due-date-order' | 'freeze-zone';
  label: string;
  passed: boolean;
  detail: string;
};

export type ScenarioSequenceChange = {
  jobId: number;
  order: string;
  operation: string;
  workCenter: string;
  previousSequence: number;
  proposedSequence: number;
  lqGroup: string;
  finishDate: string | null;
  reason: string;
};

export type SafeLqScenario = {
  id: string;
  name: string;
  ruleVersion: string;
  generatedAt: string;
  currentJobs: PlanningJob[];
  proposedJobs: PlanningJob[];
  before: ScenarioMetrics;
  after: ScenarioMetrics;
  changes: ScenarioSequenceChange[];
  constraints: ScenarioConstraintCheck[];
  improved: boolean;
};

export type SafeLqScenarioOptions = {
  freezeHeadCount?: number;
};

const UNKNOWN_LQ = 'ไม่ระบุ L/Q';
const UNKNOWN_VALUE = 'ไม่ระบุ';

function normalize(value: string | null | undefined, fallback = UNKNOWN_VALUE) {
  return value?.trim() || fallback;
}

function getLqGroup(job: PlanningJob) {
  return normalize(job.zlg3d, UNKNOWN_LQ);
}

function getStartDate(job: PlanningJob) {
  return job.stdate || '9999-12-31';
}

function getFinishDate(job: PlanningJob) {
  return job.findate || '9999-12-31';
}

function getSafeBlockKey(job: PlanningJob) {
  return [
    getQueueGroupId(job),
    getStartDate(job),
    getFinishDate(job),
  ].join('|');
}

function groupByWorkCenter(jobs: PlanningJob[]) {
  const groups = new Map<string, PlanningJob[]>();
  for (const job of jobs) {
    const queue = groups.get(job.arbpl) ?? [];
    queue.push(job);
    groups.set(job.arbpl, queue);
  }
  return groups;
}

function countTransitions(jobs: PlanningJob[], key: (job: PlanningJob) => string) {
  let changes = 0;
  for (let index = 1; index < jobs.length; index += 1) {
    if (key(jobs[index - 1]) !== key(jobs[index])) changes += 1;
  }
  return changes;
}

function parseOperation(value: string | null) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function countOperationOrderWarnings(jobs: PlanningJob[]) {
  let warnings = 0;
  for (const queue of groupByWorkCenter(jobs).values()) {
    const lastOperationByOrder = new Map<string, number>();
    for (const job of queue) {
      const operation = parseOperation(job.vornr);
      if (operation === null) continue;
      const previous = lastOperationByOrder.get(job.aufnr);
      if (previous !== undefined && operation < previous) warnings += 1;
      lastOperationByOrder.set(job.aufnr, operation);
    }
  }
  return warnings;
}

function countDueDateOrderWarnings(jobs: PlanningJob[]) {
  let warnings = 0;
  for (const queue of groupByWorkCenter(jobs).values()) {
    for (let index = 1; index < queue.length; index += 1) {
      const previous = queue[index - 1].findate;
      const current = queue[index].findate;
      if (previous && current && current < previous) warnings += 1;
    }
  }
  return warnings;
}

function calculateMetrics(jobs: PlanningJob[], baselinePosition?: Map<number, number>): ScenarioMetrics {
  let lqChanges = 0;
  let sizeChanges = 0;
  let colorChanges = 0;

  for (const queue of groupByWorkCenter(jobs).values()) {
    lqChanges += countTransitions(queue, getLqGroup);
    sizeChanges += countTransitions(queue, (job) => cleanZpg2d(job.zpg2d));
    colorChanges += countTransitions(queue, (job) => normalize(job.zpg3d));
  }

  const currentPosition = new Map<number, number>();
  for (const queue of groupByWorkCenter(jobs).values()) {
    queue.forEach((job, index) => currentPosition.set(job.id, index + 1));
  }
  const movedJobs = baselinePosition
    ? jobs.filter((job) => baselinePosition.get(job.id) !== currentPosition.get(job.id)).length
    : 0;
  const weights = DEFAULT_PLANNING_RULES.weights;

  return {
    jobs: jobs.length,
    lqChanges,
    sizeChanges,
    colorChanges,
    movedJobs,
    operationOrderWarnings: countOperationOrderWarnings(jobs),
    dueDateOrderWarnings: countDueDateOrderWarnings(jobs),
    score:
      lqChanges * weights.lqChange +
      sizeChanges * weights.zpg2dChange +
      colorChanges * weights.zpg3dChange,
  };
}

function buildGroupOrderCandidates(groupKeys: string[]) {
  const candidates: string[][] = [groupKeys];
  for (const first of groupKeys) {
    candidates.push([first, ...groupKeys.filter((key) => key !== first)]);
    for (const last of groupKeys) {
      if (first === last) continue;
      candidates.push([
        first,
        ...groupKeys.filter((key) => key !== first && key !== last),
        last,
      ]);
    }
  }
  return candidates;
}

function optimizeSafeBlock(
  block: PlanningJob[],
  previousLq: string | null,
  nextLq: string | null,
) {
  const byLq = new Map<string, PlanningJob[]>();
  for (const job of block) {
    const key = getLqGroup(job);
    const group = byLq.get(key) ?? [];
    group.push(job);
    byLq.set(key, group);
  }
  const groupKeys = Array.from(byLq.keys());
  if (groupKeys.length < 2) return block;

  let best = block;
  let bestTransitions = Number.POSITIVE_INFINITY;
  let bestMoved = Number.POSITIVE_INFINITY;

  for (const order of buildGroupOrderCandidates(groupKeys)) {
    const candidate = order.flatMap((key) => byLq.get(key) ?? []);
    const comparison = [
      ...(previousLq ? [previousLq] : []),
      ...candidate.map(getLqGroup),
      ...(nextLq ? [nextLq] : []),
    ];
    let transitions = 0;
    for (let index = 1; index < comparison.length; index += 1) {
      if (comparison[index - 1] !== comparison[index]) transitions += 1;
    }
    const moved = candidate.filter((job, index) => job.id !== block[index].id).length;
    if (transitions < bestTransitions || (transitions === bestTransitions && moved < bestMoved)) {
      best = candidate;
      bestTransitions = transitions;
      bestMoved = moved;
    }
  }
  return best;
}

function buildSafeBlockCandidates(block: PlanningJob[]) {
  const byLq = new Map<string, PlanningJob[]>();
  for (const job of block) {
    const key = getLqGroup(job);
    byLq.set(key, [...(byLq.get(key) ?? []), job]);
  }
  return [
    optimizeSafeBlock(block, null, null),
    ...buildGroupOrderCandidates(Array.from(byLq.keys()))
      .map((order) => order.flatMap((key) => byLq.get(key) ?? [])),
  ];
}

function queueLqChanges(queue: PlanningJob[]) {
  return countTransitions(queue, getLqGroup);
}

function getSafeBucketPositions(queue: PlanningJob[], freezeHeadCount: number) {
  const buckets = new Map<string, number[]>();
  queue.forEach((job, index) => {
    if (index < freezeHeadCount) return;
    const key = getSafeBlockKey(job);
    buckets.set(key, [...(buckets.get(key) ?? []), index]);
  });
  return Array.from(buckets.values()).filter((positions) => positions.length > 1);
}

function placeCandidate(queue: PlanningJob[], positions: number[], candidate: PlanningJob[]) {
  const trial = [...queue];
  positions.forEach((position, index) => { trial[position] = candidate[index]; });
  return trial;
}

function optimizeQueueBuckets(queue: PlanningJob[], freezeHeadCount: number) {
  let proposed = [...queue];
  const baselineOpWarnings = countOperationOrderWarnings(queue);
  const baselineDueWarnings = countDueDateOrderWarnings(queue);
  for (const positions of getSafeBucketPositions(queue, freezeHeadCount)) {
    proposed = optimizeOneBucket(proposed, positions, baselineOpWarnings, baselineDueWarnings);
  }
  return proposed;
}

function optimizeOneBucket(
  queue: PlanningJob[],
  positions: number[],
  baselineOpWarnings: number,
  baselineDueWarnings: number,
) {
  const block = positions.map((position) => queue[position]);
  let best = queue;
  let bestLqChanges = queueLqChanges(queue);
  for (const candidate of buildSafeBlockCandidates(block)) {
    const trial = placeCandidate(queue, positions, candidate);
    const lqChanges = queueLqChanges(trial);
    if (lqChanges >= bestLqChanges) continue;
    if (countOperationOrderWarnings(trial) > baselineOpWarnings) continue;
    if (countDueDateOrderWarnings(trial) > baselineDueWarnings) continue;
    best = trial;
    bestLqChanges = lqChanges;
  }
  return best;
}

function optimizeWorkCenterQueue(queue: PlanningJob[], freezeHeadCount: number) {
  return optimizeQueueBuckets(queue, freezeHeadCount);
}

function positionsById(jobs: PlanningJob[]) {
  const positions = new Map<number, number>();
  for (const queue of groupByWorkCenter(jobs).values()) {
    queue.forEach((job, index) => positions.set(job.id, index + 1));
  }
  return positions;
}

export function generateSafeLqScenario(
  jobs: PlanningJob[],
  options: SafeLqScenarioOptions = {},
): SafeLqScenario {
  const freezeHeadCount = Math.max(0, Math.trunc(options.freezeHeadCount ?? 0));
  const currentJobs = [...jobs];
  const proposedJobs = Array.from(groupByWorkCenter(currentJobs).entries())
    .sort(([a], [b]) => a.localeCompare(b, 'th', { numeric: true }))
    .flatMap(([, queue]) => optimizeWorkCenterQueue(queue, freezeHeadCount));
  const baselinePosition = positionsById(currentJobs);
  const proposedPosition = positionsById(proposedJobs);
  const before = calculateMetrics(currentJobs, baselinePosition);
  const after = calculateMetrics(proposedJobs, baselinePosition);

  const proposedById = new Map(proposedJobs.map((job) => [job.id, job]));
  const changes = proposedJobs
    .filter((job) => baselinePosition.get(job.id) !== proposedPosition.get(job.id))
    .map((job): ScenarioSequenceChange => ({
      jobId: job.id,
      order: job.aufnr,
      operation: job.vornr || '-',
      workCenter: job.arbpl,
      previousSequence: baselinePosition.get(job.id) ?? 0,
      proposedSequence: proposedPosition.get(job.id) ?? 0,
      lqGroup: getLqGroup(job),
      finishDate: job.findate,
      reason: 'จัดให้อยู่ต่อเนื่องกับกลุ่ม L/Q เดียวกันภายใน Safe Block',
    }))
    .sort((a, b) => a.workCenter.localeCompare(b.workCenter, 'th', { numeric: true }) || a.proposedSequence - b.proposedSequence);

  const workCenterStable = currentJobs.every((job) => proposedById.get(job.id)?.arbpl === job.arbpl);
  const steelGroupStable = currentJobs.every((job) => {
    const proposed = proposedById.get(job.id);
    return proposed ? getQueueGroupId(proposed) === getQueueGroupId(job) : false;
  });
  const startDateStable = currentJobs.every((job) => proposedById.get(job.id)?.stdate === job.stdate);
  const freezeZoneStable = Array.from(groupByWorkCenter(currentJobs).entries()).every(([workCenter, queue]) => {
    const proposedQueue = proposedJobs.filter((job) => job.arbpl === workCenter);
    return queue.slice(0, freezeHeadCount).every((job, index) => proposedQueue[index]?.id === job.id);
  });
  const operationOrderStable = after.operationOrderWarnings <= before.operationOrderWarnings;
  const dueDateOrderStable = after.dueDateOrderWarnings <= before.dueDateOrderWarnings;

  const constraints: ScenarioConstraintCheck[] = [
    { id: 'work-center', label: 'Work Center เดิม', passed: workCenterStable, detail: workCenterStable ? 'ไม่มีงานถูกย้ายข้าม Work Center' : 'พบงานถูกย้ายข้าม Work Center' },
    { id: 'steel-group', label: 'ประเภทเหล็กเดิม', passed: steelGroupStable, detail: steelGroupStable ? 'ทุกงานอยู่ในประเภทเหล็กเดิม' : 'พบงานเปลี่ยนประเภทเหล็ก' },
    { id: 'start-date', label: 'Start Date เดิม', passed: startDateStable, detail: startDateStable ? 'ไม่มีการแก้ไข Start Date' : 'พบ Start Date เปลี่ยนแปลง' },
    { id: 'operation-order', label: 'ลำดับ OP ไม่แย่ลง', passed: operationOrderStable, detail: `${before.operationOrderWarnings} → ${after.operationOrderWarnings} จุด` },
    { id: 'due-date-order', label: 'ลำดับ Due Date ไม่แย่ลง', passed: dueDateOrderStable, detail: `${before.dueDateOrderWarnings} → ${after.dueDateOrderWarnings} จุด` },
    { id: 'freeze-zone', label: `Freeze ${freezeHeadCount} งานแรก`, passed: freezeZoneStable, detail: freezeZoneStable ? 'งานใน Freeze Zone ไม่ถูกขยับ' : 'พบงานใน Freeze Zone ถูกขยับ' },
  ];

  return {
    id: `safe-lq-${Date.now()}`,
    name: 'Safe L/Q Optimization',
    ruleVersion: `${DEFAULT_PLANNING_RULES.version}-SAFE-PREVIEW-v1`,
    generatedAt: new Date().toISOString(),
    currentJobs,
    proposedJobs,
    before,
    after,
    changes,
    constraints,
    improved: after.lqChanges < before.lqChanges && constraints.every((constraint) => constraint.passed),
  };
}
