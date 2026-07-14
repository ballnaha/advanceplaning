export function isFinishDateWithinWarningWindow(finishDateValue: string | null) {
  if (!finishDateValue) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = finishDateValue.split('-').map(Number);
  const finishDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  const differenceInDays = Math.floor((finishDate.getTime() - today.getTime()) / 86_400_000);
  const inclusiveDays = differenceInDays + 1;

  return inclusiveDays >= 1 && inclusiveDays <= 3;
}

export function FinishDateWarningIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', flex: '0 0 auto', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path
        d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
        fill="#d97706"
      />
      <path d="M12 8V13" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1.25" fill="#ffffff" />
    </svg>
  );
}
