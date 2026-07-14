export const ZPG1D_GROUPS = [
  {
    id: 'tinplate',
    label: 'เหล็กอาบปี๊บ',
    colorAccent: '#4f46e5', // Indigo
  },
  {
    id: 'three_piece',
    label: 'เหล็กอาบ 3-Piece',
    colorAccent: '#0891b2', // Cyan
  },
  {
    id: 'ne',
    label: 'เหล็กอาบ NE',
    colorAccent: '#d97706', // Amber
  },
  {
    id: 'drd',
    label: 'เหล็กอาบ DRD',
    colorAccent: '#e11d48', // Rose
  },
  {
    id: 'eoe',
    label: 'เหล็กอาบ EOE',
    colorAccent: '#059669', // Emerald
  },
] as const;

export function getJobGroupId(zpg1d: string | null): typeof ZPG1D_GROUPS[number]['id'] {
  const val = zpg1d?.trim() || '';
  if (val === 'เหล็กอาบปี๊บ') return 'tinplate';
  if (val === 'เหล็กอาบ 3-Piece') return 'three_piece';
  if (val === 'เหล็กอาบ NE' || val.includes('NE')) return 'ne';
  if (val === 'เหล็กอาบ DRD' || val.includes('DRD')) return 'drd';
  if (val === 'เหล็กอาบ EOE' || val.includes('EOE')) return 'eoe';
  return 'ne'; // Default fallback
}

export function getJobGroupSortOrder(zpg1d: string | null): number {
  const groupId = getJobGroupId(zpg1d);
  if (groupId === 'tinplate') return 1;
  if (groupId === 'three_piece') return 2;
  if (groupId === 'ne') return 3;
  if (groupId === 'drd') return 4;
  if (groupId === 'eoe') return 5;
  return 3;
}

type QueueGroupJob = {
  zpg1d: string | null;
  queueGroup?: string | null;
};

export function getQueueGroupId(job: QueueGroupJob): typeof ZPG1D_GROUPS[number]['id'] {
  return getJobGroupId(job.queueGroup?.trim() || job.zpg1d);
}

export function getQueueGroupSortOrder(job: QueueGroupJob): number {
  return getJobGroupSortOrder(job.queueGroup?.trim() || job.zpg1d);
}

export function isQueueGroupOverride(job: QueueGroupJob): boolean {
  return Boolean(job.queueGroup?.trim()) && getQueueGroupId(job) !== getJobGroupId(job.zpg1d);
}

export function cleanZpg2d(zpg2d: string | null): string {
  if (!zpg2d) return '';
  const trimmed = zpg2d.trim();
  const parts = trimmed.split(/[xX]/);
  if (parts.length >= 3) {
    return parts.slice(1).join('x');
  }
  return trimmed;
}

export interface SortableJob {
  arbpl: string;
  zpg1d: string | null;
  queueGroup?: string | null;
  zpg2d: string | null;
  zpg3d: string | null;
  vornr?: string | null;
  zlmat?: string | null;
  stdate: string | Date | null;
  findate?: string | Date | null;
  seqno: number | null;
  sourceRow: number;
}

