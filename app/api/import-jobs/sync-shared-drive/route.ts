import { prisma } from '@/lib/prisma';
import { rowToProductionJob, type ExcelRow } from '@/lib/excel-job-mapper';
import { prepareImportedRows } from '@/lib/import-sequence-preservation';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'last-sync-log.json');
const DATABASE_CHUNK_SIZE = 1000;

type SyncProgress = {
  progress: number;
  message: string;
  importedRows?: number;
  totalRows?: number;
};

type ProgressReporter = (progress: SyncProgress) => void | Promise<void>;

async function reportProgress(reporter: ProgressReporter | undefined, progress: SyncProgress) {
  await reporter?.(progress);
}

async function performSync(report?: ProgressReporter) {
  await reportProgress(report, { progress: 2, message: 'กำลังตรวจสอบการตั้งค่า Shared Drive...' });
  const sharedPath = process.env.EXCEL_SHARED_DRIVE_PATH;
  if (!sharedPath) {
    throw new Error('ไม่ได้ตั้งค่า EXCEL_SHARED_DRIVE_PATH ใน .env');
  }

  await reportProgress(report, { progress: 6, message: 'กำลังตรวจสอบตำแหน่งไฟล์บน Shared Drive...' });
  if (!fs.existsSync(sharedPath)) {
    throw new Error(`ไม่พบไดเรกทอรี Shared Drive: ${sharedPath}`);
  }

  const stat = fs.statSync(sharedPath);
  let latestFile: { filename: string; fullPath: string; size: number; mtime: Date };

  if (stat.isFile()) {
    latestFile = {
      filename: path.basename(sharedPath),
      fullPath: sharedPath,
      size: stat.size,
      mtime: stat.mtime,
    };
  } else {
    await reportProgress(report, { progress: 10, message: 'กำลังค้นหาไฟล์ ZPP001 ล่าสุด...' });
    // Scan directory for ZPP001 files
    const files = fs.readdirSync(sharedPath);
    const sapFiles = files
      .filter((file) => {
        const lower = file.toLowerCase();
        return lower.startsWith('zpp001') && (lower.endsWith('.xlsx') || lower.endsWith('.xls'));
      })
      .map((file) => {
        const fullPath = path.join(sharedPath, file);
        const fstat = fs.statSync(fullPath);
        return {
          filename: file,
          fullPath,
          size: fstat.size,
          mtime: fstat.mtime,
        };
      });

    if (sapFiles.length === 0) {
      throw new Error(`ไม่พบไฟล์ ZPP001*.XLSX ในโฟลเดอร์: ${sharedPath}`);
    }

    // Sort by modified time descending to get the latest file
    sapFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    latestFile = sapFiles[0];
  }

  await reportProgress(report, {
    progress: 16,
    message: `พบไฟล์ล่าสุด ${latestFile.filename} กำลังอ่านไฟล์...`,
  });
  // Read the Excel file using fs.readFileSync to avoid SheetJS UNC path resolution issues
  const fileBuffer = fs.readFileSync(latestFile.fullPath);
  await reportProgress(report, { progress: 24, message: 'กำลังแปลงข้อมูลจาก Excel...' });
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '', raw: true });

  if (rows.length === 0) {
    throw new Error('ไม่พบข้อมูลแถวในไฟล์ Excel');
  }
  await reportProgress(report, {
    progress: 32,
    message: `อ่าน Excel สำเร็จ พบ ${rows.length.toLocaleString('th-TH')} แถว`,
    importedRows: 0,
    totalRows: rows.length,
  });

  // 1. Auto-Backup current jobs before deleting
  await reportProgress(report, { progress: 38, message: 'กำลังอ่านแผนปัจจุบันเพื่อสำรองข้อมูล...', importedRows: 0, totalRows: rows.length });
  const existingJobs = await prisma.productionJob.findMany({
    orderBy: { id: 'asc' },
  });
  const existingCount = existingJobs.length;
  if (existingCount > 0) {
    await reportProgress(report, { progress: 43, message: `กำลังสำรองข้อมูลเดิม ${existingCount.toLocaleString('th-TH')} รายการ...`, importedRows: 0, totalRows: rows.length });
    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    await prisma.productionJobBackup.create({
      data: {
        versionName: `ก่อนดึงอัตโนมัติ (${nowStr})`,
        jobsJson: existingJobs as unknown as Prisma.InputJsonValue,
      },
    });

    // Keep only latest 3 backups
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

  // Map rows to ProductionJob objects
  await reportProgress(report, { progress: 50, message: 'กำลังตรวจสอบและจัดเตรียมลำดับข้อมูลนำเข้า...', importedRows: 0, totalRows: rows.length });
  const incomingData = rows.map((row, index) => rowToProductionJob(row, index));
  const data = prepareImportedRows(incomingData, existingJobs, true);

  // Save atomically, but report each database chunk to the streaming client.
  let insertedCount = 0;
  await prisma.$transaction(async (transaction) => {
    await reportProgress(report, { progress: 56, message: 'กำลังเตรียมฐานข้อมูลสำหรับแผนชุดใหม่...', importedRows: 0, totalRows: rows.length });
    await transaction.productionJob.deleteMany();

    for (let startIndex = 0; startIndex < data.length; startIndex += DATABASE_CHUNK_SIZE) {
      const chunk = data.slice(startIndex, startIndex + DATABASE_CHUNK_SIZE);
      const result = await transaction.productionJob.createMany({ data: chunk });
      insertedCount += result.count;
      const databaseProgress = 58 + Math.round((insertedCount / data.length) * 32);
      await reportProgress(report, {
        progress: Math.min(90, databaseProgress),
        message: `กำลังบันทึกฐานข้อมูล ${insertedCount.toLocaleString('th-TH')} / ${data.length.toLocaleString('th-TH')} แถว`,
        importedRows: insertedCount,
        totalRows: data.length,
      });
    }
  }, { maxWait: 10_000, timeout: 120_000 });

  // Copy Excel file locally to data/excel_backups for rollback/redownload purposes
  await reportProgress(report, { progress: 94, message: 'กำลังจัดเก็บสำเนาไฟล์ Excel...', importedRows: insertedCount, totalRows: data.length });
  const localBackupFilename = `${Date.now()}_${latestFile.filename}`;
  const localBackupsDir = path.join(process.cwd(), 'data', 'excel_backups');
  if (!fs.existsSync(localBackupsDir)) {
    fs.mkdirSync(localBackupsDir, { recursive: true });
  }
  fs.copyFileSync(latestFile.fullPath, path.join(localBackupsDir, localBackupFilename));

  // Create log entry
  const logData = {
    filename: latestFile.filename,
    localBackupFilename,
    fileSize: latestFile.size,
    mtime: latestFile.mtime.toISOString(),
    syncedAt: new Date().toISOString(),
    rowCount: insertedCount,
  };

  // Ensure data folder exists
  const dataDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logData, null, 2), 'utf-8');

  await reportProgress(report, {
    progress: 100,
    message: `ซิงค์ไฟล์ ${latestFile.filename} สำเร็จ`,
    importedRows: insertedCount,
    totalRows: data.length,
  });

  return logData;
}

function getSyncErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Failed to sync shared drive';
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : '';
  if (errorCode === 'EBUSY') {
    return 'ไฟล์ Excel ถูกล็อกอยู่ (อาจเปิดค้างไว้ในโปรแกรม Excel กรุณาปิดไฟล์แล้วลองใหม่)';
  }
  if (message.includes('Cannot access file')) {
    return 'ไม่สามารถเข้าถึงไฟล์ Excel ได้ (ไฟล์อาจเปิดค้างไว้ หรือไม่มีสิทธิ์เข้าถึงเน็ตเวิร์ก)';
  }
  return message;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');

    if (trigger === 'true') {
      const key = searchParams.get('key');
      const expectedKey = process.env.SYNC_CRON_KEY || 'psc_sync_secret';
      if (key !== expectedKey) {
        return Response.json({ error: 'รหัสลับสำหรับการซิงค์ผ่าน Schedule Task ไม่ถูกต้อง' }, { status: 401 });
      }

      const logData = await performSync();
      return Response.json({
        success: true,
        message: `ซิงค์ผ่าน Cron สำเร็จ: นำเข้าไฟล์ "${logData.filename}"`,
        log: logData,
      });
    }

    // Default GET behavior: return last sync log
    if (fs.existsSync(LOG_FILE_PATH)) {
      const dataStr = fs.readFileSync(LOG_FILE_PATH, 'utf-8');
      const log = JSON.parse(dataStr);
      return Response.json({ log });
    }
    return Response.json({ log: null });
  } catch (error: unknown) {
    console.error("GET Sync Error:", error);
    return Response.json({ error: getSyncErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (request.headers.get('accept')?.includes('application/x-ndjson')) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: object) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        try {
          const logData = await performSync(async (progress) => {
            send({ type: 'progress', ...progress });
            // Yield so the runtime can flush each progress event to the browser.
            await new Promise((resolve) => setTimeout(resolve, 0));
          });
          send({
            type: 'complete',
            progress: 100,
            message: `นำเข้าไฟล์ "${logData.filename}" สำเร็จ`,
            log: logData,
          });
        } catch (error: unknown) {
          console.error('POST Sync Stream Error:', error);
          send({ type: 'error', message: getSyncErrorMessage(error) });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  try {
    const logData = await performSync();
    return Response.json({
      success: true,
      message: `นำเข้าไฟล์ "${logData.filename}" สำเร็จ`,
      log: logData,
    });
  } catch (error: unknown) {
    console.error("POST Sync Error:", error);
    return Response.json({ error: getSyncErrorMessage(error) }, { status: 500 });
  }
}
