export const orgConfigKeys = {
  root: (tenantId: string | null | undefined) =>
    ['org-config', tenantId] as const,

  settings: (tenantId: string | null | undefined) =>
    ['org-config', tenantId, 'settings'] as const,

  workingTime: (tenantId: string | null | undefined) =>
    ['org-config', tenantId, 'working-time'] as const,

  holidays: (tenantId: string | null | undefined) =>
    ['org-config', tenantId, 'holidays'] as const,
};
