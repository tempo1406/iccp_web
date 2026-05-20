'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, FolderKanban, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ROUTES } from '@/common/constant/routes';
import { cn } from '@/lib/utils';
import { useOptionalTenant } from '@/providers';
import {
  type TeamChatProjectOption,
  type TeamChatRoomScopeFilterControls,
} from '../lib/team-chat-scope.shared';
import { type TeamChatSupportedContextScope } from '../services/types/team-chat.types';

interface TeamChatRoomScopeFilterProps
  extends Pick<
    TeamChatRoomScopeFilterControls,
    | 'scope'
    | 'projectId'
    | 'projects'
    | 'loadingProjects'
    | 'projectErrorMessage'
    | 'onScopeChange'
    | 'onProjectChange'
  > {
  className?: string;
  mode?: 'compact' | 'dialog';
  scopeLabel?: string;
  projectLabel?: string;
  projectPlaceholder?: string;
  hint?: ReactNode | null;
}

function normalizeProjectValue(
  projectId: string,
  projects: TeamChatProjectOption[],
) {
  return projects.some((project) => project.id === projectId) ? projectId : undefined;
}

export function TeamChatRoomScopeFilter({
  scope,
  projectId,
  projects,
  loadingProjects,
  projectErrorMessage,
  onScopeChange,
  onProjectChange,
  className,
  mode = 'compact',
  scopeLabel,
  projectLabel,
  projectPlaceholder,
  hint,
}: TeamChatRoomScopeFilterProps) {
  const t = useTranslations('teamChat');
  const tenant = useOptionalTenant();
  const hasProjects = projects.length > 0;
  const isCompact = mode === 'compact';
  const shouldShowProjectPicker = scope === 'project';
  const normalizedProjectValue = normalizeProjectValue(projectId, projects);
  const emptyProjectsHref = tenant ? ROUTES.tenant.projects(tenant.tenantId) : null;
  const resolvedScopeLabel = scopeLabel ?? t('scopeFilter.scope');
  const resolvedProjectLabel = projectLabel ?? t('scopeFilter.project');
  const resolvedProjectPlaceholder = projectPlaceholder ?? t('scopeFilter.selectProject');
  const helperText =
    projectErrorMessage ??
    (!loadingProjects && !hasProjects
      ? emptyProjectsHref
        ? (
            <>
              {t('scopeFilter.noProjects')}{' '}
              <Link
                href={emptyProjectsHref}
                className="cursor-pointer font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                {t('scopeFilter.createOne')}
              </Link>
            </>
        )
        : t('scopeFilter.noAccessibleProjects')
      : hint ?? null);

  const handleScopeChange = (value: string) => {
    if (!value) return;
    onScopeChange(value as TeamChatSupportedContextScope);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {!isCompact ? (
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-medium text-foreground">{resolvedScopeLabel}</label>
          {shouldShowProjectPicker ? (
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[10px] font-medium">
              {t('scopeFilter.projectScoped')}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          'flex gap-2',
          'flex-col',
        )}
      >
        <ToggleGroup
          type="single"
          value={scope}
          onValueChange={handleScopeChange}
          variant="outline"
          size={isCompact ? 'sm' : 'default'}
          className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-border bg-background/80 p-1"
        >
          <ToggleGroupItem
            value="organization"
            className="w-full cursor-pointer justify-center rounded-xl px-3 text-center text-xs font-semibold sm:text-sm"
          >
            <Building2 className="h-4 w-4" />
            {t('common.organizationShort')}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="project"
            disabled={!loadingProjects && !hasProjects}
            className="w-full cursor-pointer justify-center rounded-xl px-3 text-center text-xs font-semibold sm:text-sm"
          >
            <FolderKanban className="h-4 w-4" />
            {t('common.project')}
          </ToggleGroupItem>
        </ToggleGroup>

        {shouldShowProjectPicker ? (
          <div className="min-w-0 w-full space-y-2">
            {!isCompact ? (
              <label className="text-sm font-medium text-foreground">{resolvedProjectLabel}</label>
            ) : null}

            <Select
              value={normalizedProjectValue}
              onValueChange={onProjectChange}
              disabled={loadingProjects || !hasProjects}
            >
              <SelectTrigger
                className={cn(
                  'cursor-pointer rounded-2xl border-border bg-background',
                  isCompact ? 'h-10 w-full' : 'h-11 w-full',
                )}
              >
                <SelectValue
                  placeholder={
                    loadingProjects ? t('scopeFilter.loadingProjects') : resolvedProjectPlaceholder
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border">
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className="cursor-pointer rounded-xl"
                  >
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      {loadingProjects && shouldShowProjectPicker ? (
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('scopeFilter.loadingAccessibleProjects')}
        </p>
      ) : helperText ? (
        <p
          className={cn(
            'text-xs leading-5',
            projectErrorMessage ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

