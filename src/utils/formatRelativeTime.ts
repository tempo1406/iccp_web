function resolveRelativeLocale(locale?: string): string {
  return locale?.startsWith('vi') ? 'vi-VN' : 'en-US';
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale?: string,
): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const rtf = new Intl.RelativeTimeFormat(resolveRelativeLocale(locale), {
    numeric: 'auto',
  });
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return rtf.format(0, 'second');
  if (seconds < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 7) return rtf.format(-days, 'day');
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return rtf.format(-weeks, 'week');
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}
