export type OperationPrecedenceJob = {
  id: number;
  aufnr: string;
  vornr: string | null;
  arbpl: string;
  stdate: string | Date | null;
  seqno: number;
};

export type OperationPrecedenceViolation = {
  order: string;
  lowerJobId: number;
  lowerOperation: string;
  lowerStartDate: string | null;
  lowerWorkCenter: string;
  lowerSequence: number;
  higherJobId: number;
  higherOperation: string;
  higherStartDate: string | null;
  higherWorkCenter: string;
  higherSequence: number;
  reason: 'start_date' | 'sequence';
};

function dateKey(value: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function compareOperationNumbers(left: string, right: string) {
  return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' });
}

function getPrecedenceViolationReason(
  lower: OperationPrecedenceJob,
  higher: OperationPrecedenceJob,
): OperationPrecedenceViolation['reason'] | null {
  const lowerDate = dateKey(lower.stdate);
  const higherDate = dateKey(higher.stdate);
  if (lowerDate && higherDate && lowerDate !== higherDate) {
    return higherDate < lowerDate ? 'start_date' : null;
  }

  if (lower.arbpl === higher.arbpl) {
    return higher.seqno < lower.seqno ? 'sequence' : null;
  }

  return null;
}

export function findOperationPrecedenceViolation(
  jobs: OperationPrecedenceJob[],
): OperationPrecedenceViolation | null {
  const jobsByOrder = new Map<string, OperationPrecedenceJob[]>();
  for (const job of jobs) {
    const order = job.aufnr.trim();
    const operation = job.vornr?.trim();
    if (!order || !operation) continue;
    const operations = jobsByOrder.get(order) ?? [];
    operations.push(job);
    jobsByOrder.set(order, operations);
  }

  for (const [order, operations] of jobsByOrder) {
    const byOperation = [...operations].sort((left, right) => (
      compareOperationNumbers(left.vornr!, right.vornr!) || left.id - right.id
    ));

    for (let lowerIndex = 0; lowerIndex < byOperation.length; lowerIndex += 1) {
      const lower = byOperation[lowerIndex];
      for (let higherIndex = lowerIndex + 1; higherIndex < byOperation.length; higherIndex += 1) {
        const higher = byOperation[higherIndex];
        if (compareOperationNumbers(lower.vornr!, higher.vornr!) === 0) continue;
        const reason = getPrecedenceViolationReason(lower, higher);
        if (!reason) continue;

        return {
          order,
          lowerJobId: lower.id,
          lowerOperation: lower.vornr!,
          lowerStartDate: dateKey(lower.stdate),
          lowerWorkCenter: lower.arbpl,
          lowerSequence: lower.seqno,
          higherJobId: higher.id,
          higherOperation: higher.vornr!,
          higherStartDate: dateKey(higher.stdate),
          higherWorkCenter: higher.arbpl,
          higherSequence: higher.seqno,
          reason,
        };
      }
    }
  }

  return null;
}

export function formatOperationPrecedenceError(violation: OperationPrecedenceViolation) {
  const formatDate = (value: string | null) => {
    if (!value) return 'ไม่ระบุวันที่';
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  };

  if (violation.reason === 'start_date') {
    return [
      `ย้ายไม่ได้: Order ${violation.order} ผิดลำดับ Routing`,
      `OP ${violation.higherOperation} (Start Date ${formatDate(violation.higherStartDate)}, WC ${violation.higherWorkCenter})`,
      `จะเริ่มก่อน OP ${violation.lowerOperation} (Start Date ${formatDate(violation.lowerStartDate)}, WC ${violation.lowerWorkCenter})`,
      `กรุณากำหนด Start Date ของ OP ${violation.higherOperation} ตั้งแต่ ${formatDate(violation.lowerStartDate)} เป็นต้นไป`,
    ].join(' — ');
  }

  return [
    `ย้ายไม่ได้: Order ${violation.order} ผิดลำดับ Routing ใน WC ${violation.lowerWorkCenter}`,
    `OP ${violation.higherOperation} ถูกวางที่ Seq ${violation.higherSequence} ก่อน OP ${violation.lowerOperation} ที่ Seq ${violation.lowerSequence}`,
    `ทั้งสองงานมี Start Date ${formatDate(violation.lowerStartDate)}`,
    `กรุณาวาง OP ${violation.higherOperation} หลัง OP ${violation.lowerOperation}`,
  ].join(' — ');
}
