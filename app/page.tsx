import PlanningDashboard from './components/PlanningDashboard';
import { getPlanningDashboardData } from '@/lib/planning';

export const dynamic = 'force-dynamic';

function getBangkokYearMonth() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
}

export default async function Home() {
  const data = await getPlanningDashboardData();
  const { year, month } = getBangkokYearMonth();

  return <PlanningDashboard data={data} initialYear={year} initialMonth={month} />;
}
