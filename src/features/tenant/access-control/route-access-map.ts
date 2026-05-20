import { PERMISSIONS, type Permission } from './permissions';

export interface TenantRouteAccessRule {
  pattern: RegExp;
  requiredPermission?: Permission;
  anyPermissions?: Permission[];
}

export const tenantRouteAccessRules: TenantRouteAccessRule[] = [
  {
    pattern: /^\/documents(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.DOCUMENTS_LIST,
  },
  {
    pattern: /^\/organization-management\/invite-members(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.TENANT_INVITATIONS_LIST,
  },
  {
    pattern: /^\/organization-management\/members(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.TENANT_MEMBERS_LIST,
  },
  {
    pattern: /^\/organization-management\/roles-permissions(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.RBAC_ROLES_LIST,
  },
  {
    pattern: /^\/organization-management\/landing-page(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.TENANT_ORGANIZATIONS_MANAGE_LANDING_PAGE,
  },
  {
    pattern: /^\/organization-management\/landing-page-editor(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.TENANT_ORGANIZATIONS_MANAGE_LANDING_PAGE,
  },
  {
    pattern: /^\/analytics\/kpi(?:\/.*)?$/,
    anyPermissions: [
      PERMISSIONS.ANALYTICS_KPI_ORG_VIEW,
      PERMISSIONS.ANALYTICS_KPI_TARGET_VIEW,
      PERMISSIONS.ANALYTICS_KPI_TARGET_MANAGE,
    ],
  },
  {
    pattern: /^\/analytics\/periodic-reports(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.ANALYTICS_REPORTS_VIEW,
  },
  {
    pattern: /^\/analytics\/daily-reports\/team(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.PROJECTS_DAILY_REPORTS_VIEW_ALL,
  },
  {
    pattern: /^\/organization-management\/settings(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.ORG_CONFIG_SETTINGS_VIEW,
  },
  {
    pattern: /^\/organization-management\/working-time(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.ORG_CONFIG_WORKING_TIME_VIEW,
  },
  {
    pattern: /^\/billing(?:\/.*)?$/,
    requiredPermission: PERMISSIONS.BILLING_SUBSCRIPTIONS_VIEW,
  },
];

export function findTenantRouteAccessRule(pathname: string): TenantRouteAccessRule | undefined {
  return tenantRouteAccessRules.find((rule) => rule.pattern.test(pathname));
}
