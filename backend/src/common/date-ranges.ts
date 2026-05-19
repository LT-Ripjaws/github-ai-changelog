const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateBoundary(value: string): Date {
  return new Date(value);
}

export function parseExclusiveEndDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return date;
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }

  date.setTime(date.getTime() + 1);
  return date;
}
