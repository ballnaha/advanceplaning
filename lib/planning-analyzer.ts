import type { PlanningJob } from './planning';
import { getQueueGroupId } from './zpg1d-helpers';
import { DEFAULT_PLANNING_RULES, type PlanningRules } from './planning-rules';

export type LqTransition = {
  position: number;
  from: string;
  to: string;
  order: string;
  operation: string;
};

export type WorkCenterAnalysis = {
  workCenter: string;
  jobs: number;
  totalHours: number;
  lqChanges: number;
  distinctLqCodes: number;
  operationOrderWarnings: number;
  transitions: LqTransition[];
};

export type PlanningRecommendation = {
  type: 'REDUCE_LQ_CHANGE' | 'BALANCE_LOAD' | 'CHECK_OPERATION_ORDER';
  severity: 'info' | 'warning';
  title: string;
  detail: string;
  workCenter: string;
  before?: number;
  after?: number;
  affectedJobIds: number[];
};

export type PlanningJobContext = {
  id: number;
  order: string;
  operation: string;
  operationName: string;
  workCenter: string;
  queueGroup: string;
  startDate: string | null;
  finishDate: string | null;
  lqCode: string;
  lqName: string;
  zpg2d: string;
  zpg3d: string;
  optime: number;
};

export type PlanningAnalysis = {
  generatedAt: string;
  scopeLabel: string;
  rules: PlanningRules;
  totals: {
    jobs: number;
    workCenters: number;
    totalHours: number;
    lqChanges: number;
    potentialLqReduction: number;
    operationOrderWarnings: number;
  };
  load: {
    highestWorkCenter: string | null;
    lowestWorkCenter: string | null;
    averageHours: number;
    imbalanceHours: number;
  };
  workCenters: WorkCenterAnalysis[];
  recommendations: PlanningRecommendation[];
  jobContext: PlanningJobContext[];
  truncatedJobContext: number;
};

const MAX_TRANSITIONS_PER_WORK_CENTER = 12;
const MAX_JOB_CONTEXT = 300;

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getLqCode(job: PlanningJob) {
  return job.zlmat?.trim() || 'ไม่ระบุ L/Q';
}

