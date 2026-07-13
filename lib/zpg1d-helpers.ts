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
    id: 'ne_drd_eoe',
    label: 'เหล็กอาบ NE , เหล็กอาบ DRD , เหล็กอาบ EOE',
    colorAccent: '#d97706', // Amber
  },
] as const;

export function getJobGroupId(zpg1d: string | null): typeof ZPG1D_GROUPS[number]['id'] {
  const val = zpg1d?.trim();
  if (val === 'เหล็กอาบปี๊บ') return 'tinplate';
  if (val === 'เหล็กอาบ 3-Piece') return 'three_piece';
  return 'ne_drd_eoe';
}

export function getJobGroupSortOrder(zpg1d: string | null): number {
  const groupId = getJobGroupId(zpg1d);
  if (groupId === 'tinplate') return 1;
  if (groupId === 'three_piece') return 2;
  return 3;
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
  zpg2d: string | null;
  zpg3d: string | null;
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

  const materialGroupText = (value: string | null) => value?.trim() || 'ไม่ระบุ';

  if (options?.prioritizeUrgent) {
    const urgentJobs: T[] = [];
    const normalJobs: T[] = [];

    for (const job of jobsList) {
      const fin = job.findate ? (job.findate instanceof Date ? job.findate.toISOString().slice(0, 10) : String(job.findate)) : null;
      if (isUrgent(fin)) {
        urgentJobs.push(job);
      } else {
        normalJobs.push(job);
      }
    }

    // 1. Sort Urgent jobs: Group by Due Date, then sort internally with transition sort
    const urgentByDate: Record<string, T[]> = {};
    for (const job of urgentJobs) {
      const dateKey = getJobDueDateStr(job);
      urgentByDate[dateKey] ??= [];
      urgentByDate[dateKey].push(job);
    }
    const sortedUrgentDates = Object.keys(urgentByDate).sort();
    const sortedUrgentJobs: T[] = [];
    for (const d of sortedUrgentDates) {
      const dayJobs = urgentByDate[d];
      sortedUrgentJobs.push(...sortJobsWithZpg3dTransition(dayJobs, { prioritizeUrgent: false }));
    }

    // 2. Sort Normal jobs with transition sort
    const sortedNormalJobs = sortJobsWithZpg3dTransition(normalJobs, { prioritizeUrgent: false });

    return [...sortedUrgentJobs, ...sortedNormalJobs];
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

    // Group by zpg1d
    const byZpg1d: Record<string, T[]> = {};
    for (const job of wcJobs) {
      const zpg1dKey = job.zpg1d || 'ไม่ระบุ';
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

      // Group by zpg2d (cleaned)
      const byZpg2d: Record<string, T[]> = {};
      for (const job of g1Jobs) {
        const zpg2dKey = cleanZpg2d(job.zpg2d);
        byZpg2d[zpg2dKey] ??= [];
        byZpg2d[zpg2dKey].push(job);
      }

      const sortedZpg2ds = Object.keys(byZpg2d).sort((a, b) =>
        a.localeCompare(b, 'th', { numeric: true })
      );

      let lastZpg3d: string | null = null;

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

        // Sort keys: if lastZpg3d matches one of the keys, put that key first.
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
          const groupJobs = byZpg3d[zpg3d];
          
          groupJobs.sort((a, b) => {
            const dateA = getJobDueDateStr(a);
            const dateB = getJobDueDateStr(b);
            const dueCompare = dateA.localeCompare(dateB);
            if (dueCompare !== 0) return dueCompare;

            const seqA = a.seqno ?? a.sourceRow;
            const seqB = b.seqno ?? b.sourceRow;
            if (seqA !== seqB) return seqA - seqB;

            return a.sourceRow - b.sourceRow;
          });

          result.push(...groupJobs);
        }

        // Update lastZpg3d to the zpg3d of the last job placed in this zpg2d group
        const lastJobInG2 = result[result.length - 1];
        if (lastJobInG2) {
          lastZpg3d = materialGroupText(lastJobInG2.zpg3d);
        }
      }
    }
  }

  return result;
}

