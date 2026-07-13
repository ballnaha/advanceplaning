import PlanningDashboard from './components/PlanningDashboard';
import { getPlanningDashboardData } from '@/lib/planning';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getPlanningDashboardData();

  return <PlanningDashboard data={data} />;
}
