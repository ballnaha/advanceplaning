import 'server-only';

import { prisma } from './prisma';
import { getJobGroupSortOrder, cleanZpg2d, sortJobsWithZpg3dTransition } from './zpg1d-helpers';

export type PlanningJob = {
  id: number;
  sourceRow: number;
  seqno: number;
  arbpl: string;
  aufnr: string;
  text1: string | null;
  zpmat: string | null;
  zptkx: string | null;
  zptxt: string | null;
  zpg1d: string | null;
  zpg2d: string | null;
  zpg3d: string | null;
  zpg4d: string | null;
  zpg5d: string | null;
  stdate: string | null;
  findate: string | null;
  prdday: number;
  steelDibId: string | null;
  steelDibDesc: string | null;
  steelDibLong: string | null;
  zlmat: string | null;
  zltkx: string | null;
  zlg3d: string | null;
  zlg5d: string | null;
  vornr: string | null;
  ltxa1: string | null;
  usr00: string | null;
  usr02: string | null;
  time: string | null;
  optime: number;
  opdays: number;
  mgvrg: number;
  remark: string | null;
  priority: string | null;
  entd: string | null;
  zvers: string | null;
  confirmYield: number;
  confirmHold: number;
  confirmScrap: number;
};

export type WorkCenterSummary = {
  arbpl: string;
  jobs: number;
  waitJobs: number;
  optime: number;
  opdays: number;
  mgvrg: number;
  lqCount: number;
  stdate: string | null;
  findate: string | null;
};

export type DailyLoad = {
  date: string;
  arbpl: string;
  jobs: number;
  waitJobs: number;
  optime: number;
  mgvrg: number;
};

