import { rowToProductionJob, type ExcelRow } from '@/lib/excel-job-mapper';
import { prisma } from '@/lib/prisma';
import { prepareImportedRows } from '@/lib/import-sequence-preservation';

type ImportChunkRequest = {
  rows?: ExcelRow[];
  startIndex?: number;
  reset?: boolean;
  preserveSequence?: boolean;
  backupId?: number;
  final?: boolean;
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

  let existingJobs: Awaited<ReturnType<typeof prisma.productionJob.findMany>> = [];
  let backupId: number | undefined = body.backupId;

  if (body.reset) {
    // Backup existing jobs before resetting the table
    existingJobs = await prisma.productionJob.findMany({
      orderBy: { id: 'asc' },
    });
    const existingCount = existingJobs.length;
    if (existingCount > 0) {
      const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
      const backup = await prisma.productionJobBackup.create({
        data: {
          versionName: `ก่อนนำเข้า Excel (${nowStr})`,
          jobsJson: existingJobs as any,
        },
      });
      backupId = backup.id;

      // Keep only the latest 3 backups and clean up older ones
      const backupsToKeep = await prisma.productionJobBackup.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true },
      });
      const keepIds = backupsToKeep.map((b) => b.id);

      await prisma.productionJobBackup.deleteMany({
        where: {
          id: { notIn: keepIds },
        },
      });
    }

    const incomingData = rows.map((row, index) => rowToProductionJob(row, startIndex + index));
    const data = body.preserveSequence
      ? prepareImportedRows(incomingData, existingJobs, Boolean(body.final))
      : incomingData;

    const [, createResult] = await prisma.$transaction([
      prisma.productionJob.deleteMany(),
      prisma.productionJob.createMany({ data }),
    ]);

    if (body.preserveSequence && body.final) {
      await normalizeImportedDatabaseQueues();
    }

    return Response.json({
      inserted: createResult.count,
      nextIndex: startIndex + rows.length,
      backupId,
    });
  }

  const incomingData = rows.map((row, index) => rowToProductionJob(row, startIndex + index));
  let data = incomingData;
  if (body.preserveSequence) {
    if (backupId) {
      const backup = await prisma.productionJobBackup.findUnique({ where: { id: backupId } });
      existingJobs = (backup?.jobsJson as unknown as Awaited<ReturnType<typeof prisma.productionJob.findMany>>) ?? [];
    } else {
      existingJobs = await prisma.productionJob.findMany({ orderBy: { id: 'asc' } });
    }
    data = prepareImportedRows(incomingData, existingJobs, false);
  }

  const result = await prisma.productionJob.createMany({ data });

  if (body.preserveSequence && body.final) {
    await normalizeImportedDatabaseQueues();
  }

  return Response.json({
    inserted: result.count,
    nextIndex: startIndex + rows.length,
    backupId,
  });
}

export async function DELETE() {
  try {
    const existingJobs = await prisma.productionJob.findMany({
      orderBy: { id: 'asc' },
    });

    if (existingJobs.length === 0) {
      await prisma.$executeRawUnsafe('ALTER TABLE `production_jobs` AUTO_INCREMENT = 1');
      return Response.json({ deleted: 0, message: 'ตาราง production_jobs ว่างอยู่แล้ว' });
    }

    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const backup = await prisma.productionJobBackup.create({
      data: {
        versionName: `ก่อนล้างตาราง production_jobs (${nowStr})`,
        jobsJson: existingJobs as any,
      },
    });

    const backupsToKeep = await prisma.productionJobBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { id: true },
    });
    await prisma.productionJobBackup.deleteMany({
      where: { id: { notIn: backupsToKeep.map((item) => item.id) } },
    });

    const result = await prisma.productionJob.deleteMany();
    await prisma.$executeRawUnsafe('ALTER TABLE `production_jobs` AUTO_INCREMENT = 1');
    return Response.json({
      deleted: result.count,
      backupId: backup.id,
      message: `ล้างตาราง production_jobs แล้ว ${result.count.toLocaleString('th-TH')} รายการ`,
    });
  } catch (error: any) {
    return Response.json({ error: error.message ?? 'ไม่สามารถล้างตาราง production_jobs ได้' }, { status: 500 });
  }
}

async function normalizeImportedDatabaseQueues() {
  const currentJobs = await prisma.productionJob.findMany({
    orderBy: [{ arbpl: 'asc' }, { sourceRow: 'asc' }],
  });
  const normalized = prepareImportedRows(
    currentJobs as any,
    currentJobs as any,
    true,
  );
  const normalizedBySourceRow = new Map(normalized.map((job) => [job.sourceRow, job]));

  const updates = currentJobs.flatMap((job) => {
    const next = normalizedBySourceRow.get(job.sourceRow);
    const nextSeqno = Number(next?.seqno ?? job.seqno ?? 0);
    const nextQueueGroup = next?.queueGroup ?? null;
    if (nextSeqno === job.seqno && nextQueueGroup === job.queueGroup) return [];

    return [prisma.productionJob.update({
      where: { id: job.id },
      data: {
        seqno: nextSeqno,
        queueGroup: nextQueueGroup,
      },
    })];
  });

  if (updates.length > 0) await prisma.$transaction(updates);
}
