import type {
  DailyReportItemResponse,
  DailyReportStatus,
} from '../types/daily-report.types';

export function toTodayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDailyMinutes(value?: number | null): string {
  const totalMinutes = Number(value ?? 0);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatDailyDateTime(value?: string | null, fallback = 'Not available'): string {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDailyStatusLabel(status: DailyReportStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'submitted':
      return 'Submitted';
    case 'locked':
      return 'Locked';
    default:
      return status;
  }
}

export function sortDailyReportItems(items: DailyReportItemResponse[]): DailyReportItemResponse[] {
  const clonedItems = [...items];
  clonedItems.sort((left, right) => {
    const leftOrder = left.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;

    const leftTime = left.startedAt ?? left.workDate ?? '';
    const rightTime = right.startedAt ?? right.workDate ?? '';
    return leftTime.localeCompare(rightTime);
  });
  return clonedItems;
}
