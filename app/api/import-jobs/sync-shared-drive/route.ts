import { prisma } from '@/lib/prisma';
import { rowToProductionJob } from '@/lib/excel-job-mapper';
import { prepareImportedRows } from '@/lib/import-sequence-preservation';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'last-sync-log.json');

async function performSync() {
  const sharedPath = process.env.EXCEL_SHARED_DRIVE_PATH;
  if (!sharedPath) {
    throw new Error('ไม่ได้ตั้งค่า EXCEL_SHARED_DRIVE_PATH ใน .env');
  }

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

  // Read the Excel file using fs.readFileSync to avoid SheetJS UNC path resolution issues
  const fileBuffer = fs.readFileSync(latestFile.fullPath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: true });

  if (rows.length === 0) {
    throw new Error('ไม่พบข้อมูลแถวในไฟล์ Excel');
  }

  // 1. Auto-Backup current jobs before deleting
  const existingJobs = await prisma.productionJob.findMany({
    orderBy: { id: 'asc' },
  });
  const existingCount = existingJobs.length;
  if (existingCount > 0) {
    const nowStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    await prisma.productionJobBackup.create({
      data: {
        versionName: `ก่อนดึงอัตโนมัติ (${nowStr})`,
        jobsJson: existingJobs as any,
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
  const incomingData = rows.map((row, index) => rowToProductionJob(row, index));
  const data = prepareImportedRows(incomingData, existingJobs, true);

  // Save in transaction
  const [, createResult] = await prisma.$transaction([
    prisma.productionJob.deleteMany(),
    prisma.productionJob.createMany({ data }),
  ]);

  // Copy Excel file locally to data/excel_backups for rollback/redownload purposes
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
    rowCount: createResult.count,
  };

  // Ensure data folder exists
  const dataDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logData, null, 2), 'utf-8');

  return logData;
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
  } catch (error: any) {
    console.error("GET Sync Error:", error);
    let msg = error.message ?? 'Failed to check sync status';
    if (error.code === 'EBUSY') {
      msg = 'ไฟล์ Excel ถูกล็อกอยู่ (อาจเปิดค้างไว้ในโปรแกรม Excel)';
    } else if (msg.includes('Cannot access file')) {
      msg = 'ไม่สามารถเข้าถึงไฟล์ Excel ได้ (ไฟล์อาจเปิดค้างไว้ หรือไม่มีสิทธิ์เข้าถึงเน็ตเวิร์ก)';
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST() {
  try {
    const logData = await performSync();
    return Response.json({
      success: true,
      message: `นำเข้าไฟล์ "${logData.filename}" สำเร็จ`,
      log: logData,
    });
  } catch (error: any) {
    console.error("POST Sync Error:", error);
    let msg = error.message ?? 'Failed to sync shared drive';
    if (error.code === 'EBUSY') {
      msg = 'ไฟล์ Excel ถูกล็อกอยู่ (อาจเปิดค้างไว้ในโปรแกรม Excel กรุณาปิดไฟล์แล้วลองใหม่)';
    } else if (msg.includes('Cannot access file')) {
      msg = 'ไม่สามารถเข้าถึงไฟล์ Excel ได้ (ไฟล์อาจเปิดค้างไว้ หรือไม่มีสิทธิ์เข้าถึงเน็ตเวิร์ก)';
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
