import { prisma } from '@/lib/prisma';

type ResequenceItem = {
  id: number;
  seqno: number;
  zpg1d?: string | null;
  arbpl?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as { items?: ResequenceItem[] };
  const items = body.items ?? [];

  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'items is required' }, { status: 400 });
  }

  const params: Array<number | string | null> = [];
  let sql = 'UPDATE production_jobs SET ';

  // Build seqno CASE
  sql += 'seqno = CASE id ';
  for (const item of items) {
    sql += 'WHEN ? THEN ? ';
    params.push(item.id, item.seqno);
  }
  sql += 'END';

  // Build zpg1d CASE
  const hasZpg1d = items.some((item) => item.zpg1d !== undefined);
  if (hasZpg1d) {
    sql += ', zpg1d = CASE id ';
    for (const item of items) {
      sql += 'WHEN ? THEN ? ';
      params.push(item.id, item.zpg1d ?? null);
    }
    sql += 'END';
  }

  // Persist cross-work-center moves made on the routing board.
  const hasArbpl = items.some((item) => item.arbpl !== undefined);
  if (hasArbpl) {
    if (items.some((item) => !item.arbpl?.trim())) {
      return Response.json({ error: 'arbpl must not be empty' }, { status: 400 });
    }

    sql += ', arbpl = CASE id ';
    for (const item of items) {
      sql += 'WHEN ? THEN ? ';
      params.push(item.id, item.arbpl!.trim());
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
}
