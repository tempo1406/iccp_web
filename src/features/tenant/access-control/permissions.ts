/**
 * RBAC Permission constants.
 *
 * Format mirrors backend permission codes.
 * Source of truth: GET /api/v1/rbac/me -> data.permissions
 */
export const PERMISSIONS = {
  // Tenant members
  TENANT_MEMBERS_LIST: 'tenant.members.list',
  TENANT_MEMBERS_VIEW: 'tenant.members.view',
  TENANT_MEMBERS_ADD: 'tenant.members.add',
  TENANT_MEMBERS_UPDATE: 'tenant.members.update',
  TENANT_MEMBERS_REMOVE: 'tenant.members.remove',

  // Tenant organizations
  TENANT_ORGANIZATIONS_LIST: 'tenant.organizations.list',
  TENANT_ORGANIZATIONS_VIEW: 'tenant.organizations.view',
  TENANT_ORGANIZATIONS_CREATE: 'tenant.organizations.create',
  TENANT_ORGANIZATIONS_UPDATE: 'tenant.organizations.update',
  TENANT_ORGANIZATIONS_DELETE: 'tenant.organizations.delete',
  TENANT_ORGANIZATIONS_MANAGE_SETTINGS: 'tenant.organizations.manage_settings',
  TENANT_ORGANIZATIONS_TRANSFER_OWNERSHIP: 'tenant.organizations.transfer_ownership',
  TENANT_ORGANIZATIONS_MANAGE_LANDING_PAGE: 'tenant.organizations.manage_landing_page',

  // Tenant invitations
  TENANT_INVITATIONS_LIST: 'tenant.invitations.list',
  TENANT_INVITATIONS_CREATE: 'tenant.invitations.create',
  TENANT_INVITATIONS_CANCEL: 'tenant.invitations.cancel',
  TENANT_INVITATIONS_RESEND: 'tenant.invitations.resend',
  TENANT_INVITATIONS_ACCEPT: 'tenant.invitations.accept',

  // Ticket requests
  TICKET_REQUESTS_CREATE: 'ticket_requests.create',
  TICKET_REQUESTS_CREATE_OVERTIME: 'ticket_requests.create_overtime',
  TICKET_REQUESTS_LIST_OWN: 'ticket_requests.list_own',
  TICKET_REQUESTS_LIST_ORG: 'ticket_requests.list_org',
  TICKET_REQUESTS_VIEW: 'ticket_requests.view',
  TICKET_REQUESTS_UPDATE_OWN: 'ticket_requests.update_own',
  TICKET_REQUESTS_CANCEL_OWN: 'ticket_requests.cancel_own',
  TICKET_REQUESTS_APPROVE: 'ticket_requests.approve',
  TICKET_REQUESTS_DELEGATE: 'ticket_requests.delegate',
  TICKET_REQUESTS_COMMENT: 'ticket_requests.comment',

  // Documents
  // Documents — core
  DOCUMENTS_LIST: 'documents.list',
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_CREATE: 'documents.create',
  DOCUMENTS_UPDATE: 'documents.update',
  DOCUMENTS_DELETE: 'documents.delete',
  DOCUMENTS_DOWNLOAD: 'documents.download',
  DOCUMENTS_UPLOAD: 'documents.upload',
  DOCUMENTS_MANAGE_ACCESS: 'documents.access.manage',
  DOCUMENTS_VERSIONS_UPLOAD: 'documents.versions.create',
  DOCUMENTS_VIEW_METADATA: 'documents.metadata.view',
  DOCUMENTS_UPDATE_METADATA: 'documents.metadata.update',
  DOCUMENTS_VIEW_CHUNKS: 'documents.chunks.view',
  DOCUMENTS_EDIT_CHUNKS: 'documents.chunks.edit',
  DOCUMENTS_CREATE_VERSION: 'documents.versions.create',
  DOCUMENTS_LIST_VERSIONS: 'documents.versions.list',
  DOCUMENTS_VIEW_VERSION: 'documents.versions.view',
  DOCUMENTS_RESTORE_VERSION: 'documents.versions.restore',
  DOCUMENTS_VIEW_ACCESS: 'documents.access.view',
  DOCUMENTS_ACCESS_MANAGE: 'documents.access.manage',
  // Documents — folders
  DOCUMENTS_FOLDERS_LIST: 'documents.folders.list',
  DOCUMENTS_FOLDERS_VIEW: 'documents.folders.view',
  DOCUMENTS_FOLDERS_CREATE: 'documents.folders.create',
  DOCUMENTS_FOLDERS_UPDATE: 'documents.folders.update',
  DOCUMENTS_FOLDERS_DELETE: 'documents.folders.delete',
  DOCUMENTS_FOLDERS_MOVE: 'documents.folders.move',
  // Documents — categories
  DOCUMENTS_CATEGORIES_LIST: 'documents.categories.list',
  DOCUMENTS_CATEGORIES_VIEW: 'documents.categories.view',
  DOCUMENTS_CATEGORIES_CREATE: 'documents.categories.create',
  DOCUMENTS_CATEGORIES_UPDATE: 'documents.categories.update',
  DOCUMENTS_CATEGORIES_DELETE: 'documents.categories.delete',

  // Org Config
  ORG_CONFIG_SETTINGS_VIEW: 'org_config.settings.view',
  ORG_CONFIG_SETTINGS_MANAGE: 'org_config.settings.manage',
  ORG_CONFIG_WORKING_TIME_VIEW: 'org_config.working_time.view',
  ORG_CONFIG_WORKING_TIME_MANAGE: 'org_config.working_time.manage',

  // Analytics
  ANALYTICS_DASHBOARD_VIEW: 'analytics.dashboard.view',
  ANALYTICS_CHAT_VIEW: 'analytics.chat.view',
  ANALYTICS_DOCUMENTS_VIEW: 'analytics.documents.view',
  ANALYTICS_REPORTS_VIEW: 'analytics.reports.view',
  ANALYTICS_REPORTS_SEND: 'analytics.reports.send',
  ANALYTICS_USERS_ACTIVITY_VIEW: 'analytics.users.activity.view',
  ANALYTICS_KPI_ORG_VIEW: 'analytics.kpi.org.view',
  ANALYTICS_KPI_TARGET_MANAGE: 'analytics.kpi.target.manage',
  ANALYTICS_KPI_TARGET_VIEW: 'analytics.kpi.target.view',
  ANALYTICS_KPI_PROJECT_VIEW: 'analytics.kpi.project.view',
  PROJECTS_DAILY_REPORTS_VIEW_ALL: 'projects.daily_reports.view_all',
  DAILY_REPORTS_TEAM_VIEW: 'projects.daily_reports.view_all',

  // Projects
  PROJECTS_LIST: 'projects.list',
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',
  PROJECTS_MEMBERS_LIST: 'projects.members.list',
  PROJECTS_MEMBERS_UPDATE: 'projects.members.update',
  PROJECTS_MEMBERS_REMOVE: 'projects.members.remove',
  PROJECTS_MEMBERS_MANAGE: 'projects.members.manage',
  PROJECTS_STATUSES_LIST: 'projects.statuses.list',
  PROJECTS_STATUSES_CREATE: 'projects.statuses.create',
  PROJECTS_STATUSES_UPDATE: 'projects.statuses.update',
  PROJECTS_STATUSES_DELETE: 'projects.statuses.delete',
  PROJECTS_TASKS_LIST: 'projects.tasks.list',
  PROJECTS_TASKS_VIEW: 'projects.tasks.view',
  PROJECTS_TASKS_CREATE: 'projects.tasks.create',
  PROJECTS_TASKS_UPDATE: 'projects.tasks.update',
  PROJECTS_TASKS_ASSIGN: 'projects.tasks.assign',
  PROJECTS_TASKS_CHANGE_STATUS: 'projects.tasks.change_status',
  PROJECTS_TASKS_DELETE: 'projects.tasks.delete',
  PROJECTS_TASKS_LOG_TIME: 'projects.tasks.log_time',
  PROJECTS_ATTACHMENTS_LIST: 'projects.attachments.list',
  PROJECTS_ATTACHMENTS_UPLOAD: 'projects.attachments.upload',
  PROJECTS_ATTACHMENTS_DELETE: 'projects.attachments.delete',
  PROJECTS_ROLES_LIST: 'projects.roles.list',
  PROJECTS_ROLES_VIEW: 'projects.roles.view',
  PROJECTS_ROLES_CREATE: 'projects.roles.create',
  PROJECTS_ROLES_UPDATE: 'projects.roles.update',
  PROJECTS_ROLES_DELETE: 'projects.roles.delete',
  PROJECTS_ROLES_ASSIGN_PERMISSIONS: 'projects.roles.assign_permissions',
  PROJECTS_ROLES_REVOKE_PERMISSIONS: 'projects.roles.revoke_permissions',
  PROJECTS_ROLES_ASSIGN_TO_MEMBER: 'projects.roles.assign_to_member',
  PROJECTS_ROLES_REVOKE_FROM_MEMBER: 'projects.roles.revoke_from_member',

  // RBAC
  RBAC_ROLES_LIST: 'rbac.roles.list',
  RBAC_ROLES_VIEW: 'rbac.roles.view',
  RBAC_ROLES_CREATE: 'rbac.roles.create',
  RBAC_ROLES_UPDATE: 'rbac.roles.update',
  RBAC_ROLES_DELETE: 'rbac.roles.delete',
  RBAC_ROLES_ASSIGN_PERMISSIONS: 'rbac.roles.assign_permissions',
  RBAC_ROLES_REVOKE_PERMISSIONS: 'rbac.roles.revoke_permissions',
  RBAC_USER_ROLES_LIST: 'rbac.user_roles.list',
  RBAC_USER_ROLES_VIEW: 'rbac.user_roles.view',
  RBAC_USER_ROLES_ASSIGN: 'rbac.user_roles.assign',
  RBAC_USER_ROLES_REVOKE: 'rbac.user_roles.revoke',
  RBAC_PERMISSIONS_VIEW: 'rbac.permissions.view',
  RBAC_PERMISSIONS_LIST: 'rbac.permissions.list',
  RBAC_PERMISSIONS_CREATE: 'rbac.permissions.create',
  RBAC_PERMISSIONS_UPDATE: 'rbac.permissions.update',
  RBAC_PERMISSIONS_DELETE: 'rbac.permissions.delete',
  RBAC_PERMISSIONS_SYNC: 'rbac.permissions.sync',

  // Chatbot
  CHATBOT_USE: 'chatbot.use',
  CHATBOT_CONVERSATIONS_LIST: 'chatbot.conversations.list',
  CHATBOT_CONVERSATIONS_CREATE: 'chatbot.conversations.create',

  // Notifications
  NOTIFICATIONS_CAMPAIGNS_LIST: 'notifications.campaigns.list',
  NOTIFICATIONS_CAMPAIGNS_CREATE: 'notifications.campaigns.create',
  NOTIFICATIONS_CAMPAIGNS_VIEW: 'notifications.campaigns.view',

  // Billing
  BILLING_SUBSCRIPTIONS_VIEW: 'billing.subscriptions.view',
  BILLING_SUBSCRIPTIONS_CREATE: 'billing.subscriptions.create',
  BILLING_SUBSCRIPTIONS_CANCEL: 'billing.subscriptions.cancel',
  BILLING_SUBSCRIPTIONS_CHANGE_PLAN: 'billing.subscriptions.change_plan',
  BILLING_INVOICES_LIST: 'billing.invoices.list',

  // Aliases for organization-management nav and page grouping
  ORGANIZATION_INVITATIONS_MANAGE: 'tenant.invitations.create',
  ORGANIZATION_MEMBERS_MANAGE: 'tenant.members.list',
  ORGANIZATION_ROLES_MANAGE: 'rbac.roles.list',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
