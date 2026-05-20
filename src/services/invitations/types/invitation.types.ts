/**
 * DTOs for organization invitation APIs.
 * Source: organization-invitations-flow.md
 */

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type InvitationSortBy = 'createdAt' | 'email' | 'status' | 'expiresAt';
export type InvitationSortOrder = 'ASC' | 'DESC';

export interface InvitationDetailDto {
  id: string;
  organizationId: string;
  email: string;
  invitedBy: string;
  message: string | null;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  isExpired: boolean;
}

export interface InvitationListMetaDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListInvitationsResponseData {
  data: InvitationDetailDto[];
  meta: InvitationListMetaDto;
}

export interface InvitationAnalyticsDto {
  total: number;
  pending: number;
  accepted: number;
  needsAttention: number;
  expired: number;
  cancelled: number;
  acceptanceRate: number;
}

export interface ListInvitationsQueryDto {
  status?: InvitationStatus;
  page?: number;
  limit?: number;
  sortBy?: InvitationSortBy;
  sortOrder?: InvitationSortOrder;
}

export interface CreateInvitationsDto {
  emails: string[];
  message?: string;
}

export interface AcceptInvitationDto {
  token: string;
}
