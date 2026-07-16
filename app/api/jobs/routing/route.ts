import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PlanningJob } from '@/lib/planning';

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toDateString(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const aufnr = searchParams.get('aufnr');

  if (!aufnr) {
    return Response.json({ error: 'aufnr is required' }, { status: 400 });
  }

  const jobs = await prisma.productionJob.findMany({
    where: { aufnr },
    orderBy: { vornr: 'asc' },
  });

  const serializedJobs: PlanningJob[] = jobs.map((job) => ({
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
    queueGroup: job.queueGroup,
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
  }));

  return Response.json(serializedJobs);
}