function getOperationNumber(job: PlanningJob) {
  const parsed = Number.parseInt(job.vornr ?? '', 10);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function countLqChanges(jobs: PlanningJob[]) {
  let changes = 0;
  const transitions: LqTransition[] = [];

  for (let index = 1; index < jobs.length; index += 1) {
    const previous = getLqCode(jobs[index - 1]);
    const current = getLqCode(jobs[index]);
    if (previous === current) continue;

    changes += 1;
    if (transitions.length < MAX_TRANSITIONS_PER_WORK_CENTER) {
      transitions.push({
        position: index + 1,
        from: previous,
        to: current,
        order: jobs[index].aufnr,
        operation: jobs[index].vornr || '-',
      });
    }
  }

  return { changes, transitions };
}

function countOperationOrderWarnings(jobs: PlanningJob[]) {
  const lastOperationByOrder = new Map<string, number>();
  let warnings = 0;

  for (const job of jobs) {
    const operation = getOperationNumber(job);
    if (operation === Number.MAX_SAFE_INTEGER) continue;
    const previous = lastOperationByOrder.get(job.aufnr);
    if (previous !== undefined && operation < previous) warnings += 1;
    lastOperationByOrder.set(job.aufnr, operation);
  }

  return warnings;
}

function getOptimizationBlockKey(job: PlanningJob, rules: PlanningRules) {
  const steelGroup = rules.groupBySteelType ? getQueueGroupId(job) : 'all-steel';
  const startDate = job.stdate || 'ไม่ระบุวันที่';
  return `${steelGroup}|${startDate}`;
}

function findLqRecommendations(
  workCenter: string,
  jobs: PlanningJob[],
  rules: PlanningRules,
): PlanningRecommendation[] {
  const blocks: PlanningJob[][] = [];
  let currentBlock: PlanningJob[] = [];
  let currentBlockKey: string | null = null;
  for (const job of jobs) {
    const key = getOptimizationBlockKey(job, rules);
    if (currentBlockKey !== key) {
      if (currentBlock.length > 0) blocks.push(currentBlock);
      currentBlock = [];
      currentBlockKey = key;
    }
    currentBlock.push(job);
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  const recommendations: PlanningRecommendation[] = [];
  for (const block of blocks) {
    if (block.length < 3) continue;

    // Phase one only recommends blocks where each Work Order appears once.
    // This guarantees that grouping by L/Q cannot reverse OP precedence.
    const orderCount = new Set(block.map((job) => job.aufnr)).size;
    if (rules.preserveOperationOrder && orderCount !== block.length) continue;

    const before = countLqChanges(block).changes;
    const grouped = [...block].sort((a, b) => {
      const lqCompare = getLqCode(a).localeCompare(getLqCode(b), 'th', { numeric: true });
      return lqCompare !== 0 ? lqCompare : a.sourceRow - b.sourceRow;
    });
    const after = countLqChanges(grouped).changes;
    if (after >= before) continue;

    recommendations.push({
      type: 'REDUCE_LQ_CHANGE',
      severity: 'info',
      title: `ลดการเปลี่ยน L/Q ที่ WC ${workCenter}`,
      detail: `กลุ่มประเภทเหล็กและ Start Date เดียวกันสามารถลดจาก ${before} เหลือ ${after} ครั้ง โดยไม่สลับลำดับ OP ภายใน Work Order`,
      workCenter,
      before,
      after,
      affectedJobIds: grouped.map((job) => job.id),
    });
  }

  return recommendations.sort((a, b) => ((b.before ?? 0) - (b.after ?? 0)) - ((a.before ?? 0) - (a.after ?? 0)));
}

export function analyzePlanning(
  jobs: PlanningJob[],
  options?: { scopeLabel?: string; rules?: PlanningRules },
): PlanningAnalysis {
  const rules = options?.rules ?? DEFAULT_PLANNING_RULES;
  const byWorkCenter = new Map<string, PlanningJob[]>();

  for (const job of jobs) {
    const workCenterJobs = byWorkCenter.get(job.arbpl) ?? [];
    workCenterJobs.push(job);
    byWorkCenter.set(job.arbpl, workCenterJobs);
  }

  const recommendations: PlanningRecommendation[] = [];
  const workCenters = Array.from(byWorkCenter.entries())
    .sort(([a], [b]) => a.localeCompare(b, 'th', { numeric: true }))
    .map(([workCenter, workCenterJobs]) => {
      const lq = countLqChanges(workCenterJobs);
      const operationOrderWarnings = countOperationOrderWarnings(workCenterJobs);
      const totalHours = round(workCenterJobs.reduce((sum, job) => sum + job.optime, 0));

      recommendations.push(...findLqRecommendations(workCenter, workCenterJobs, rules));
      if (operationOrderWarnings > 0) {
        recommendations.push({
          type: 'CHECK_OPERATION_ORDER',
          severity: 'warning',
          title: `พบลำดับ OP ที่ควรตรวจสอบใน WC ${workCenter}`,
          detail: `พบ ${operationOrderWarnings} จุดที่หมายเลข OP ลดลงภายใน Work Order เดียวกัน`,
          workCenter,
          affectedJobIds: [],
        });
      }

      return {
        workCenter,
        jobs: workCenterJobs.length,
        totalHours,
        lqChanges: lq.changes,
        distinctLqCodes: new Set(workCenterJobs.map(getLqCode)).size,
        operationOrderWarnings,
        transitions: lq.transitions,
      };
    });

  const sortedByLoad = [...workCenters].sort((a, b) => a.totalHours - b.totalHours);
  const lowest = sortedByLoad[0] ?? null;
  const highest = sortedByLoad.at(-1) ?? null;
  const totalHours = round(workCenters.reduce((sum, item) => sum + item.totalHours, 0));
  const averageHours = workCenters.length > 0 ? round(totalHours / workCenters.length) : 0;
  const imbalanceHours = highest && lowest ? round(highest.totalHours - lowest.totalHours) : 0;

  if (highest && lowest && highest.workCenter !== lowest.workCenter && imbalanceHours > 0) {
    recommendations.push({
      type: 'BALANCE_LOAD',
      severity: 'info',
      title: `ตรวจสอบการกระจายโหลด ${highest.workCenter} → ${lowest.workCenter}`,
      detail: `โหลดต่างกัน ${imbalanceHours} ชั่วโมง ข้อเสนอนี้เป็นเพียง Candidate จนกว่าจะมี Eligible Work Center master`,
      workCenter: highest.workCenter,
      affectedJobIds: [],
    });
  }

  const lqRecommendations = recommendations.filter((item) => item.type === 'REDUCE_LQ_CHANGE');
  const potentialLqReduction = lqRecommendations.reduce(
    (sum, item) => sum + Math.max((item.before ?? 0) - (item.after ?? 0), 0),
    0,
  );
  const jobContext = jobs.slice(0, MAX_JOB_CONTEXT).map((job) => ({
    id: job.id,
    order: job.aufnr,
    operation: job.vornr || '-',
    operationName: job.ltxa1 || '-',
    workCenter: job.arbpl,
    queueGroup: job.queueGroup?.trim() || job.zpg1d || 'ไม่ระบุ',
    startDate: job.stdate,
    finishDate: job.findate,
    lqCode: getLqCode(job),
    lqName: job.zltkx || '-',
    zpg2d: job.zpg2d || '-',
    zpg3d: job.zpg3d || '-',
    optime: round(job.optime),
  }));

  return {
    generatedAt: new Date().toISOString(),
    scopeLabel: options?.scopeLabel || 'ข้อมูลตาม Filter ปัจจุบัน',
    rules,
    totals: {
      jobs: jobs.length,
      workCenters: workCenters.length,
      totalHours,
      lqChanges: workCenters.reduce((sum, item) => sum + item.lqChanges, 0),
      potentialLqReduction,
      operationOrderWarnings: workCenters.reduce((sum, item) => sum + item.operationOrderWarnings, 0),
    },
    load: {
      highestWorkCenter: highest?.workCenter ?? null,
      lowestWorkCenter: lowest?.workCenter ?? null,
      averageHours,
      imbalanceHours,
    },
    workCenters,
    recommendations: recommendations.slice(0, 30),
    jobContext,
    truncatedJobContext: Math.max(jobs.length - jobContext.length, 0),
  };
}

export function answerPlanningLocally(question: string, analysis: PlanningAnalysis) {
  const normalized = question.toLocaleLowerCase('th-TH');
  const totals = analysis.totals;

  if (normalized.includes('l/q') || normalized.includes('lq')) {
    return `แผนตาม Filter ปัจจุบันเปลี่ยน L/Q ${totals.lqChanges} ครั้ง และพบโอกาสลดได้ประมาณ ${totals.potentialLqReduction} ครั้ง ภายใต้กฎ ${analysis.rules.version} โดยยังไม่ใช้ Status ในการคำนวณ`;
  }
  if (normalized.includes('โหลด') || normalized.includes('คอขวด') || normalized.includes('เครื่อง')) {
    return `Work Center ที่โหลดสูงสุดคือ ${analysis.load.highestWorkCenter ?? '-'} และต่ำสุดคือ ${analysis.load.lowestWorkCenter ?? '-'} โหลดต่างกัน ${analysis.load.imbalanceHours} ชั่วโมง การย้ายข้ามเครื่องยังต้องตรวจ Eligible Work Center ก่อน`;
  }
  if (normalized.includes('op') || normalized.includes('routing')) {
    return `พบจุดที่ควรตรวจสอบลำดับ OP ${totals.operationOrderWarnings} จุด จาก ${totals.jobs} Operations ตาม Filter ปัจจุบัน`;
  }

  return `สรุปแผน: ${totals.jobs} Operations, ${totals.workCenters} Work Centers, โหลดรวม ${totals.totalHours} ชั่วโมง, เปลี่ยน L/Q ${totals.lqChanges} ครั้ง และมีคำแนะนำ ${analysis.recommendations.length} รายการ`;
}
