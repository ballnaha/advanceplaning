import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const formatDate = (date: Date | null) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const formatBangkokDateTime = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';

  return `${value('day')}/${value('month')}/${value('year')} ${value('hour')}:${value('minute')}`;
};

const toIsoDate = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderSearch = searchParams.get('orderSearch') || '';
    const year = searchParams.get('year') || 'ALL';
    const month = searchParams.get('month') || 'ALL';
    const statuses = searchParams.get('statuses') || '';
    const workCenter = searchParams.get('workCenter') || '';
    const dateStart = searchParams.get('dateStart') || '';
    const dateEnd = searchParams.get('dateEnd') || '';

    // Fetch all jobs from DB
    const jobs = await prisma.productionJob.findMany({
      orderBy: [
        { arbpl: 'asc' },
        { seqno: 'asc' },
      ],
    });

    const TARGET_WORK_CENTER_IDS = new Set(['111001', '111002', '111003', '111004', '111005']);
    const statusSet = statuses ? new Set(statuses.split(',')) : null;
    const getStatusLabel = (val: string | null) => val?.trim().toUpperCase() || 'NOT START';

    // Apply filters identically to client-side logic
    const filteredJobs = jobs.filter((job) => {
      // 1. Work Center filtering
      if (workCenter) {
        if (job.arbpl !== workCenter) return false;
      } else {
        if (!TARGET_WORK_CENTER_IDS.has(job.arbpl)) return false;
      }

      // 2. Search query filtering
      if (orderSearch) {
        const normalizedSearch = orderSearch.trim().toUpperCase();
        if (!job.aufnr.toUpperCase().includes(normalizedSearch)) {
          return false;
        }
      }

      // 3. Year/Month filtering using UTC to match toDateString() formatting
      if (year !== 'ALL' || month !== 'ALL') {
        const jobStart = job.stdate;
        if (!jobStart) return false;
        
        const jobYear = jobStart.getUTCFullYear();
        const jobMonth = jobStart.getUTCMonth() + 1;

        if (year !== 'ALL' && jobYear !== Number(year)) return false;
        if (month !== 'ALL' && jobMonth !== Number(month)) return false;
      }

      // 4. Timeline date range: include jobs that overlap the visible period.
      if (dateStart || dateEnd) {
        const jobStartDate = toIsoDate(job.stdate);
        const jobFinishDate = toIsoDate(job.findate) ?? jobStartDate;
        if (!jobStartDate || !jobFinishDate) return false;
        if (dateStart && jobFinishDate < dateStart) return false;
        if (dateEnd && jobStartDate > dateEnd) return false;
      }

      // 5. Status filtering
      if (statusSet) {
        const statusLabel = getStatusLabel(job.text1);
        if (!statusSet.has(statusLabel)) {
          return false;
        }
      }

      return true;
    });

    // Initialize Excel Workbook
    const workbook = XLSX.utils.book_new();

    // ==========================================
    // SHEET 1: ภาพรวมแผนผลิต (Overview Dashboard)
    // ==========================================
    const totalJobs = filteredJobs.length;
    const totalQty = filteredJobs.reduce((sum, j) => sum + j.mgvrg, 0);
    const totalOptime = Number(filteredJobs.reduce((sum, j) => sum + Number(j.optime || 0), 0).toFixed(1));

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const activeFilterParts: string[] = [];
    if (year !== 'ALL') activeFilterParts.push(`ปีผลิต: ${year}`);
    if (month !== 'ALL') {
      const mIndex = Number(month) - 1;
      activeFilterParts.push(`เดือนผลิต: ${thaiMonths[mIndex] || month}`);
    }
    if (workCenter) activeFilterParts.push(`เครื่องจักร: WC ${workCenter}`);
    if (orderSearch) activeFilterParts.push(`คำค้นหา: "${orderSearch}"`);
    if (statuses) activeFilterParts.push(`สถานะ: ${statuses}`);
    if (dateStart || dateEnd) activeFilterParts.push(`ช่วงแผน: ${dateStart || '...'} ถึง ${dateEnd || '...'}`);

    const activeFiltersString = activeFilterParts.length > 0 ? activeFilterParts.join(' | ') : 'แสดงทั้งหมด (ไม่มีการกรอง)';

    const overviewAOA = [
      ['สรุปภาพรวมแผนงานการผลิต (Production Planning Summary)'],
      [`วันเวลาส่งออกรายงาน: ${formatBangkokDateTime(new Date())} น.`],
      [`ตัวกรองข้อมูลที่เปิดใช้งาน: ${activeFiltersString}`],
      [],
      ['จำนวนงานทั้งหมด (Total Jobs)', `${totalJobs} งาน`],
      ['กำลังผลิตชิ้นงานรวม (Total Order Qty)', `${totalQty.toLocaleString('th-TH')} ชิ้น`],
      ['เวลาทำงานรวมจริง (Total Operation Time)', `${totalOptime.toLocaleString('th-TH')} ชั่วโมง`],
      [],
      ['รายละเอียดสรุปย่อยรายเครื่องจักร (Work Center Breakdowns)'],
      ['รหัสเครื่องจักร ("Work Center")', 'จำนวนงาน (Jobs count)', 'กำลังผลิตรวม (Total Qty)', 'ชั่วโมงดำเนินการรวม (Total Op-Time)']
    ];

    // Calculate per-machine stats
    const machineStatsMap = new Map<string, { jobsCount: number; qty: number; optime: number }>();
    for (const job of filteredJobs) {
      const current = machineStatsMap.get(job.arbpl) || { jobsCount: 0, qty: 0, optime: 0 };
      current.jobsCount += 1;
      current.qty += job.mgvrg;
      current.optime += Number(job.optime || 0);
      machineStatsMap.set(job.arbpl, current);
    }

    const sortedMachineStats = Array.from(machineStatsMap.entries()).sort((a, b) => a[0].localeCompare(b[0], 'th', { numeric: true }));

    for (const [arbpl, stats] of sortedMachineStats) {
      overviewAOA.push([
        `เครื่อง ${arbpl}`,
        `${stats.jobsCount} งาน`,
        `${stats.qty.toLocaleString('th-TH')} ชิ้น`,
        `${Number(stats.optime.toFixed(1)).toLocaleString('th-TH')} ชั่วโมง`
      ]);
    }

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewAOA);

    // Auto-fit overview width
    const maxCols = overviewAOA.reduce((max, row) => Math.max(max, row.length), 0);
    const overviewColWidths = Array.from({ length: maxCols }, (_, colIndex) => {
      let maxLen = 0;
      for (const row of overviewAOA) {
        const val = row[colIndex];
        if (val !== undefined && val !== null) {
          maxLen = Math.max(maxLen, String(val).length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 60) };
    });
    overviewSheet['!cols'] = overviewColWidths;
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'ภาพรวมแผนผลิต');

    // ==========================================
    // HELPERS: Mapping and Autowidth for Tables
    // ==========================================
    const mapJobToExcelRow = (job: typeof jobs[number]) => ({
      // 1. Core Scheduling Info
      SEQNO: job.seqno,
      ARBPL: job.arbpl,
      STDATE: formatDate(job.stdate),
      FINDATE: formatDate(job.findate),
      AUFNR: job.aufnr,
      TEXT1: job.text1 || '',

      // 2. Product Details
      ZPMAT: job.zpmat || '',
      ZPTKX: job.zptkx || '',
      ZPTXT: job.zptxt || '',
      ZVERS: job.zvers || '',

      // 3. Queue & Grouping Attributes
      QUEUE_GROUP: job.queueGroup || '',
      PRIORITY: job.priority || '',
      REMARK: job.remark || '',

      // 4. Operation & Production Metrics
      VORNR: job.vornr || '',
      LTXA1: job.ltxa1 || '',
      PRDDAY: job.prdday ? Number(job.prdday) : 0,
      OPTIME: job.optime ? Number(job.optime) : 0,
      OPDAYS: job.opdays ? Number(job.opdays) : 0,
      MGVRG: job.mgvrg,

      // 5. Steel Details
      STEEL_DIB_ID: job.steelDibId || '',
      STEEL_DIB_DESC: job.steelDibDesc || '',
      STEEL_DIB_LONG: job.steelDibLong || '',
      ZLMAT: job.zlmat || '',
      ZLTKX: job.zltkx || '',
      ZLG3D: job.zlg3d || '',
      ZLG5D: job.zlg5d || '',

      // 6. SAP User Fields & Parameters
      USR00: job.usr00 || '',
      USR02: job.usr02 || '',
      TIME: job.time || '',
      ENTD: formatDate(job.entd),

      // 7. Original Excel Plan Info
      EXCEL_SEQNO: job.excelSeqno || 0,
      EXCEL_ARBPL: job.excelArbpl || '',
      EXCEL_STDATE: formatDate(job.excelStdate),
      EXCEL_FINDATE: formatDate(job.excelFindate),

      // 8. Confirmation Progress
      CONFIRM_YIELD: job.confirmYield,
      CONFIRM_HOLD: job.confirmHold,
      CONFIRM_SCRAP: job.confirmScrap,

      // 9. Metadata System Fields
      SOURCE_ROW: job.sourceRow,
      CREATED_AT: formatDate(job.createdAt),
      UPDATED_AT: formatDate(job.updatedAt),
    });

    const autoFitTableWidths = (worksheet: any, rows: any[]) => {
      const colWidths = Object.keys(rows[0] || {}).map((key) => {
        let maxLen = key.length;
        for (const row of rows) {
          const val = row[key];
          if (val !== undefined && val !== null) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        }
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
      });
      worksheet['!cols'] = colWidths;
    };

    // ==========================================
    // SHEET 2: แผนหลักเรียงลำดับ (Master Schedule)
    // ==========================================
    const masterRows = filteredJobs.map(mapJobToExcelRow);
    const masterSheet = XLSX.utils.json_to_sheet(masterRows);
    autoFitTableWidths(masterSheet, masterRows);
    XLSX.utils.book_append_sheet(workbook, masterSheet, 'แผนหลักเรียงลำดับ');

    // ==========================================
    // SHEETS 3+: แยกชีตรายเครื่องจักร (Per Work Center)
    // ==========================================
    const uniqueMachines = Array.from(new Set(filteredJobs.map((j) => j.arbpl))).sort();
    
    for (const machine of uniqueMachines) {
      const machineJobs = filteredJobs.filter((j) => j.arbpl === machine);
      const machineRows = machineJobs.map(mapJobToExcelRow);
      
      const machineSheet = XLSX.utils.json_to_sheet(machineRows);
      autoFitTableWidths(machineSheet, machineRows);
      
      // Excel limits worksheet tab names to 31 characters.
      // "เครื่อง 111001" is ~14 characters, perfectly compliant.
      XLSX.utils.book_append_sheet(workbook, machineSheet, `เครื่อง ${machine}`);
    }

    // Generate output file buffer
    const fileBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const headers = new Headers();
    headers.set('Content-Disposition', 'attachment; filename="production_plan_export.xlsx"');
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return new NextResponse(fileBuffer, { headers });
  } catch (error: any) {
    return Response.json({ error: error.message ?? 'Failed to export excel file' }, { status: 500 });
  }
}
