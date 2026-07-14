import ScenarioPreviewClient from './ScenarioPreviewClient';
import { getPlanningDashboardData } from '@/lib/planning';

export const dynamic = 'force-dynamic';

const TARGET_WORK_CENTERS = new Set(['111001', '111002', '111003', '111004', '111005']);

export default async function ScenariosPage() {
  const data = await getPlanningDashboardData();
  const jobs = data.jobs.filter((job) => TARGET_WORK_CENTERS.has(job.arbpl));

  return <ScenarioPreviewClient jobs={jobs} dataGeneratedAt={data.generatedAt} />;
}
