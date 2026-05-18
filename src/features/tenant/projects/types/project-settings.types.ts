export type PointScaleType = 'fibonacci' | 'linear' | 'custom';

export interface ProjectSettings {
  projectId: string;
  organizationId: string;
  // Daily Report Reminder
  dailyEnabled: boolean;
  dailyTime?: string;
  dailyDays: number[];
  // Reminder
  taskDueReminderEnabled: boolean;
  taskDueReminderHours: number[];
  reminderChannels: string[];
  overdueEscalationEnabled: boolean;
  overdueEscalationAfterHours: number;
  // Point Scale
  pointScaleType?: PointScaleType;
  pointScaleValues?: number[];
  maxPointPerTask?: number;
  // KPI Weights (resolved — merged with org defaults)
  kpiWeightPointCompletion: number;
  kpiWeightOnTime: number;
  kpiWeightOtContribution: number;
  // Bonus
  bonusEnabled: boolean;
  bonusOnTimeTask: number;
  bonusEarlyTaskHours: number;
  bonusEarlyTask: number;
  bonusZeroOverdue: number;
  bonusMaxCap: number;
  bonusOtPerEffectiveHour: number;
  orgTimezone: string;
  updatedAt: string;
}

export type UpsertProjectSettingsRequest = Partial<
  Omit<ProjectSettings, 'projectId' | 'organizationId' | 'updatedAt'>
>;
