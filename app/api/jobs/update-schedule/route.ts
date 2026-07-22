import { prisma } from '@/lib/prisma';
import { validateOperationPrecedenceUpdate } from '@/lib/operation-precedence-server';

type ScheduleUpdateItem = {
  id: number;
  stdate: string | null;
  findate: string | null;
  arbpl: string;
  seqno?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: ScheduleUpdateItem[] };
    const items = body.items ?? [];

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'items is required' }, { status: 400 });
    }

    const precedenceValidation = await validateOperationPrecedenceUpdate(items);
    if (precedenceValidation) {
      return Response.json(precedenceValidation, { status: 409 });
    }

    const params: Array<number | string | null> = [];
    let sql = 'UPDATE production_jobs SET ';

    // stdate CASE
    sql += 'stdate = CASE id ';
    for (const item of items) {
      sql += 'WHEN ? THEN ? ';
      params.push(item.id, item.stdate);
    }
    sql += 'END';

    // findate CASE
    sql += ', findate = CASE id ';
    for (const item of items) {
      sql += 'WHEN ? THEN ? ';
      params.push(item.id, item.findate);
    }
    sql += 'END';

    // arbpl CASE
    sql += ', arbpl = CASE id ';
    for (const item of items) {
      sql += 'WHEN ? THEN ? ';
      params.push(item.id, item.arbpl.trim());
    }
    sql += 'END';

    // seqno CASE
    const hasSeqno = items.some((item) => item.seqno !== undefined);
    if (hasSeqno) {
      sql += ', seqno = CASE id ';
      for (const item of items) {
        sql += 'WHEN ? THEN ? ';
        params.push(item.id, item.seqno ?? 1);
      }
      sql += 'END';
    }

    // WHERE clause
    sql += ' WHERE id IN (';
    sql += items.map(() => '?').join(',');
    sql += ')';

    for (const item of items) {
      params.push(item.id);
    }

    await prisma.$executeRawUnsafe(sql, ...params);

    return Response.json({ updated: items.length });
  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
