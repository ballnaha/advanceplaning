import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const latestBackups = await prisma.productionJobBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        versionName: true,
        createdAt: true,
      },
    });

    return Response.json({ latestBackups });
  } catch (error: any) {
    return Response.json({ error: error.message ?? 'Failed to check backups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let backupId: number | undefined;
    try {
      const body = await request.json();
      backupId = body.backupId;
    } catch (e) {
      // Ignore parser error, default to latest backup
    }

    let targetBackup;
    if (backupId) {
      targetBackup = await prisma.productionJobBackup.findUnique({
        where: { id: backupId },
      });
    } else {
      targetBackup = await prisma.productionJobBackup.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!targetBackup) {
      return Response.json({ error: 'ไม่พบประวัติสำรองข้อมูลแผนงานที่ต้องการ' }, { status: 404 });
    }

    const rawJobs = targetBackup.jobsJson as any[];

    // Parse serialized string dates back into proper JavaScript Date objects
    const parsedJobs = rawJobs.map((job) => ({
      ...job,
      stdate: job.stdate ? new Date(job.stdate) : null,
      findate: job.findate ? new Date(job.findate) : null,
      entd: job.entd ? new Date(job.entd) : null,
      excelStdate: job.excelStdate ? new Date(job.excelStdate) : null,
      excelFindate: job.excelFindate ? new Date(job.excelFindate) : null,
      createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
      updatedAt: job.updatedAt ? new Date(job.updatedAt) : new Date(),
    }));

    // Restore jobs in a single transaction
    await prisma.$transaction([
      prisma.productionJob.deleteMany(),
      prisma.productionJob.createMany({ data: parsedJobs }),
    ]);

    return Response.json({
      success: true,
      message: `คืนค่าแผนงานสำเร็จย้อนกลับไปเวอร์ชัน "${targetBackup.versionName}"`,
      versionName: targetBackup.versionName,
      count: parsedJobs.length,
    });
  } catch (error: any) {
    return Response.json({ error: error.message ?? 'Failed to restore backup' }, { status: 500 });
  }
}
