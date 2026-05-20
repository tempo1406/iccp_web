import { BaseService } from '@/services/base-service';
import type {
  CreateOrganizationRoleDto,
  ListMemberRolesResponseData,
  ListOrganizationRolesResponseData,
  MemberRoleMutationDto,
  OrganizationRoleDto,
  RolePermissionMutationDto,
  UpdateOrganizationRoleDto,
  UpdateRolePermissionsDto,
} from './types/organization-role.types';

export class OrganizationRolesService extends BaseService {
  private readonly base = '/v1/organizations/roles';

  getMyRoles(): Promise<ListMemberRolesResponseData> {
    return this.get<ListMemberRolesResponseData>(`${this.base}/me`);
  }

  listRoles(params?: { search?: string }): Promise<ListOrganizationRolesResponseData> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return this.get<ListOrganizationRolesResponseData>(
      query ? `${this.base}?${query}` : this.base,
    );
  }

  getRoleById(roleId: string): Promise<OrganizationRoleDto> {
    return this.get<OrganizationRoleDto>(`${this.base}/${roleId}`);
  }

  createRole(body: CreateOrganizationRoleDto): Promise<void> {
    return this.post<void, CreateOrganizationRoleDto>(this.base, body);
  }

  updateRole(roleId: string, body: UpdateOrganizationRoleDto): Promise<void> {
    return this.put<void, UpdateOrganizationRoleDto>(`${this.base}/${roleId}`, body);
  }

  deleteRole(roleId: string): Promise<void> {
    return this.delete<void>(`${this.base}/${roleId}`);
  }

  assignPermissions(body: RolePermissionMutationDto): Promise<void> {
    return this.post<void, RolePermissionMutationDto>(
      `${this.base}/permissions/assign`,
      body,
    );
  }

  revokePermissions(body: RolePermissionMutationDto): Promise<void> {
    return this.post<void, RolePermissionMutationDto>(
      `${this.base}/permissions/revoke`,
      body,
    );
  }

  updateRolePermissions(roleId: string, body: UpdateRolePermissionsDto): Promise<void> {
    return this.put<void, UpdateRolePermissionsDto>(
      `${this.base}/${roleId}/permissions`,
      body,
    );
  }

  getMemberRoles(memberId: string): Promise<ListMemberRolesResponseData> {
    return this.get<ListMemberRolesResponseData>(`${this.base}/members/${memberId}`);
  }

  assignMemberRole(body: MemberRoleMutationDto): Promise<void> {
    return this.post<void, MemberRoleMutationDto>(`${this.base}/members/assign`, body);
  }

  revokeMemberRole(body: MemberRoleMutationDto): Promise<void> {
    return this.post<void, MemberRoleMutationDto>(`${this.base}/members/revoke`, body);
  }
}
