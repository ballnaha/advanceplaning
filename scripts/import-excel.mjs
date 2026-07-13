import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

const excelPath = process.env.EXCEL_IMPORT_PATH || 'C:\\Users\\Thanya\\Desktop\\ZPP001_20260529_123011111.XLSX';

function text(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function number(value) {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function int(value) {
  return Math.trunc(number(value));
}

function excelDate(value) {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function rowToJob(row, index) {
  const sourceRow = index + 2;

  return {
    sourceRow,
    seqno: int(row.SEQNO),
    arbpl: text(row.ARBPL) || 'UNKNOWN',
    aufnr: text(row.AUFNR) || `ROW-${sourceRow}`,
    text1: text(row.TEXT1),
    zpmat: text(row.ZPMAT),
    zptkx: text(row.ZPTKX),
    zptxt: text(row.ZPTXT),
    zpg1d: text(row.ZPG1D),
    zpg2d: text(row.ZPG2D),
    zpg3d: text(row.ZPG3D),
    zpg4d: text(row.ZPG4D),
    zpg5d: text(row.ZPG5D),
    stdate: excelDate(row.STDATE),
    findate: excelDate(row.FINDATE),
    prdday: number(row.PRDDAY),
    steelDibId: text(row.STEEL_DIB_ID),
    steelDibDesc: text(row.STEEL_DIB_DESC),
    steelDibLong: text(row.STEEL_DIB_LONG),
    zlmat: text(row.ZLMAT),
    zltkx: text(row.ZLTKX),
    zlg3d: text(row.ZLG3D),
    zlg5d: text(row.ZLG5D),
    vornr: text(row.VORNR),
    ltxa1: text(row.LTXA1),
    usr00: text(row.USR00),
    usr02: text(row.USR02),
    time: text(row.TIME),
    optime: number(row.OPTIME),
    opdays: number(row.OPDAYS),
    mgvrg: int(row.MGVRG),
    remark: text(row.REMARK),
    priority: text(row.PRIORITY),
    entd: excelDate(row.ENTD),
    zvers: text(row.ZVERS),
    confirmYield: int(row.CONFIRM_YIELD),
    confirmHold: int(row.CONFIRM_HOLD),
    confirmScrap: int(row.CONFIRM_SCRAP),
  };
}

async function main() {
  const workbook = XLSX.readFile(excelPath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const jobs = rows.map(rowToJob);

  await prisma.productionJob.deleteMany();

  for (let i = 0; i < jobs.length; i += 100) {
    await prisma.productionJob.createMany({
      data: jobs.slice(i, i + 100),
    });
  }

  const workCenters = await prisma.productionJob.groupBy({
    by: ['arbpl'],
    _count: { _all: true },
    _sum: { optime: true, mgvrg: true },
    orderBy: { _count: { arbpl: 'desc' } },
  });

  console.log(`Imported ${jobs.length} rows from ${excelPath}`);
  console.table(
    workCenters.map((item) => ({
      workCenter: item.arbpl,
      jobs: item._count._all,
      hours: item._sum.optime?.toString() || '0',
      quantity: item._sum.mgvrg || 0,
    })),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
