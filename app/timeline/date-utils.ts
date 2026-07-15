const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getBangkokDateKey() {
  return new Date(Date.now() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

export function parseIsoDate(value: string | null | undefined) {
  const match = typeof value === 'string' ? ISO_DATE_PATTERN.exec(value) : null;
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    ) {
      return parsed;
    }
  }

  return new Date(`${getBangkokDateKey()}T00:00:00Z`);
}

export function dateKey(value: Date) {
  if (Number.isNaN(value.getTime())) return getBangkokDateKey();
  return value.toISOString().slice(0, 10);
}

export function addDays(value: string | null | undefined, amount: number) {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return dateKey(date);
}

export function startOfMondayWeek(value: string | null | undefined) {
  const date = parseIsoDate(value);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return dateKey(date);
}
