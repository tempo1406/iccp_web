// ─── Org Settings ────────────────────────────────────────────────────────────

import type {
  PeriodicReportSchedule,
} from '@/features/tenant/analytics/types/quarterly-report.types';

export const DIGEST_RECIPIENT_OPTIONS = [
  'project_owner',
  'org_admin',
  'project_manager',
  'contact_email',
] as const;

export type DigestRecipient = (typeof DIGEST_RECIPIENT_OPTIONS)[number];

export const DIGEST_CHANNEL_OPTIONS = ['email', 'in_app'] as const;

export type DigestChannel = (typeof DIGEST_CHANNEL_OPTIONS)[number];

export interface OrgSettings {
  organizationId: string;
  aiTokenLimit: number;
  // KPI Weights
  defaultWeightPointCompletion: number;
  defaultWeightOnTime: number;
  defaultWeightOtContribution: number;
  // OT Multipliers
  otMultiplierWeekday: number;
  otMultiplierSaturday: number;
  otMultiplierSunday: number;
  otMultiplierHoliday: number;
  // Bonus
  bonusEnabled: boolean;
  bonusOnTimeTask: number;
  bonusEarlyTaskHours: number;
  bonusEarlyTask: number;
  bonusZeroOverdue: number;
  bonusMaxCap: number;
  bonusOtPerEffectiveHour: number;
  // Notification
  defaultReminderChannels: string[];
  // Digest — digestDay: 1=Monday … 7=Sunday
  digestEnabled: boolean;
  digestDay: number;
  digestTime: string; // "HH:MM" in org timezone
  digestRecipients: DigestRecipient[];
  digestChannels: DigestChannel[];
  lastDigestSentAt: string | null;
  // Periodic Report
  periodicReportSchedules: PeriodicReportSchedule[];
  updatedAt: string;
}

export type UpsertOrgSettingsRequest = Partial<
  Omit<OrgSettings, 'organizationId' | 'updatedAt' | 'lastDigestSentAt'>
>;

// ─── Working Time ─────────────────────────────────────────────────────────────

export interface WorkingTimeConfig {
  organizationId: string;
  mondayHours: number;
  tuesdayHours: number;
  wednesdayHours: number;
  thursdayHours: number;
  fridayHours: number;
  saturdayHours: number;
  sundayHours: number;
  updatedAt: string;
}

export type UpsertWorkingTimeRequest = Omit<WorkingTimeConfig, 'organizationId' | 'updatedAt'>;

// ─── Holidays ─────────────────────────────────────────────────────────────────

export type HolidayType = 'national_holiday' | 'company_holiday' | 'special_day';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: HolidayType;
  workingHours: number;
  createdAt: string;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  type: HolidayType;
  workingHours: number;
}
