import type { Prisma } from '@prisma/client';
import { sortJobsWithZpg3dTransition, type SortableJob } from './zpg1d-helpers';

type ExistingSequenceJob = SortableJob & {
  queueGroup?: string | null;
};

type ImportCandidate = SortableJob & {
  payload: Prisma.ProductionJobCreateManyInput;
  preserveExistingPosition: boolean;
  originalSequence: number;
  originalIndex: number;
};

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function optionalText(value: unknown) {
  const normalized = text(value);
  return normalized || null;
}

function sequenceKey(job: { aufnr?: unknown; vornr?: unknown }) {
  return `${text(job.aufnr).toUpperCase()}\u0000${text(job.vornr).toUpperCase()}`;
}

function toCandidate(
  payload: Prisma.ProductionJobCreateManyInput,
  existing: ExistingSequenceJob | undefined,
  originalIndex: number,
): ImportCandidate {
  const arbpl = text(payload.arbpl) || 'UNKNOWN';
  const aufnr = text(payload.aufnr) || `ROW-${Number(payload.sourceRow ?? originalIndex + 2)}`;
  const vornr = optionalText(payload.vornr);
  const sameWorkCenter = Boolean(existing && existing.arbpl === arbpl);
  const oldSequence = Number(existing?.seqno ?? 0);
  const preserveExistingPosition = sameWorkCenter && oldSequence > 0;
  const preservedQueueGroup = sameWorkCenter ? existing?.queueGroup ?? null : null;
  const sourceRow = Number(payload.sourceRow ?? originalIndex + 2);

  const nextPayload: Prisma.ProductionJobCreateManyInput = {
    ...payload,
    sourceRow,
    arbpl,
    aufnr,
    vornr,
    seqno: preserveExistingPosition ? oldSequence : 0,
    queueGroup: preservedQueueGroup,
  };

  return {
    ...nextPayload,
    arbpl,
    aufnr,
    zpg1d: optionalText(nextPayload.zpg1d),
    zpg2d: optionalText(nextPayload.zpg2d),
    zpg3d: optionalText(nextPayload.zpg3d),
    vornr,
    zlmat: optionalText(nextPayload.zlmat),
    stdate: nextPayload.stdate ?? null,
    findate: nextPayload.findate ?? null,
    seqno: preserveExistingPosition ? oldSequence : null,
    sourceRow,
    queueGroup: preservedQueueGroup,
    payload: nextPayload,
    preserveExistingPosition,
    originalSequence: preserveExistingPosition ? oldSequence : Number.MAX_SAFE_INTEGER,
    originalIndex,
  };
}

/**
 * Prepare imported rows while preserving the current user-managed queue.
 * Existing rows keep their relative position when they remain on the same
 * work center. New rows (or rows moved to another work center by Excel) are
 * inserted using the normal default sorter.
 */
export function prepareImportedRows(
  rows: Prisma.ProductionJobCreateManyInput[],
  existingJobs: ExistingSequenceJob[],
  normalizeQueues: boolean,
) {
  const existingByKey = new Map<string, ExistingSequenceJob[]>();
  for (const existing of existingJobs) {
    const key = sequenceKey(existing);
    const matches = existingByKey.get(key);
    if (matches) matches.push(existing);
    else existingByKey.set(key, [existing]);
  }

  const candidates = rows.map((row, index) => {
    const matches = existingByKey.get(sequenceKey(row));
    const sameWorkCenterIndex = matches?.findIndex((candidate) => candidate.arbpl === text(row.arbpl));
    const matchIndex = sameWorkCenterIndex !== undefined && sameWorkCenterIndex >= 0 ? sameWorkCenterIndex : 0;
    const existing = matches?.splice(matchIndex, 1)[0];
    return toCandidate(row, existing, index);
  });

  if (!normalizeQueues) {
    return candidates.map((candidate) => candidate.payload);
  }

  const byWorkCenter = new Map<string, ImportCandidate[]>();
  for (const candidate of candidates) {
    const queue = byWorkCenter.get(candidate.arbpl);
    if (queue) queue.push(candidate);
    else byWorkCenter.set(candidate.arbpl, [candidate]);
  }

  const normalized: Prisma.ProductionJobCreateManyInput[] = [];
  for (const workCenter of Array.from(byWorkCenter.keys()).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }))) {
    const queue = byWorkCenter.get(workCenter) ?? [];
    const preserved = queue
      .filter((candidate) => candidate.preserveExistingPosition)
      .sort((a, b) => a.originalSequence - b.originalSequence || a.originalIndex - b.originalIndex);
    const newJobs = queue.filter((candidate) => !candidate.preserveExistingPosition);

    // Sort all rows to discover the default insertion boundary for new jobs,
    // while keeping the existing rows in their saved relative order.
    const defaultSorted = sortJobsWithZpg3dTransition(queue);
    const newJobsByExistingBefore = Array.from({ length: preserved.length + 1 }, () => [] as ImportCandidate[]);
    let existingBefore = 0;
    for (const candidate of defaultSorted) {
      if (candidate.preserveExistingPosition) existingBefore += 1;
      else newJobsByExistingBefore[existingBefore].push(candidate);
    }

    const ordered: ImportCandidate[] = [];
    for (let index = 0; index <= preserved.length; index += 1) {
      ordered.push(...newJobsByExistingBefore[index]);
      if (index < preserved.length) ordered.push(preserved[index]);
    }

    // A defensive fallback keeps rows that could not be represented by the
    // sorter from being dropped.
    const orderedIds = new Set(ordered.map((candidate) => candidate.originalIndex));
    ordered.push(...newJobs.filter((candidate) => !orderedIds.has(candidate.originalIndex)));

    ordered.forEach((candidate, index) => {
      normalized.push({
        ...candidate.payload,
        seqno: index + 1,
        queueGroup: candidate.payload.queueGroup ?? null,
      });
    });
  }

  return normalized;
}
