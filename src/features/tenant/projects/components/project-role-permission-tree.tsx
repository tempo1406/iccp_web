'use client';

import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { PermissionModuleNode } from '../hooks/use-project-roles-management-view';

interface ProjectRolePermissionTreeProps {
  title: string;
  selectedCount: number;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  modules: PermissionModuleNode[];
  isLoading: boolean;
  emptyMessage?: string;
  isPermissionChecked: (permissionCode: string) => boolean;
  getGroupState: (permissionCodes: string[]) => boolean | 'indeterminate';
  onTogglePermission: (permissionCode: string, checked: boolean) => void;
  onToggleGroup: (permissionCodes: string[], checked: boolean) => void;
  isPermissionDisabled: (checked: boolean) => boolean;
  isGroupDisabled: (state: boolean | 'indeterminate') => boolean;
}

export function ProjectRolePermissionTree({
  title,
  selectedCount,
  searchQuery,
  onSearchQueryChange,
  modules,
  isLoading,
  emptyMessage = 'No permission found.',
  isPermissionChecked,
  getGroupState,
  onTogglePermission,
  onToggleGroup,
  isPermissionDisabled,
  isGroupDisabled,
}: ProjectRolePermissionTreeProps) {
  const t = useTranslations('project.permissionTree');
  const commonT = useTranslations('project.common');

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs">{commonT('selected', { count: selectedCount })}</p>
        </div>
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">{t('loading')}</p>
      ) : (
        <ScrollArea className="h-80 rounded-md border p-2">
          <div className="space-y-3 pr-1">
            {modules.length === 0 && (
              <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            )}
            {modules.map((module) => (
              <div key={module.key} className="space-y-1.5">
                <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
                  {module.label}
                </p>
                <Accordion type="multiple" className="rounded-md border">
                  {module.groups.map((group) => {
                    const permissionCodes = group.permissions.map((permission) => permission.code);
                    const groupState = getGroupState(permissionCodes);
                    return (
                      <AccordionItem
                        key={`${module.key}-${group.key}`}
                        value={`${module.key}-${group.key}`}
                        className="last:border-b-0"
                      >
                        <div className="flex items-center gap-2.5 px-3">
                          <Checkbox
                            checked={groupState}
                            disabled={isGroupDisabled(groupState)}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={(nextChecked) =>
                              onToggleGroup(permissionCodes, Boolean(nextChecked))
                            }
                          />
                          <AccordionTrigger className="gap-3 py-2.5 hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pr-1 text-left">
                              <div>
                                <p className="text-sm font-medium">{group.label}</p>
                                <p className="text-muted-foreground text-[11px]">
                                  {t('permissionsCount', { count: group.permissions.length })}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent className="px-3 pb-2.5">
                          <div className="space-y-0.5">
                            {group.permissions.map((permission) => {
                              const checked = isPermissionChecked(permission.code);
                              return (
                                <label
                                  key={permission.code}
                                  className="hover:bg-muted/60 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5"
                                >
                                  <Checkbox
                                    checked={checked}
                                    disabled={isPermissionDisabled(checked)}
                                    onCheckedChange={(nextChecked) =>
                                      onTogglePermission(permission.code, Boolean(nextChecked))
                                    }
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-[13px] font-medium leading-snug">
                                      {permission.childLabel}
                                    </p>
                                    <p className="text-muted-foreground truncate text-[11px] font-mono leading-snug">
                                      {permission.code}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
