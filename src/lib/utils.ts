/**
 * src/lib/utils.ts
 *
 * General utility functions used across the app.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind class merger — use instead of raw classnames() */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date or ISO string to a locale-friendly display */
export function formatDate(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', options);
}

/** Format bytes to human-readable string: 1234567 → "1.2 MB" */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
}

/** Truncate a string to maxLen, adding ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/** Create initials from a name: "John Doe" → "JD" */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, maxChars)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Sleep for ms milliseconds (useful in dev/testing) */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Assert a value is never — exhaustive switch helper */
export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
