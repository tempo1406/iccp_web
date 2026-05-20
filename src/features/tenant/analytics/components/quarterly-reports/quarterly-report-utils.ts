import { HttpError } from '@/config/http/errors';
import type { AppError } from '@/lib/safe-query';
import type {
  PeriodicReportAttemptStatus,
  PeriodicReportArtifactType,
  PeriodicReportFrequency,
  PeriodicReportRecipientGroup,
  PeriodicReportRunStatus,
  PeriodicReportScope,
  PeriodicReportTriggerSource,
} from '../../types/quarterly-report.types';

export const MONTHLY_PERIOD_KEY_REGEX = /^\d{4}-M(0[1-9]|1[0-2])$/;
export const QUARTERLY_PERIOD_KEY_REGEX = /^\d{4}-Q[1-4]$/;
export const YEARLY_PERIOD_KEY_REGEX = /^\d{4}-Y$/;
export const PERIODIC_REPORT_PERIOD_KEY_REGEX =
  /^(?:\d{4}-Q[1-4]|\d{4}-M(?:0[1-9]|1[0-2])|\d{4}-Y)$/;

const PERIOD_KEY_REGEX_BY_FREQUENCY: Record<PeriodicReportFrequency, RegExp> = {
  monthly: MONTHLY_PERIOD_KEY_REGEX,
  quarterly: QUARTERLY_PERIOD_KEY_REGEX,
  yearly: YEARLY_PERIOD_KEY_REGEX,
};

const FREQUENCY_LABELS: Record<PeriodicReportFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const RUN_STATUS_LABELS: Record<PeriodicReportRunStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  sent: 'Sent',
  partial_failed: 'Partial Failed',
  failed_retryable: 'Failed (Retrying)',
  failed_exhausted: 'Failed (Exhausted)',
};

const ATTEMPT_STATUS_LABELS: Record<PeriodicReportAttemptStatus, string> = {
  success: 'Success',
  partial_failed: 'Partial Failed',
  failed: 'Failed',
};

const TRIGGER_SOURCE_LABELS: Record<PeriodicReportTriggerSource, string> = {
  auto: 'Auto',
  retry: 'Retry',
  manual: 'Manual',
};

const RECIPIENT_GROUP_LABELS: Record<PeriodicReportRecipientGroup, string> = {
  org_admin: 'Organization Admins',
  project_manager: 'Project Managers',
  project_owner: 'Project Owner',
  contact_email: 'Contact Email',
};

const REPORT_SCOPE_LABELS: Record<PeriodicReportScope, string> = {
  org_summary: 'Organization Summary',
  project_summary: 'Project Summary',
  member_kpi: 'Member KPI',
};

const ARTIFACT_LABELS: Record<PeriodicReportArtifactType, string> = {
  org_summary: 'Organization Summary CSV',
  project_summary: 'Project Summary CSV',
  member_kpi: 'Member KPI CSV',
};

type Translator = (key: string, values?: Record<string, string | number>) => string;

export function normalizePeriodicPeriodKey(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidPeriodicPeriodKey(
  value: string,
  frequency?: PeriodicReportFrequency,
): boolean {
  const normalizedValue = normalizePeriodicPeriodKey(value);

  if (frequency) {
    return PERIOD_KEY_REGEX_BY_FREQUENCY[frequency].test(normalizedValue);
  }

  return PERIODIC_REPORT_PERIOD_KEY_REGEX.test(normalizedValue);
}

export function getPeriodicFrequencyLabel(
  frequency: PeriodicReportFrequency,
  t?: Translator,
): string {
  return t ? t(`periodicReports.frequencyLabel.${frequency}`) : FREQUENCY_LABELS[frequency];
}

export function getPeriodicRunStatusLabel(
  status: PeriodicReportRunStatus,
  t?: Translator,
): string {
  return t ? t(`periodicReports.runStatus.${status}`) : RUN_STATUS_LABELS[status];
}

export function getPeriodicAttemptStatusLabel(
  status: PeriodicReportAttemptStatus,
  t?: Translator,
): string {
  return t ? t(`periodicReports.attemptStatus.${status}`) : ATTEMPT_STATUS_LABELS[status];
}

export function getPeriodicTriggerSourceLabel(
  source: PeriodicReportTriggerSource,
  t?: Translator,
): string {
  return t ? t(`periodicReports.triggerSource.${source}`) : TRIGGER_SOURCE_LABELS[source];
}

export function getPeriodicRecipientGroupLabel(
  group: PeriodicReportRecipientGroup,
): string {
  return RECIPIENT_GROUP_LABELS[group];
}

export function getPeriodicScopeLabel(scope: PeriodicReportScope): string {
  return REPORT_SCOPE_LABELS[scope];
}

export function getPeriodicArtifactLabel(
  artifactType: PeriodicReportArtifactType,
  t?: Translator,
): string {
  return t ? t(`periodicReports.artifact.${artifactType}`) : ARTIFACT_LABELS[artifactType];
}

export function canResendPeriodicReport(
  status: PeriodicReportRunStatus,
): boolean {
  return status === 'sent' || status === 'failed_exhausted';
}

export function toPeriodicDispatchErrorMessage(
  error: AppError | null | undefined,
  fallback = 'Failed to send periodic report.',
  t?: Translator,
): string {
  const cause = error?.cause;

  if (cause instanceof HttpError) {
    const message = (cause.payload?.message ?? cause.message ?? '').toLowerCase();

    if (cause.status === 409) {
      if (message.includes('running')) {
        return t ? t('periodicReports.dispatchError.running') : 'A periodic report for this period is already running. Please wait for the current run to finish.';
      }

      if (
        message.includes('already sent') ||
        message.includes('force resend') ||
        message.includes('forceresend') ||
        message.includes('sent')
      ) {
        return t ? t('periodicReports.dispatchError.alreadySent') : 'This periodic report was already sent. Enable Force resend to send it again.';
      }
    }

    return cause.payload?.message || cause.message || fallback;
  }

  return error?.message || fallback;
}
