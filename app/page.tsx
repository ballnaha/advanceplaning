import { Suspense } from 'react';
import PlanningDashboard from './components/PlanningDashboard';
import { DashboardSkeleton } from './components/Skeletons';
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

export default function Home() {
  const { year, month } = getBangkokYearMonth();

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContainer initialYear={year} initialMonth={month} />
    </Suspense>
  );
}

async function DashboardContainer({ initialYear, initialMonth }: { initialYear: number; initialMonth: number }) {
  const data = await getPlanningDashboardData();
  return <PlanningDashboard data={data} initialYear={initialYear} initialMonth={initialMonth} />;
}
