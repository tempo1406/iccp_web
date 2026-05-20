/**
 * src/services/organizations/types/organization.types.ts
 */

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  website?: string | null;
  ownerId: string;
  description: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: 'small' | 'medium' | 'large' | 'enterprise' | null;
  subscriptionPlanId: string | null;
  isActive: boolean;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  subscriptionPlanId?: string;
}

export interface ListMembersQueryDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  isActive?: boolean;
}

export interface UpdateMemberStatusDto {
  isActive: boolean;
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string | null;
}

export interface OrganizationMemberUserApiDto {
  id?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface OrganizationMemberApiDto {
  id: string;
  organizationId?: string;
  userId?: string;
  invitedBy?: string | null;
  isActive?: boolean;
  memberStatus?: boolean;
  isOwner?: boolean;
  joinedAt?: string;
  leftAt?: string | null;
  invitationAcceptedAt?: string | null;
  createdAt?: string;
  roles?: RoleDto[] | string[];
  user?: OrganizationMemberUserApiDto;

  user_id?: string;
  organization_id?: string;
  invited_by?: string | null;
  member_status?: boolean;
  is_active?: boolean;
  is_owner?: boolean;
  joined_at?: string;
  left_at?: string | null;
  invitation_accepted_at?: string | null;
  created_at?: string;
  user_email?: string;
  user_firstName?: string;
  user_lastName?: string;
  user_avatarUrl?: string | null;
  user_phone?: string | null;
  user_dateOfBirth?: string | null;
  user_isActive?: boolean;
  user_isVerified?: boolean;

  // Backward compatibility if API shape changes
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
}

export interface MemberDto {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  invitedBy?: string | null;
  isActive: boolean;
  isOwner?: boolean;
  joinedAt: string;
  leftAt?: string | null;
  invitationAcceptedAt?: string | null;
  createdAt?: string;
  roles?: RoleDto[];

  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  userIsActive?: boolean;
  userIsVerified?: boolean;
}

export interface ListMembersMetaDto {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export type ListMembersResponseData =
  | OrganizationMemberApiDto[]
  | {
      data: OrganizationMemberApiDto[];
      total?: number;
      page?: number;
      limit?: number;
    }
  | {
      data: {
        data: OrganizationMemberApiDto[];
        meta?: ListMembersMetaDto;
      };
    }
  | {
      items: OrganizationMemberApiDto[];
      total?: number;
      page?: number;
      pageSize?: number;
      totalPages?: number;
    };

export type MemberDetailsResponseData =
  | OrganizationMemberApiDto
  | {
      data: OrganizationMemberApiDto;
    };
