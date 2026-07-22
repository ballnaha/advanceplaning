import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return Response.json({ error: 'ไม่พบระบุชื่อไฟล์สำหรับดาวน์โหลด' }, { status: 400 });
    }

    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'data', 'excel_backups', safeFilename);

    if (!fs.existsSync(filePath)) {
      return Response.json({ error: 'ไม่พบไฟล์ Excel สำรองในเซิร์ฟเวอร์' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Clean timestamp prefix (e.g. 1721280000000_ZPP001.XLSX -> ZPP001.XLSX)
    const underscoreIndex = safeFilename.indexOf('_');
    const originalName = underscoreIndex !== -1 ? safeFilename.substring(underscoreIndex + 1) : safeFilename;

    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return new NextResponse(fileBuffer, { headers });
  } catch (error: any) {
    return Response.json({ error: error.message ?? 'Failed to download file' }, { status: 500 });
  }
}
