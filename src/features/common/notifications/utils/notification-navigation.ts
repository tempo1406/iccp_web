import type { NotificationDto } from '@/services/notifications/types';
import { ROUTES } from '@/common/constant/routes';
import { readString, toRecord } from './notification-detail.utils';

const PROJECT_TASK_TYPES = new Set([
  'task_assigned',
  'task_reassigned',
  'task_status_changed',
  'task_due_soon',
  'task_overdue',
  'task_mentioned',
]);

const PROJECT_MEMBER_TYPES = new Set([
  'project_role_changed',
  'project_member_removed',
]);

const DAILY_REPORT_TYPES = new Set([
  'daily_report_submitted',
  'daily_report.submit',
  'daily_report.submitted',
  'daily_report_reminder',
  'daily_report_commented',
  'daily_report_seen',
]);

function extractProjectRef(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const project = toRecord(data.project);
  return (
    readString(data.projectSlug) ??
    readString(data.project_slug) ??
    readString(project?.slug) ??
    readString(data.projectId) ??
    readString(data.project_id) ??
    readString(project?.id)
  );
}

function extractTaskRef(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const task = toRecord(data.task);
  return (
    readString(data.taskSlug) ??
    readString(data.task_slug) ??
    readString(task?.slug) ??
    readString(data.taskId) ??
    readString(data.task_id) ??
    readString(task?.id)
  );
}

function isDailyReportNotification(type: string, data: Record<string, unknown> | null) {
  const moduleCode = readString(data?.module)?.toLowerCase();
  return DAILY_REPORT_TYPES.has(type) || type.includes('daily_report') || moduleCode === 'daily_report';
}

export function resolveNotificationHref(
  notification: NotificationDto,
  tenantId: string | null,
): string | null {
  if (!tenantId) return null;

  const type = notification.type?.toLowerCase?.() ?? '';
  const data = toRecord(notification.data);
  const projectRef = extractProjectRef(data);
  if (!projectRef) return null;

  const base = ROUTES.tenant.project(tenantId, projectRef);

  if (isDailyReportNotification(type, data)) {
    const params = new URLSearchParams();
    const reportDate = readString(data?.reportDate) ?? readString(data?.report_date);
    const reportId = readString(data?.reportId) ?? readString(data?.report_id);
    const user = toRecord(data?.user) ?? toRecord(data?.member) ?? toRecord(data?.reporter);
    const userId =
      readString(data?.userId) ??
      readString(data?.user_id) ??
      readString(data?.memberId) ??
      readString(data?.member_id) ??
      readString(data?.reporterId) ??
      readString(data?.reporter_id) ??
      readString(user?.id) ??
      readString(user?.userId);
    const status = readString(data?.status) ?? readString(data?.reportStatus);

    if (reportDate) params.set('date', reportDate);
    if (reportId) params.set('reportId', reportId);
    if (userId) params.set('userId', userId);
    if (status) params.set('status', status);

    const suffix = params.toString();
    return `${ROUTES.tenant.projectReports(tenantId, projectRef)}${suffix ? `?${suffix}` : ''}`;
  }

  if (PROJECT_TASK_TYPES.has(type)) {
    const taskRef = extractTaskRef(data);
    return taskRef ? `${base}?taskSlug=${encodeURIComponent(taskRef)}` : base;
  }

  if (PROJECT_MEMBER_TYPES.has(type)) {
    return base;
  }

  return null;
}
