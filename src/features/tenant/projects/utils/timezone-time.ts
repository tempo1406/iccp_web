export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const VIETNAM_TIMEZONE_LABEL = 'Vietnam timezone (GMT+7)';

// Returns the UTC offset in minutes (positive = east of UTC) for a timezone at a given instant.
// Uses `en-US` locale so the locale-string parse is stable across environments.
function getUtcOffsetMinutes(timezone: string, at: Date): number {
  const utcStr = at.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = at.toLocaleString('en-US', { timeZone: timezone });
  return (new Date(tzStr).getTime() - new Date(utcStr).getTime()) / 60_000;
}

function toHHmm(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Convert "HH:mm" stored in org timezone to "HH:mm" in the browser's local timezone.
 * Use this when populating a time <input> from API data.
 */
export function orgTimeToLocalTime(orgTime: string, orgTimezone: string): string {
  if (!orgTime) return orgTime;
  const now = new Date();
  const orgOffset = getUtcOffsetMinutes(orgTimezone, now);
  const browserOffset = -now.getTimezoneOffset();
  const [h, m] = orgTime.split(':').map(Number);
  return toHHmm(h * 60 + m - orgOffset + browserOffset);
}

/**
 * Convert "HH:mm" entered in the browser's local timezone to "HH:mm" in org timezone.
 * Use this before sending a time value to the API.
 */
export function localTimeToOrgTime(localTime: string, orgTimezone: string): string {
  if (!localTime) return localTime;
  const now = new Date();
  const orgOffset = getUtcOffsetMinutes(orgTimezone, now);
  const browserOffset = -now.getTimezoneOffset();
  const [h, m] = localTime.split(':').map(Number);
  return toHHmm(h * 60 + m - browserOffset + orgOffset);
}
