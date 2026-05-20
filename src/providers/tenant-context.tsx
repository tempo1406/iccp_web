'use client';

/**
 * src/providers/tenant-context.tsx
 *
 * Lightweight React context that stores:
 * - tenantId: the route segment from [tenant], used for building tenant URLs
 * - organizationId: the resolved UUID v4 used for backend headers
 */

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authTokens } from '@/services/local-storage/auth.storage';
import { OrganizationService } from '@/services/organizations/organization.service';
import { cacheTenantOrganization, getCachedOrganizationId, isUuidV4 } from '@/lib/tenant-org-storage';

interface TenantContextValue {
  /** The tenant route segment from the URL, e.g. "acme" or a UUID */
  tenantId: string;
  /** Backward-compatible alias for existing feature modules */
  tenantSlug: string;
  /** The resolved organization UUID v4 used for x-organization-id */
  organizationId: string | null;
  /** False while resolving a slug-like tenant route into an organization UUID */
  isOrganizationResolved: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export { TenantContext };

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function upsertMeta(
  key: string,
  attribute: 'name' | 'property',
  attributeValue: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[data-tenant-dynamic-meta="${key}"]`,
  );

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attributeValue);
    element.setAttribute('data-tenant-dynamic-meta', key);
    document.head.appendChild(element);
  }

  element.setAttribute(attribute, attributeValue);
  element.setAttribute('content', content);
}

function inferIconType(href: string): string | null {
  if (href.startsWith('data:image/svg+xml')) return 'image/svg+xml';

  const normalizedHref = href.split('?')[0].toLowerCase();

  if (normalizedHref.endsWith('.svg')) return 'image/svg+xml';
  if (normalizedHref.endsWith('.png')) return 'image/png';
  if (normalizedHref.endsWith('.webp')) return 'image/webp';
  if (normalizedHref.endsWith('.jpg') || normalizedHref.endsWith('.jpeg')) return 'image/jpeg';
  if (normalizedHref.endsWith('.ico')) return 'image/x-icon';

  return null;
}

function buildInitialsFavicon(label: string): string {
  const initials = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ORG';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="#f4f0ff" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff" stroke-width="3" />
      <text
        x="32"
        y="39"
        text-anchor="middle"
        font-size="24"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="#6d28d9"
      >${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildTenantFaviconUrl(logoUrl: string, label: string, version: string): string {
  const params = new URLSearchParams({
    src: logoUrl,
    label,
    v: version,
  });
  return `/api/tenant-favicon?${params.toString()}`;
}

function buildIconLink(rel: string, href: string): HTMLLinkElement {
  const element = document.createElement('link');
  const iconType = inferIconType(href);
  element.setAttribute('rel', rel);
  element.setAttribute('href', href);
  element.setAttribute('data-tenant-dynamic-icon', 'true');

  if (iconType) {
    element.setAttribute('type', iconType);
  } else {
    element.removeAttribute('type');
  }

  if (iconType === 'image/svg+xml') {
    element.setAttribute('sizes', 'any');
  } else {
    element.removeAttribute('sizes');
  }

  return element;
}

function replaceIconLinks(href: string) {
  document.head
    .querySelectorAll('link[data-tenant-dynamic-icon="true"]')
    .forEach((element) => element.remove());

  document.head.appendChild(buildIconLink('icon', href));
  document.head.appendChild(buildIconLink('shortcut icon', href));
  document.head.appendChild(buildIconLink('apple-touch-icon', href));
}

function removeDynamicMetaTags() {
  document.head
    .querySelectorAll('meta[data-tenant-dynamic-meta]')
    .forEach((element) => element.remove());
}

function removeDynamicIconLinks() {
  document.head
    .querySelectorAll('link[data-tenant-dynamic-icon="true"]')
    .forEach((element) => element.remove());
}

export function TenantProvider({
  tenantId,
  tenantSlug,
  children,
}: {
  tenantId?: string;
  tenantSlug?: string;
  children: React.ReactNode;
}) {
  const routeTenant = (tenantId ?? tenantSlug ?? '').trim();
  const normalizedTenantId = routeTenant;
  const [cachedOrganizationId, setCachedOrganizationId] = useState<string | null>(() =>
    getCachedOrganizationId(normalizedTenantId),
  );
  const hasToken = Boolean(authTokens.getAccess());
  const shouldResolveOrganization =
    normalizedTenantId.length > 0 && !isUuidV4(normalizedTenantId) && !cachedOrganizationId;

  const organizationsQuery = useQuery({
    queryKey: ['tenant-context', 'organizations', normalizedTenantId],
    queryFn: () => new OrganizationService().getMyOrgs(),
    enabled: hasToken && shouldResolveOrganization,
    staleTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    setCachedOrganizationId(getCachedOrganizationId(normalizedTenantId));
  }, [normalizedTenantId]);

  useEffect(() => {
    const matchedOrganization = organizationsQuery.data?.find(
      (organization) =>
        organization.id === normalizedTenantId ||
        organization.slug.toLowerCase() === normalizedTenantId.toLowerCase(),
    );

    if (!matchedOrganization) return;

    cacheTenantOrganization({
      routeTenant: normalizedTenantId,
      organizationId: matchedOrganization.id,
      organizationSlug: matchedOrganization.slug,
    });
    setCachedOrganizationId(matchedOrganization.id);
  }, [organizationsQuery.data, normalizedTenantId]);

  const value = useMemo<TenantContextValue>(() => {
    const organizationId = isUuidV4(normalizedTenantId)
      ? normalizedTenantId
      : cachedOrganizationId;

    return {
      tenantId: normalizedTenantId,
      tenantSlug: normalizedTenantId,
      organizationId,
      isOrganizationResolved:
        normalizedTenantId.length === 0 ||
        isUuidV4(normalizedTenantId) ||
        Boolean(organizationId) ||
        organizationsQuery.isError ||
        (!organizationsQuery.isPending && !shouldResolveOrganization) ||
        (!organizationsQuery.isPending && Boolean(organizationsQuery.data)),
    };
  }, [
    cachedOrganizationId,
    normalizedTenantId,
    organizationsQuery.data,
    organizationsQuery.isError,
    organizationsQuery.isPending,
    shouldResolveOrganization,
  ]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useOptionalTenant(): TenantContextValue | null {
  return useContext(TenantContext);
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used inside <TenantProvider>');
  }
  return ctx;
}
