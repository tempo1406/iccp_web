/**
 * Convert a byte count to a human-readable string.
 * Accepts both number and numeric string (API may return fileSize as a string).
 * e.g. 1536 → "1.5 KB"
 */
export function formatBytes(bytes: number | string, decimals = 1): string {
  const n = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!n || isNaN(n)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((n / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
