export interface OrganizationRoleDto {
  id: string;
  name: string;
  description?: string | null;
  isSystemRole?: boolean;
  organizationId?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Field name returned by GET /organizations/roles/:roleId */
  permissions?: string[];
  /** Alias used in some create/assign payloads — same as permissions */
  permissionCodes?: string[];
}

export interface UserRoleAssignmentDto {
  id: string;
  roleId: string;
  roleName: string;
  scopeType?: string;
  scopeId?: string | null;
  assignedAt?: string;
}

export type ListOrganizationRolesResponseData =
  | OrganizationRoleDto[]
  | {
      data: OrganizationRoleDto[];
    }
  | {
      items: OrganizationRoleDto[];
      total?: number;
      page?: number;
      pageSize?: number;
    };

export interface CreateOrganizationRoleDto {
  name: string;
  description?: string;
  permissionCodes?: string[];
}

export interface UpdateOrganizationRoleDto {
  name?: string;
  description?: string;
}

export interface UpdateRolePermissionsDto {
  permissionCodes: string[];
}

export interface RolePermissionMutationDto {
  roleId: string;
  permissionCodes: string[];
}

export interface MemberRoleMutationDto {
  userId: string;
  roleId: string;
}

export type ListMemberRolesResponseData =
  | UserRoleAssignmentDto[]
  | {
      data: UserRoleAssignmentDto[];
    };
