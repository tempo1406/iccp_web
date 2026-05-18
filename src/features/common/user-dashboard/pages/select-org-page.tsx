'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, ShieldCheck, AlertTriangle, LayoutGrid, Rows3 } from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { WorkspaceLoading } from '@/components/shared/loading-workspace';
import { Button } from '@/components/ui/button';
import { cacheTenantOrganization } from '@/lib/tenant-org-storage';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrgCard, OrgListSkeleton } from '../components/org-card';
import { useMyOrgs } from '../hooks/use-my-orgs';
import type { OrganizationDto } from '@/services/organizations/types';

type WorkspaceViewMode = 'grid' | 'table';

interface WorkspaceLoadingState {
  workspaceName: string;
  workspaceLogoUrl?: string | null;
  progress: number;
}

function getOrgInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'ORG';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function SelectOrgPage() {
  const t = useTranslations('dashboard.workspace');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orgs, isLoading, isError } = useMyOrgs();
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('grid');
  const [workspaceLoading, setWorkspaceLoading] = useState<WorkspaceLoadingState | null>(
    null,
  );
  const inviteState = searchParams.get('invite');
  const inviteOrgId = searchParams.get('inviteOrg');
  const loadingTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const displayedOrgs = useMemo(() => {
    if (!inviteOrgId) {
      return orgs;
    }

    const invitedOrg = orgs.find((org) => org.id === inviteOrgId);
    if (!invitedOrg) {
      return orgs;
    }

    return [invitedOrg, ...orgs.filter((org) => org.id !== inviteOrgId)];
  }, [orgs, inviteOrgId]);

  const invitedOrgName = useMemo(() => {
    if (!inviteOrgId) {
      return null;
    }

    return displayedOrgs.find((org) => org.id === inviteOrgId)?.name ?? null;
  }, [displayedOrgs, inviteOrgId]);

  const clearLoadingTimers = () => {
    loadingTimersRef.current.forEach((timerId) => clearTimeout(timerId));
    loadingTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearLoadingTimers();
  }, []);

  function selectOrg(org: OrganizationDto) {
    if (workspaceLoading) return;

    cacheTenantOrganization({
      routeTenant: org.id,
      organizationId: org.id,
      organizationSlug: org.slug,
    });

    clearLoadingTimers();
    setWorkspaceLoading({
      workspaceName: org.name,
      workspaceLogoUrl: org.logoUrl,
      progress: 8,
    });

    const checkpoints = [24, 43, 66, 84, 96, 100];
    checkpoints.forEach((progress, index) => {
      const timerId = setTimeout(() => {
        setWorkspaceLoading((current) =>
          current ? { ...current, progress } : current,
        );
      }, (index + 1) * 220);
      loadingTimersRef.current.push(timerId);
    });

    const navigateTimerId = setTimeout(() => {
      router.push(ROUTES.tenant.dashboard(org.slug));
    }, 1500);
    loadingTimersRef.current.push(navigateTimerId);
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('title')}
          </h3>
          <p className="text-base text-slate-500 dark:text-slate-400">{t('description')}</p>
        </div>

        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'grid' || value === 'table') setViewMode(value);
            }}
            variant="outline"
            className="h-10 rounded-xl border border-slate-200/70 bg-white/80 p-0.5 dark:border-slate-700 dark:bg-slate-900/60"
          >
            <ToggleGroupItem
              value="grid"
              className="h-9 w-9 rounded-lg px-0"
              aria-label={t('gridView')}
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="table"
              className="h-9 w-9 rounded-lg px-0"
              aria-label={t('tableView')}
            >
              <Rows3 className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button onClick={() => router.push(ROUTES.dashboardCreate)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('createOrganization')}
          </Button>
        </div>
      </div>

      <div className="w-full">
        {inviteState === 'accepted' && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
            {t('inviteAccepted')}
            {invitedOrgName ? ` ${t('invitePinned', { name: invitedOrgName })}` : ''}
          </div>
        )}

        {isLoading ? (
          <OrgListSkeleton count={6} />
        ) : isError ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-900/10">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {t('loadFailed')}
            </p>
          </div>
        ) : displayedOrgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/30">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h4 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              {t('emptyTitle')}
            </h4>
            <p className="mb-7 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              {t('emptyDescription')}
            </p>
            <button
              onClick={() => router.push(ROUTES.dashboardCreate)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-500/40"
            >
              <Plus className="h-4 w-4" />
              {t('createOrganization')}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {displayedOrgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onClick={selectOrg}
                isHighlighted={Boolean(inviteOrgId) && org.id === inviteOrgId}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('workspaceColumn')}</TableHead>
                    <TableHead>{t('industryColumn')}</TableHead>
                    <TableHead>{t('statusColumn')}</TableHead>
                    <TableHead className="text-right">{t('actionColumn')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedOrgs.map((org) => (
                    <TableRow
                      key={org.id}
                      className={
                        inviteOrgId && org.id === inviteOrgId
                          ? 'bg-emerald-50/70 hover:bg-emerald-100/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30'
                          : undefined
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 rounded-lg">
                            <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
                            <AvatarFallback className="rounded-lg text-xs font-bold">
                              {getOrgInitials(org.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {org.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {org.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{org.industry ?? '--'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={org.isActive ? 'default' : 'secondary'}
                          className={org.isActive ? 'bg-emerald-600 text-white' : ''}
                        >
                          {org.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => selectOrg(org)}>
                          {t('openWorkspace')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {workspaceLoading && (
        <WorkspaceLoading
          workspaceName={workspaceLoading.workspaceName}
          workspaceLogoUrl={workspaceLoading.workspaceLogoUrl}
          progress={workspaceLoading.progress}
        />
      )}
    </div>
  );
}
