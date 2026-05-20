function resolveDateLocale(locale?: string): string | undefined {
  if (!locale) return undefined;
  return locale.startsWith('vi') ? 'vi-VN' : 'en-US';
}

export function formatDateTime(dateStr: string, locale?: string): string {
  return new Date(dateStr).toLocaleString(resolveDateLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
