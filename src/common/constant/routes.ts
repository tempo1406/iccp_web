function withProjectQuery(path: string, projectId?: string) {
  const normalizedProjectId = projectId?.trim();
  if (!normalizedProjectId) return path;
  return `${path}?projectId=${encodeURIComponent(normalizedProjectId)}`;
}

export const ROUTES = {
  // Platform (no tenant)
  home: '/',
  forbidden: '/403',
  notFoundPreview: '/404',
  login: '/login',
  dashboard: '/dashboard',
  dashboardProfile: '/dashboard/profile',
  dashboardCreate: '/dashboard/create',
  dashboardNotifications: '/dashboard/notifications',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyEmail: '/verify-email',
  resetPassword: '/reset-password',
  inviteAccept: '/invite/accept',
  projectInviteAccept: '/project-invites/accept',
  orgPublicLandingPage: (slug: string) => `/org/${slug}/landing-page`,

  // Platform admin
  platformAdmin: {
    root: '/platform-admin',
    tenants: '/platform-admin/tenants',
  },

  // Payment return pages (PayOS redirects here)
  payment: {
    success: '/payment/success',
    cancel: '/payment/cancel',
  },

  // Tenant dashboard  (dynamic)
  tenant: {
    root: (tenant: string) => `/tenant/${tenant}`,
    dashboard: (tenant: string) => `/tenant/${tenant}/dashboard`,
    myKpi: (tenant: string) => `/tenant/${tenant}/my-kpi`,
    projects: (tenant: string) => `/tenant/${tenant}/projects`,
    project: (tenant: string, slug: string) => `/tenant/${tenant}/projects/${slug}`,
    projectTab: (tenant: string, slug: string, tab: string) =>
      `/tenant/${tenant}/projects/${slug}/${tab}`,
    projectReports: (tenant: string, slug: string) =>
      `/tenant/${tenant}/projects/${slug}/reports`,
    documents: (tenant: string) => `/tenant/${tenant}/documents`,
    document: (tenant: string, id: string) => `/tenant/${tenant}/documents/${id}`,
    documentsApproval: (tenant: string) => `/tenant/${tenant}/documents/approval`,
    analytics: (tenant: string) => `/tenant/${tenant}/analytics`,
    analyticsDailyReports: (tenant: string) =>
      `/tenant/${tenant}/analytics/daily-reports`,
    analyticsDailyReportsByProject: (tenant: string, projectId: string) =>
      withProjectQuery(`/tenant/${tenant}/analytics/daily-reports`, projectId),
    analyticsTeamDailyReports: (tenant: string) =>
      `/tenant/${tenant}/analytics/daily-reports/team`,
    analyticsTeamDailyReportsByProject: (tenant: string, projectId: string) =>
      withProjectQuery(`/tenant/${tenant}/analytics/daily-reports/team`, projectId),
    analyticsPeriodicReports: (tenant: string) =>
      `/tenant/${tenant}/analytics/periodic-reports`,
    users: (tenant: string) => `/tenant/${tenant}/users`,
    teamChat: (tenant: string) => `/tenant/${tenant}/team-chat`,
    chatbot: (tenant: string) => `/tenant/${tenant}/chatbot`,
    chatbotConversation: (tenant: string, conversationId: string) =>
      `/tenant/${tenant}/chatbot/${conversationId}`,
    organizationManagement: (tenant: string) =>
      `/tenant/${tenant}/organization-management`,
    organizationInviteMembers: (tenant: string) =>
      `/tenant/${tenant}/organization-management/invite-members`,
    organizationMembers: (tenant: string) =>
      `/tenant/${tenant}/organization-management/members`,
    organizationRolesPermissions: (tenant: string) =>
      `/tenant/${tenant}/organization-management/roles-permissions`,
    organizationProfile: (tenant: string) =>
      `/tenant/${tenant}/organization-management/profile`,
    organizationSettings: (tenant: string) =>
      `/tenant/${tenant}/organization-management/settings`,
    orgKpiSettings: (tenant: string) =>
      `/tenant/${tenant}/organization-management/settings`,
    orgWorkingTime: (tenant: string) =>
      `/tenant/${tenant}/organization-management/working-time`,
    settings: (tenant: string) => `/tenant/${tenant}/settings`,
    settingsBranding: (tenant: string) => `/tenant/${tenant}/settings/branding`,
    settingsWorkflow: (tenant: string) => `/tenant/${tenant}/settings/workflow`,
    settingsIntegrations: (tenant: string) =>
      `/tenant/${tenant}/settings/integrations`,
    profile: (tenant: string) => `/tenant/${tenant}/profile`,
    ticket: (tenant: string) => `/tenant/${tenant}/ticket`,
    ticketList: (tenant: string) => `/tenant/${tenant}/ticket/list`,
    ticketCreate: (tenant: string) => `/tenant/${tenant}/ticket/create`,
    ticketDetail: (tenant: string, ticketId: string) =>
      `/tenant/${tenant}/ticket/${ticketId}`,
    ticketDeclareOt: (tenant: string, ticketId: string) =>
      `/tenant/${tenant}/ticket/${ticketId}/declare-ot`,
    notifications: (tenant: string) => `/tenant/${tenant}/notifications`,
    billing: (tenant: string) => `/tenant/${tenant}/billing`,
    organizationLandingPage: (tenant: string) => `/tenant/${tenant}/organization-management/landing-page`,
    admin: (tenant: string) => `/tenant/${tenant}/admin`,
    adminAuditLogs: (tenant: string) => `/tenant/${tenant}/admin/audit-logs`,
    adminGdriveSync: (tenant: string) => `/tenant/${tenant}/admin/gdrive-sync`,
  },
} as const;