export function sortJobsWithZpg3dTransition<T extends SortableJob>(
  jobsList: T[],
  options?: {
    prioritizeUrgent?: boolean;
  }
): T[] {
  const isUrgent = (findateStr: string | null) => {
    if (!findateStr || findateStr === '9999-12-31') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const parts = findateStr.split('-');
    if (parts.length !== 3) return false;
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);
    const finishDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    
    const diffMs = finishDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / 86_400_000);
    const inclusiveDays = diffDays + 1;
    
    return inclusiveDays <= 3;
  };

  const getJobDueDateStr = (job: T): string => {
    const st = job.stdate ? (job.stdate instanceof Date ? job.stdate.toISOString().slice(0, 10) : String(job.stdate)) : null;
    const fin = job.findate ? (job.findate instanceof Date ? job.findate.toISOString().slice(0, 10) : String(job.findate)) : null;
    return fin || st || '9999-12-31';
  };

  const getJobStartDateStr = (job: T): string => {
    if (!job.stdate) return '9999-12-31';
    return job.stdate instanceof Date ? job.stdate.toISOString().slice(0, 10) : String(job.stdate);
  };

  const materialGroupText = (value: string | null) => value?.trim() || 'ไม่ระบุ';

  if (options?.prioritizeUrgent) {
    // Establish the normal production sequence once. Urgent promotion must be
    // stable so jobs with the same Finish Date keep their setup-efficient order.
    const baseSortedJobs = sortJobsWithZpg3dTransition(jobsList, { prioritizeUrgent: false });
    const urgentJobs: T[] = [];
    const normalJobs: T[] = [];

    for (const job of baseSortedJobs) {
      const fin = job.findate ? (job.findate instanceof Date ? job.findate.toISOString().slice(0, 10) : String(job.findate)) : null;
      if (isUrgent(fin)) {
        urgentJobs.push(job);
      } else {
        normalJobs.push(job);
      }
    }

    // Group by Finish Date. Insertion order within the same date comes directly
    // from baseSortedJobs, so color/LQ continuity is not recalculated or reset.
    const urgentByDate: Record<string, T[]> = {};
    for (const job of urgentJobs) {
      const dateKey = getJobDueDateStr(job);
      urgentByDate[dateKey] ??= [];
      urgentByDate[dateKey].push(job);
    }
    const sortedUrgentDates = Object.keys(urgentByDate).sort();
    const sortedUrgentJobs: T[] = [];
    for (const d of sortedUrgentDates) {
      sortedUrgentJobs.push(...urgentByDate[d]);
    }

    return [...sortedUrgentJobs, ...normalJobs];
  }

  // Group by arbpl first
  const byArbpl: Record<string, T[]> = {};
  for (const job of jobsList) {
    byArbpl[job.arbpl] ??= [];
    byArbpl[job.arbpl].push(job);
  }

  const sortedArbpls = Object.keys(byArbpl).sort((a, b) =>
    a.localeCompare(b, 'th', { numeric: true })
  );

  const result: T[] = [];

  for (const arbpl of sortedArbpls) {
    const wcJobs = byArbpl[arbpl];

    // Group by queue group, falling back to the original material group.
    const byZpg1d: Record<string, T[]> = {};
    for (const job of wcJobs) {
      const zpg1dKey = job.queueGroup?.trim() || job.zpg1d || 'ไม่ระบุ';
      byZpg1d[zpg1dKey] ??= [];
      byZpg1d[zpg1dKey].push(job);
    }

    const sortedZpg1ds = Object.keys(byZpg1d).sort((a, b) => {
      const aOrder = getJobGroupSortOrder(a === 'ไม่ระบุ' ? null : a);
      const bOrder = getJobGroupSortOrder(b === 'ไม่ระบุ' ? null : b);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.localeCompare(b, 'th', { numeric: true });
    });

    for (const zpg1d of sortedZpg1ds) {
      const g1Jobs = byZpg1d[zpg1d];

      // Start Date is the primary sequence inside each material group.
      const byStartDate: Record<string, T[]> = {};
      for (const job of g1Jobs) {
        const startDateKey = getJobStartDateStr(job);
        byStartDate[startDateKey] ??= [];
        byStartDate[startDateKey].push(job);
      }

      const sortedStartDates = Object.keys(byStartDate).sort();

      let lastZpg3d: string | null = null;
      let lastZlmat: string | null = null;

      for (const startDate of sortedStartDates) {
        const dateJobs = byStartDate[startDate];

        // Group by zpg2d (cleaned) inside the same Start Date.
        const byZpg2d: Record<string, T[]> = {};
        for (const job of dateJobs) {
          const zpg2dKey = cleanZpg2d(job.zpg2d);
          byZpg2d[zpg2dKey] ??= [];
          byZpg2d[zpg2dKey].push(job);
        }

        const sortedZpg2ds = Object.keys(byZpg2d).sort((a, b) =>
          a.localeCompare(b, 'th', { numeric: true })
        );

        for (const zpg2d of sortedZpg2ds) {
          const g2Jobs = byZpg2d[zpg2d];

          // Group by zpg3d
          const byZpg3d: Record<string, T[]> = {};
          for (const job of g2Jobs) {
            const zpg3dKey = materialGroupText(job.zpg3d);
            byZpg3d[zpg3dKey] ??= [];
            byZpg3d[zpg3dKey].push(job);
          }

          const zpg3dKeys = Object.keys(byZpg3d);

          // Continue the previous color when possible to reduce transitions.
          const sortedKeys = [...zpg3dKeys].sort((a, b) => {
            if (lastZpg3d) {
              const aMatch = a === lastZpg3d;
              const bMatch = b === lastZpg3d;
              if (aMatch && !bMatch) return -1;
              if (!aMatch && bMatch) return 1;
            }
            return a.localeCompare(b, 'th', { numeric: true });
          });

          for (const zpg3d of sortedKeys) {
            const colorJobs = byZpg3d[zpg3d];

            const byVornr: Record<string, T[]> = {};
            for (const job of colorJobs) {
              const vornrKey = materialGroupText(job.vornr ?? null);
              byVornr[vornrKey] ??= [];
              byVornr[vornrKey].push(job);
            }

            const continuesPreviousColor = zpg3d === lastZpg3d;
            const sortedVornrKeys = Object.keys(byVornr).sort((a, b) =>
              a.localeCompare(b, 'th', { numeric: true })
            );

            for (const vornr of sortedVornrKeys) {
              const byZlmat: Record<string, T[]> = {};
              for (const job of byVornr[vornr]) {
                const zlmatKey = materialGroupText(job.zlmat ?? null);
                byZlmat[zlmatKey] ??= [];
                byZlmat[zlmatKey].push(job);
              }

              const sortedZlmatKeys = Object.keys(byZlmat).sort((a, b) => {
                if (continuesPreviousColor && lastZlmat) {
                  const aMatch = a === lastZlmat;
                  const bMatch = b === lastZlmat;
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                }
                return a.localeCompare(b, 'th', { numeric: true });
              });

              for (const zlmat of sortedZlmatKeys) {
                const lqCodeJobs = byZlmat[zlmat];

                lqCodeJobs.sort((a, b) => {
                  const dateA = getJobDueDateStr(a);
                  const dateB = getJobDueDateStr(b);
                  const dueCompare = dateA.localeCompare(dateB);
                  if (dueCompare !== 0) return dueCompare;

                  const seqA = a.seqno ?? a.sourceRow;
                  const seqB = b.seqno ?? b.sourceRow;
                  if (seqA !== seqB) return seqA - seqB;

                  return a.sourceRow - b.sourceRow;
                });

                result.push(...lqCodeJobs);
              }
            }
          }

          // Carry both color and L/Q code into the next size/date group.
          const lastJobInG2 = result[result.length - 1];
          if (lastJobInG2) {
            lastZpg3d = materialGroupText(lastJobInG2.zpg3d);
            lastZlmat = materialGroupText(lastJobInG2.zlmat ?? null);
          }
        }
      }
    }
  }

  return result;
}
