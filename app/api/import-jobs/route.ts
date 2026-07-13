import { rowToProductionJob, type ExcelRow } from '@/lib/excel-job-mapper';
import { prisma } from '@/lib/prisma';

type ImportChunkRequest = {
  rows?: ExcelRow[];
  startIndex?: number;
  reset?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ImportChunkRequest;
  const rows = body.rows ?? [];
  const startIndex = body.startIndex ?? 0;

  if (!Array.isArray(rows)) {
    return Response.json({ error: 'rows must be an array' }, { status: 400 });
  }

  if (!Number.isInteger(startIndex) || startIndex < 0) {
    return Response.json({ error: 'startIndex must be a positive integer' }, { status: 400 });
  }

  if (rows.length === 0) {
    return Response.json({ inserted: 0 });
  }

  const data = rows.map((row, index) => rowToProductionJob(row, startIndex + index));

  if (body.reset) {
    const [, createResult] = await prisma.$transaction([
      prisma.productionJob.deleteMany(),
      prisma.productionJob.createMany({ data }),
    ]);

    return Response.json({
      inserted: createResult.count,
      nextIndex: startIndex + rows.length,
    });
  }

  const result = await prisma.productionJob.createMany({ data });

  return Response.json({
    inserted: result.count,
    nextIndex: startIndex + rows.length,
  });
}
