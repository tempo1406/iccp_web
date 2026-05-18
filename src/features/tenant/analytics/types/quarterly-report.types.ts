import type { ApiPaginationParams } from '@/common/types/api';

export const PERIODIC_REPORT_FREQUENCIES = [
  'monthly',
  'quarterly',
  'yearly',
] as const;

export type PeriodicReportFrequency =
  (typeof PERIODIC_REPORT_FREQUENCIES)[number];

export const PERIODIC_REPORT_RECIPIENT_GROUPS = [
  'project_owner',
  'org_admin',
  'project_manager',
  'contact_email',
] as const;

export type PeriodicReportRecipientGroup =
  (typeof PERIODIC_REPORT_RECIPIENT_GROUPS)[number];

export const PERIODIC_REPORT_SCOPES = [
  'org_summary',
  'project_summary',
  'member_kpi',
] as const;

export type PeriodicReportScope = (typeof PERIODIC_REPORT_SCOPES)[number];

export const PERIODIC_REPORT_CHANNELS = ['email', 'in_app'] as const;

export type PeriodicReportChannel = (typeof PERIODIC_REPORT_CHANNELS)[number];

export const PERIODIC_REPORT_RUN_STATUSES = [
  'pending',
  'running',
  'sent',
  'partial_failed',
  'failed_retryable',
  'failed_exhausted',
] as const;

export type PeriodicReportRunStatus =
  (typeof PERIODIC_REPORT_RUN_STATUSES)[number];

export const PERIODIC_REPORT_ATTEMPT_STATUSES = [
  'success',
  'partial_failed',
  'failed',
] as const;

export type PeriodicReportAttemptStatus =
  (typeof PERIODIC_REPORT_ATTEMPT_STATUSES)[number];

export const PERIODIC_REPORT_TRIGGER_SOURCES = [
  'auto',
  'retry',
  'manual',
] as const;

export type PeriodicReportTriggerSource =
  (typeof PERIODIC_REPORT_TRIGGER_SOURCES)[number];

export type PeriodicReportArtifactType = PeriodicReportScope;

export interface PeriodicReportArtifact {
  artifactType: PeriodicReportArtifactType;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
}

export interface PeriodicReportAttempt {
  attemptNo: number;
  triggerSource: PeriodicReportTriggerSource;
  status: PeriodicReportAttemptStatus;
  successCount: number;
  failedCount: number;
  errorSummary: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface PeriodicReportHistoryItem {
  runId: string;
  frequency: PeriodicReportFrequency;
  periodKey: string;
  status: PeriodicReportRunStatus;
  scheduledFor: string | null;
  sentAt: string | null;
  attemptCount: number;
  successCount: number;
  failedCount: number;
  lastError: string | null;
  artifacts: PeriodicReportArtifact[];
}

export interface PeriodicReportHistoryDetail extends PeriodicReportHistoryItem {
  attempts: PeriodicReportAttempt[];
}

export interface PeriodicReportHistoryListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PeriodicReportHistoryListResponse {
  data: PeriodicReportHistoryItem[];
  meta: PeriodicReportHistoryListMeta;
}

export type PeriodicReportHistorySortField =
  | 'createdAt'
  | 'scheduledFor'
  | 'sentAt'
  | 'updatedAt';

export interface PeriodicReportHistoryListQuery
  extends Omit<ApiPaginationParams, 'search' | 'sortBy'> {
  sortBy?: PeriodicReportHistorySortField;
  periodKey?: string;
  frequency?: PeriodicReportFrequency;
  status?: PeriodicReportRunStatus;
}

export interface PeriodicReportDispatchRequest {
  periodKey: string;
  forceResend?: boolean;
  forceRebuild?: boolean;
}

export interface PeriodicReportSchedule {
  frequency: PeriodicReportFrequency;
  enabled: boolean;
  sendDelayDays: number;
  sendTime: string;
  recipientGroups: PeriodicReportRecipientGroup[];
  customEmails: string[];
  channels: PeriodicReportChannel[];
  scopes: PeriodicReportScope[];
}

const DEFAULT_SCOPES_BY_FREQUENCY: Record<
  PeriodicReportFrequency,
  PeriodicReportScope[]
> = {
  monthly: ['org_summary'],
  quarterly: ['org_summary', 'project_summary', 'member_kpi'],
  yearly: ['org_summary', 'project_summary'],
};

export function createDefaultPeriodicReportSchedule(
  frequency: PeriodicReportFrequency,
): PeriodicReportSchedule {
  return {
    frequency,
    enabled: false,
    sendDelayDays: 1,
    sendTime: '08:00',
    recipientGroups: ['project_owner', 'org_admin'],
    customEmails: [],
    channels: ['email'],
    scopes: [...DEFAULT_SCOPES_BY_FREQUENCY[frequency]],
  };
}

export function createDefaultPeriodicReportSchedules(): PeriodicReportSchedule[] {
  return PERIODIC_REPORT_FREQUENCIES.map((frequency) =>
    createDefaultPeriodicReportSchedule(frequency),
  );
}
