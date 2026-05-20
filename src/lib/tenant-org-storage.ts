'use client';

const TENANT_ORG_MAP_STORAGE_KEY = 'tenant-org-map:v1';

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TenantOrgMap = Record<string, string>;

function normalizeKey(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function readTenantOrgMap(): TenantOrgMap {
  if (typeof window === 'undefined') return {};

  try {
    const rawValue = window.localStorage.getItem(TENANT_ORG_MAP_STORAGE_KEY);
    if (!rawValue) return {};

    const parsed = JSON.parse(rawValue) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<TenantOrgMap>((acc, [rawKey, rawValue]) => {
      const key = normalizeKey(rawKey);
      const value = typeof rawValue === 'string' ? rawValue.trim() : '';
      if (!key || !isUuidV4(value)) {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function writeTenantOrgMap(map: TenantOrgMap) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(TENANT_ORG_MAP_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore localStorage quota/unavailable issues.
  }
}

export function isUuidV4(value?: string | null) {
  return Boolean(value && UUID_V4_PATTERN.test(value.trim()));
}

export function getCachedOrganizationId(routeTenant?: string | null) {
  const normalizedRouteTenant = normalizeKey(routeTenant);
  if (!normalizedRouteTenant) return null;

  if (isUuidV4(normalizedRouteTenant)) {
    return normalizedRouteTenant;
  }

  return readTenantOrgMap()[normalizedRouteTenant] ?? null;
}

export function cacheTenantOrganization(params: {
  routeTenant?: string | null;
  organizationId?: string | null;
  organizationSlug?: string | null;
}) {
  const organizationId = params.organizationId?.trim() ?? '';
  if (!isUuidV4(organizationId)) return;

  const nextMap = readTenantOrgMap();
  const keys = [params.routeTenant, params.organizationSlug, organizationId]
    .map((value) => normalizeKey(value))
    .filter(Boolean);

  let hasChanged = false;
  keys.forEach((key) => {
    if (nextMap[key] === organizationId) return;
    nextMap[key] = organizationId;
    hasChanged = true;
  });

  if (hasChanged) {
    writeTenantOrgMap(nextMap);
  }
}
