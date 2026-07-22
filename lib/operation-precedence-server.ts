import { prisma } from './prisma';
import {
  findOperationPrecedenceViolation,
  formatOperationPrecedenceError,
  type OperationPrecedenceViolation,
} from './operation-precedence';

type ScheduleUpdate = {
  id: number;
  seqno?: number;
  arbpl?: string;
  stdate?: string | null;
};

export async function validateOperationPrecedenceUpdate(items: ScheduleUpdate[]): Promise<{
  error: string;
  violation: OperationPrecedenceViolation;
} | null> {
  const identities = await prisma.productionJob.findMany({
    where: { id: { in: items.map((item) => item.id) } },
    select: { aufnr: true },
  });
  const orders = Array.from(new Set(identities.map((job) => job.aufnr)));
  if (orders.length === 0) return null;

  const relatedJobs = await prisma.productionJob.findMany({
    where: { aufnr: { in: orders } },
    select: {
      id: true,
      aufnr: true,
      vornr: true,
      arbpl: true,
      stdate: true,
      seqno: true,
    },
  });
  const updateById = new Map(items.map((item) => [item.id, item]));
  const candidateJobs = relatedJobs.map((job) => {
    const update = updateById.get(job.id);
    return {
      ...job,
      arbpl: update?.arbpl?.trim() || job.arbpl,
      stdate: update?.stdate !== undefined
        ? (update.stdate ? new Date(`${update.stdate}T00:00:00Z`) : null)
        : job.stdate,
      seqno: update?.seqno ?? job.seqno,
    };
  });

  const violation = findOperationPrecedenceViolation(candidateJobs);
  return violation
    ? { error: formatOperationPrecedenceError(violation), violation }
    : null;
}
