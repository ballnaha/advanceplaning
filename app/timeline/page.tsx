import TimelineReadiness from './TimelineReadiness';
import type { TimelineOperation } from './DayTimeline';
import { getBangkokDateKey } from './date-utils';
import { getPlanningDashboardData } from '@/lib/planning';

export const dynamic = 'force-dynamic';

const TARGET_WORK_CENTERS = ['111001', '111002', '111003', '111004', '111005'] as const;

function percentage(part: number, total: number) {
  return total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0;
}

export default async function TimelinePage() {
  const data = await getPlanningDashboardData();
  const jobs = data.jobs.filter((job) => TARGET_WORK_CENTERS.includes(job.arbpl as typeof TARGET_WORK_CENTERS[number]));
  const currentYear = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
  }).format(new Date()));
  const datedJobs = jobs.filter((job) => job.stdate && job.findate);
  const jobsWithOpTime = jobs.filter((job) => job.optime > 0);
  const currentYearJobs = jobs.filter((job) => job.stdate?.startsWith(String(currentYear)));
  const dates = jobs.flatMap((job) => [job.stdate, job.findate].filter((value): value is string => Boolean(value))).sort();

  const summary = {
    operations: jobs.length,
    orders: new Set(jobs.map((job) => job.aufnr)).size,
    dateCoverage: percentage(datedJobs.length, jobs.length),
    opTimeCoverage: percentage(jobsWithOpTime.length, jobs.length),
    missingOpTime: jobs.length - jobsWithOpTime.length,
    currentYearOperations: currentYearJobs.length,
    legacyOperations: jobs.length - currentYearJobs.length,
    firstDate: dates[0] ?? null,
    lastDate: dates.at(-1) ?? null,
  };

  const workCenters = TARGET_WORK_CENTERS.map((workCenter) => {
    const scopedJobs = jobs.filter((job) => job.arbpl === workCenter);
    const scopedDatedJobs = scopedJobs.filter((job) => job.stdate && job.findate);
    const scopedJobsWithTime = scopedJobs.filter((job) => job.optime > 0);
    return {
      workCenter,
      operations: scopedJobs.length,
      orders: new Set(scopedJobs.map((job) => job.aufnr)).size,
      totalHours: Number(scopedJobs.reduce((sum, job) => sum + job.optime, 0).toFixed(1)),
      dateCoverage: percentage(scopedDatedJobs.length, scopedJobs.length),
      opTimeCoverage: percentage(scopedJobsWithTime.length, scopedJobs.length),
    };
  });
  const timelineOperations: TimelineOperation[] = datedJobs.map((job) => ({
    id: job.id,
    workCenter: job.arbpl,
    order: job.aufnr,
    operation: job.vornr ?? '',
    description: job.ltxa1 ?? '',
    startDate: job.stdate!,
    finishDate: job.findate!,
    opTime: job.optime,
    quantity: job.mgvrg,
    status: job.text1?.trim().toUpperCase() || 'NOT START',
    sequence: job.seqno,
  }));

  return (
    <TimelineReadiness
      generatedAt={data.generatedAt}
      initialDate={getBangkokDateKey()}
      operations={timelineOperations}
      summary={summary}
      workCenters={workCenters}
    />
  );
}
