export const DAILY_REPORT_STATUSES = ['draft', 'submitted', 'locked'] as const;

export type DailyReportStatus = (typeof DAILY_REPORT_STATUSES)[number];

export const DAILY_REPORT_ITEM_TYPES = ['worklog', 'manual'] as const;

export type DailyReportItemType = (typeof DAILY_REPORT_ITEM_TYPES)[number];

export interface DailyReportItemResponse {
  id: string;
  type: DailyReportItemType;
  worklogId?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  taskId?: string | null;
  taskTitle?: string | null;
  taskSlug?: string | null;
  content?: string | null;
  workDate?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMinutes: number;
  progressPercent?: number | null;
  isBlocker?: boolean | null;
  displayOrder?: number | null;
}

export interface DailyReportCommentAuthor {
  id: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface DailyReportCommentResponse {
  id: string;
  dailyReportId: string;
  author: DailyReportCommentAuthor;
  content: string;
  createdAt: string;
}

export interface DailyReportResponse {
  id: string;
  organizationId: string;
  projectId: string;
  projectName?: string | null;
  userId: string;
  userDisplayName?: string | null;
  userEmail?: string | null;
  reportDate: string;
  status: DailyReportStatus;
  summary?: string | null;
  blockers?: string | null;
  planTomorrow?: string | null;
  totalLoggedMinutes: number;
  submittedAt?: string | null;
  isSeen?: boolean;
  seenByUserId?: string | null;
  seenByDisplayName?: string | null;
  seenByEmail?: string | null;
  seenAt?: string | null;
  comments?: DailyReportCommentResponse[];
  items: DailyReportItemResponse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyReportQuery {
  date?: string;
}

export interface DailyReportListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DailyReportListResponse {
  data: DailyReportResponse[];
  meta: DailyReportListMeta;
}

export const DEFAULT_DAILY_REPORT_LIST_META: DailyReportListMeta = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export type DailyReportTeamSortBy =
  | 'reportDate'
  | 'createdAt'
  | 'submittedAt'
  | 'totalLoggedMinutes';

export type DailyReportTeamSortOrder = 'ASC' | 'DESC';

export interface DailyReportTeamQuery extends DailyReportQuery {
  userId?: string;
  status?: DailyReportStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: DailyReportTeamSortBy;
  sortOrder?: DailyReportTeamSortOrder;
}

export interface UpdateDailyReportRequest {
  summary?: string | null;
  blockers?: string | null;
  planTomorrow?: string | null;
}

export interface AddDailyReportCommentRequest {
  content: string;
}