export type PlanningDashboardData = {
  jobs: PlanningJob[];
  workCenters: WorkCenterSummary[];
  dailyLoads: DailyLoad[];
  totals: {
    jobs: number;
    waitJobs: number;
    optime: number;
    opdays: number;
    mgvrg: number;
  };
  generatedAt: string;
};

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toDateString(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function dateKey(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : 'ไม่ระบุวันที่';
}

function materialGroupText(value: string | null) {
  return value?.trim() || 'ไม่ระบุ';
}

function serializeJob(job: Awaited<ReturnType<typeof prisma.productionJob.findMany>>[number]): PlanningJob {
  return {
    id: job.id,
    sourceRow: job.sourceRow,
    seqno: job.seqno,
    arbpl: job.arbpl,
    aufnr: job.aufnr,
    text1: job.text1,
    zpmat: job.zpmat,
    zptkx: job.zptkx,
    zptxt: job.zptxt,
    zpg1d: job.zpg1d,
    zpg2d: job.zpg2d,
    zpg3d: job.zpg3d,
    zpg4d: job.zpg4d,
    zpg5d: job.zpg5d,
    stdate: toDateString(job.stdate),
    findate: toDateString(job.findate),
    prdday: toNumber(job.prdday),
    steelDibId: job.steelDibId,
    steelDibDesc: job.steelDibDesc,
    steelDibLong: job.steelDibLong,
    zlmat: job.zlmat,
    zltkx: job.zltkx,
    zlg3d: job.zlg3d,
    zlg5d: job.zlg5d,
    vornr: job.vornr,
    ltxa1: job.ltxa1,
    usr00: job.usr00,
    usr02: job.usr02,
    time: job.time,
    optime: toNumber(job.optime),
    opdays: toNumber(job.opdays),
    mgvrg: job.mgvrg,
    remark: job.remark,
    priority: job.priority,
    entd: toDateString(job.entd),
    zvers: job.zvers,
    confirmYield: job.confirmYield,
    confirmHold: job.confirmHold,
    confirmScrap: job.confirmScrap,
  };
}

export async function getPlanningDashboardData(): Promise<PlanningDashboardData> {
  const jobs = await prisma.productionJob.findMany({
    orderBy: [
      { arbpl: 'asc' },
      { seqno: 'asc' },
      { sourceRow: 'asc' },
    ],
  });

  // Group jobs by Work Center (arbpl)
  const byArbpl = new Map<string, typeof jobs>();
  for (const job of jobs) {
    let list = byArbpl.get(job.arbpl);
    if (!list) {
      list = [];
      byArbpl.set(job.arbpl, list);
    }
    list.push(job);
  }

  // Sort each Work Center based on whether it has custom sequence (seqno > 0)
  const sortedJobsList: typeof jobs = [];
  const sortedArbpls = Array.from(byArbpl.keys()).sort((a, b) =>
    a.localeCompare(b, 'th', { numeric: true })
  );

  for (const arbpl of sortedArbpls) {
    const wcJobs = byArbpl.get(arbpl)!;
    const hasCustomSequence = wcJobs.some((job) => job.seqno > 0);

    if (hasCustomSequence) {
      // Sort strictly by the custom sequence saved in DB
      wcJobs.sort((a, b) => {
        if (a.seqno !== b.seqno) {
          return a.seqno - b.seqno;
        }
        return a.sourceRow - b.sourceRow;
      });
      sortedJobsList.push(...wcJobs);
    } else {
      // Default initial layout using transition sort
      const defaultSorted = sortJobsWithZpg3dTransition(wcJobs);
      sortedJobsList.push(...defaultSorted);
    }
  }

  const sortedJobs = sortedJobsList;

  const byWorkCenter = new Map<string, WorkCenterSummary & { lqSet: Set<string> }>();
  const byDay = new Map<string, DailyLoad>();

  let waitJobs = 0;
  let optime = 0;
  let opdays = 0;
  let mgvrg = 0;

  for (const job of sortedJobs) {
    const hours = toNumber(job.optime);
    const days = toNumber(job.opdays);
    const isWait = job.text1?.toUpperCase() === 'WAIT';
    const startDate = toDateString(job.stdate);
    const finishDate = toDateString(job.findate);

    waitJobs += isWait ? 1 : 0;
    optime += hours;
    opdays += days;
    mgvrg += job.mgvrg;

    const summary =
      byWorkCenter.get(job.arbpl) ??
      {
        arbpl: job.arbpl,
        jobs: 0,
        waitJobs: 0,
        optime: 0,
        opdays: 0,
        mgvrg: 0,
        lqCount: 0,
        stdate: startDate,
        findate: finishDate,
        lqSet: new Set<string>(),
      };

    summary.jobs += 1;
    summary.waitJobs += isWait ? 1 : 0;
    summary.optime += hours;
    summary.opdays += days;
    summary.mgvrg += job.mgvrg;
    summary.stdate =
      summary.stdate && startDate ? (summary.stdate < startDate ? summary.stdate : startDate) : summary.stdate ?? startDate;
    summary.findate =
      summary.findate && finishDate ? (summary.findate > finishDate ? summary.findate : finishDate) : summary.findate ?? finishDate;
    if (job.zltkx) summary.lqSet.add(job.zltkx);
    summary.lqCount = summary.lqSet.size;
    byWorkCenter.set(job.arbpl, summary);

    const key = `${dateKey(job.stdate)}|${job.arbpl}`;
    const daily =
      byDay.get(key) ??
      {
        date: dateKey(job.stdate),
        arbpl: job.arbpl,
        jobs: 0,
        waitJobs: 0,
        optime: 0,
        mgvrg: 0,
      };
    daily.jobs += 1;
    daily.waitJobs += isWait ? 1 : 0;
    daily.optime += hours;
    daily.mgvrg += job.mgvrg;
    byDay.set(key, daily);
  }

  return {
    jobs: sortedJobs.map(serializeJob),
    workCenters: Array.from(byWorkCenter.values())
      .map((summaryWithSet) => {
        const { lqSet, ...summary } = summaryWithSet;
        void lqSet;
        return {
          ...summary,
          optime: Number(summary.optime.toFixed(1)),
          opdays: Number(summary.opdays.toFixed(2)),
        };
      })
      .sort((a, b) => b.jobs - a.jobs),
    dailyLoads: Array.from(byDay.values())
      .map((load) => ({
        ...load,
        optime: Number(load.optime.toFixed(1)),
      }))
      .sort((a, b) => b.optime - a.optime)
      .slice(0, 20),
    totals: {
      jobs: sortedJobs.length,
      waitJobs,
      optime: Number(optime.toFixed(1)),
      opdays: Number(opdays.toFixed(2)),
      mgvrg,
    },
    generatedAt: new Date().toISOString(),
  };
}
