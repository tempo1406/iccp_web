'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  MoreHorizontal,
  Settings,
  SquarePen,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useAppSelector } from '@/store';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown } from 'lucide-react';
import { ROUTES } from '@/common/constant/routes';
import { toast } from '@/lib/toast';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import {
  useProjectById,
  useDeleteProject,
  useProjectRolesMe,
  useProjectMembers,
  useProjectRoles,
  useUpdateProject,
} from '../query/use-projects';
import { ProjectDetailTabNav } from '../components/project-detail-tab-nav';
import { ProjectSettingsDialog } from '../components/project-settings-dialog';
import { InviteProjectMemberDialog } from '../components/invite-project-member-dialog';
import { ProjectRealtimeBridge } from '../realtime/project-realtime-bridge';
import { useConfirmAlertDialog } from '../hooks/use-confirm-alert-dialog';
import type { ProjectPriority, ProjectResponse, ProjectStatus, UpdateProjectRequest } from '../services/projects.service';

type ProjectBudgetCurrency = 'USD' | 'VND';

interface ProjectSettingsFormState {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate: string;
  managerId: string[];
  estimatedBudget: string;
  actualBudget: string;
  budgetCurrency: ProjectBudgetCurrency;
}

type ProjectSettingsErrors = Partial<
  Record<'name' | 'endDate' | 'estimatedBudget' | 'actualBudget' | 'budgetCurrency', string>
>;

function getProjectStatusOptions(
  t: ReturnType<typeof useTranslations<'project.detail.status'>>,
): Array<{ value: ProjectStatus; label: string }> {
  return [
    { value: 'planning', label: t('planning') },
    { value: 'active', label: t('active') },
    { value: 'on_hold', label: t('on_hold') },
    { value: 'completed', label: t('completed') },
    { value: 'cancelled', label: t('cancelled') },
  ];
}

function getProjectPriorityOptions(
  t: ReturnType<typeof useTranslations<'project.detail.priority'>>,
): Array<{ value: ProjectPriority; label: string }> {
  return [
    { value: 'low', label: t('low') },
    { value: 'medium', label: t('medium') },
    { value: 'high', label: t('high') },
    { value: 'critical', label: t('critical') },
  ];
}

function toDateInputValue(value?: string | null): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function toOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function normalizeManagerIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function resolveProjectMemberLabel(member: {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
}): string {
  const firstName = member.user?.firstName ?? member.firstName ?? '';
  const lastName = member.user?.lastName ?? member.lastName ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;

  const email = (member.user?.email ?? member.email ?? '').trim();
  if (email) return email;

  return member.userId;
}

function mapProjectToSettingsForm(project: ProjectResponse | undefined): ProjectSettingsFormState {
  const currency = project?.budgetCurrency;
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'planning',
    priority: project?.priority ?? 'medium',
    startDate: toDateInputValue(project?.startDate),
    endDate: toDateInputValue(project?.endDate),
    managerId: normalizeManagerIds(project?.managerId),
    estimatedBudget: project?.estimatedBudget != null ? String(project.estimatedBudget) : '',
    actualBudget: project?.actualBudget != null ? String(project.actualBudget) : '',
    budgetCurrency: currency === 'USD' || currency === 'VND' ? currency : 'VND',
  };
}

function validateProjectSettingsForm(
  state: ProjectSettingsFormState,
  t: ReturnType<typeof useTranslations<'project.detail.validation'>>,
): ProjectSettingsErrors {
  const errors: ProjectSettingsErrors = {};
  if (!state.name.trim()) errors.name = t('nameRequired');
  if (state.endDate && state.startDate && state.endDate < state.startDate) {
    errors.endDate = t('endDateAfterStart');
  }
  if (state.estimatedBudget.trim()) {
    const n = Number(state.estimatedBudget);
    if (Number.isNaN(n) || n < 0) errors.estimatedBudget = t('estimatedBudgetPositive');
  }
  if (state.actualBudget.trim()) {
    const n = Number(state.actualBudget);
    if (Number.isNaN(n) || n < 0) errors.actualBudget = t('actualBudgetPositive');
  }
  return errors;
}

function toUpdateProjectPayload(state: ProjectSettingsFormState): UpdateProjectRequest {
  const managerIds = [...new Set(state.managerId.map((id) => id.trim()).filter(Boolean))];
  return {
    name: state.name.trim(),
    description: state.description.trim() || undefined,
    status: state.status,
    priority: state.priority,
    startDate: state.startDate || undefined,
    endDate: state.endDate || undefined,
    managerId: managerIds.length > 0 ? managerIds : undefined,
    estimatedBudget: toOptionalNumber(state.estimatedBudget),
    actualBudget: toOptionalNumber(state.actualBudget),
    budgetCurrency: state.budgetCurrency,
  };
}

interface ProjectDetailLayoutProps {
  tenant: string;
  projectSlug: string;
  children: React.ReactNode;
}

export function ProjectDetailLayout({
  tenant,
  projectSlug,
  children,
}: ProjectDetailLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('project.detail');
  const commonT = useTranslations('project.common');
  const statusT = useTranslations('project.detail.status');
  const priorityT = useTranslations('project.detail.priority');
  const validationT = useTranslations('project.detail.validation');
  const { confirm, confirmDialog } = useConfirmAlertDialog();

  const projectQuery = useProjectById(projectSlug);
  const projectId = projectQuery.data?.id ?? '';
  const myProjectRolesQuery = useProjectRolesMe(projectId);
  const rbacPermissions = useAppSelector((state) => state.user.rbacPermissions);
  const rbacPermissionsLoaded = useAppSelector((state) => state.user.rbacPermissionsLoaded);

  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const canUpdateProject = useCan(PERMISSIONS.PROJECTS_UPDATE);
  const canDeleteProject = useCan(PERMISSIONS.PROJECTS_DELETE);
  const canListDocuments = useCan(PERMISSIONS.DOCUMENTS_LIST);
  const canViewDocuments = useCan(PERMISSIONS.DOCUMENTS_VIEW);
  const canListMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_LIST);
  const canManageMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_MANAGE);
  const canUpdateMembers = useCan(PERMISSIONS.PROJECTS_MEMBERS_UPDATE);
  const canListProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_LIST);
  const canViewProjectRoles = useCan(PERMISSIONS.PROJECTS_ROLES_VIEW);

  const membersQuery = useProjectMembers(projectId, {}, canListMembers);
  const rolesQuery = useProjectRoles(projectId, canListProjectRoles);

  const canInviteMember = canManageMembers || canUpdateMembers;
  const canViewMembersTab = canListMembers && membersQuery.isSuccess;
  const canViewRolesTab = canListProjectRoles && rolesQuery.isSuccess;
  const canViewDocumentsTab = canListDocuments || canViewDocuments;
  const canViewKpiTab = Boolean(projectId);
  const canViewReportsTab = Boolean(projectId);
  const canViewSettingsTab = canUpdateProject;

  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isKpiSettingsOpen, setKpiSettingsOpen] = useState(false);
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<ProjectSettingsFormState>(
    () => mapProjectToSettingsForm(projectQuery.data),
  );
  const [settingsErrors, setSettingsErrors] = useState<ProjectSettingsErrors>({});
  const [settingsSubmitError, setSettingsSubmitError] = useState('');

  const dashboardHref = tenant ? ROUTES.tenant.dashboard(tenant) : ROUTES.dashboard;
  const projectsHref = tenant ? ROUTES.tenant.projects(tenant) : ROUTES.dashboard;
  const basePath = pathname.replace(
    /\/(dashboard|board|team|members|roles|documents|kpi|reports).*$/,
    '',
  );

  const project = projectQuery.data;
  const projectStatusOptions = getProjectStatusOptions(statusT);
  const projectPriorityOptions = getProjectPriorityOptions(priorityT);

  const memberOptions = useMemo(() => {
    const map = new Map<
      string,
      { userId: string; label: string; subtitle?: string; avatarUrl?: string }
    >();

    for (const member of membersQuery.data ?? []) {
      if (!member.userId || map.has(member.userId)) continue;

      const nestedUser =
        'user' in member && member.user && typeof member.user === 'object'
          ? (member.user as Record<string, unknown>)
          : undefined;
      const avatarUrl =
        'avatarUrl' in member &&
        typeof member.avatarUrl === 'string' &&
        member.avatarUrl.trim().length > 0
          ? member.avatarUrl.trim()
          : 'avatar' in member &&
              typeof member.avatar === 'string' &&
              member.avatar.trim().length > 0
            ? member.avatar.trim()
            : typeof nestedUser?.avatarUrl === 'string' &&
                nestedUser.avatarUrl.trim().length > 0
              ? nestedUser.avatarUrl.trim()
              : typeof nestedUser?.avatar === 'string' && nestedUser.avatar.trim().length > 0
                ? nestedUser.avatar.trim()
                : undefined;

      map.set(member.userId, {
        userId: member.userId,
        label: resolveProjectMemberLabel(member),
        subtitle: member.roleName?.trim() || member.role?.trim() || undefined,
        avatarUrl,
      });
    }

    return [...map.values()];
  }, [membersQuery.data]);

  const selectedProjectManagersLabel = useMemo(() => {
    if (settingsForm.managerId.length === 0) {
      return t('noManagersSelected');
    }

    const selectedLabels = memberOptions
      .filter((member) => settingsForm.managerId.includes(member.userId))
      .map((member) => member.label);

    if (selectedLabels.length === 0) {
      return t('selectedCount', { count: settingsForm.managerId.length });
    }

    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ');
    }

    return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
  }, [memberOptions, settingsForm.managerId, t]);

  const handleOpenEdit = () => {
    setSettingsForm(mapProjectToSettingsForm(projectQuery.data));
    setSettingsErrors({});
    setSettingsSubmitError('');
    setEditDialogOpen(true);
  };

  const handleEditOpenChange = (open: boolean) => {
    if (!open && updateProjectMutation.isPending) return;
    if (!open) {
      setSettingsErrors({});
      setSettingsSubmitError('');
    }
    setEditDialogOpen(open);
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) {
      toast.danger(t('toasts.projectIdMissing'));
      return;
    }
    const errors = validateProjectSettingsForm(settingsForm, validationT);
    setSettingsErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = await updateProjectMutation.mutateAsync({
      projectId,
      body: toUpdateProjectPayload(settingsForm),
    });
    if (!result.ok) {
      const msg = result.error.message || t('toasts.updateFailed');
      setSettingsSubmitError(msg);
      toast.danger(msg);
      return;
    }
    toast.success(t('toasts.updated'));
    setEditDialogOpen(false);
  };

  const handleDeleteProject = async () => {
    if (!projectId) {
      toast.danger(t('toasts.projectIdMissing'));
      return;
    }
    const confirmed = await confirm({
      title: t('deleteDialog.title'),
      description: t('deleteDialog.description', { name: project?.name ?? '' }),
      confirmText: commonT('delete'),
      cancelText: commonT('cancel'),
      destructive: true,
    });
    if (!confirmed) return;

    const result = await deleteProjectMutation.mutateAsync(projectId);
    if (!result.ok) {
      toast.danger(result.error.message || t('toasts.deleteFailed'));
      return;
    }
    toast.success(t('toasts.deleted'));
    router.push(tenant ? ROUTES.tenant.projects(tenant) : '/projects');
  };

  const setField = <K extends keyof ProjectSettingsFormState>(
    key: K,
    value: ProjectSettingsFormState[K],
  ) => setSettingsForm((prev) => ({ ...prev, [key]: value }));

  const toggleManagerSelection = (userId: string, checked: boolean) => {
    if (checked) {
      if (settingsForm.managerId.includes(userId)) return;
      setField('managerId', [...settingsForm.managerId, userId]);
      return;
    }

    setField(
      'managerId',
      settingsForm.managerId.filter((selectedId) => selectedId !== userId),
    );
  };

  if (projectQuery.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {confirmDialog}
      {projectId && <ProjectRealtimeBridge projectId={projectId} />}

      <div className="space-y-4">
        <PageHeader
          title={project?.name ?? ''}
          description={project?.description ?? undefined}
          descriptionCollapsible
          descriptionShowMoreLabel={commonT('showMore')}
          descriptionShowLessLabel={commonT('showLess')}
          breadcrumbs={[
            { label: commonT('dashboard'), href: dashboardHref },
            { label: commonT('projects'), href: projectsHref },
            { label: project?.name ?? '' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {(canUpdateProject || canDeleteProject || canViewSettingsTab || canInviteMember) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={updateProjectMutation.isPending || deleteProjectMutation.isPending}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canInviteMember && (
                      <DropdownMenuItem onClick={() => setInviteDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('actions.inviteMember')}
                      </DropdownMenuItem>
                    )}
                    {canViewSettingsTab && (
                      <DropdownMenuItem onClick={() => setKpiSettingsOpen(true)}>
                        <Settings className="mr-2 h-4 w-4" />
                        {t('actions.projectSettings')}
                      </DropdownMenuItem>
                    )}
                    {canUpdateProject && (
                      <DropdownMenuItem onClick={handleOpenEdit}>
                        <SquarePen className="mr-2 h-4 w-4" />
                        {t('actions.editProject')}
                      </DropdownMenuItem>
                    )}
                    {canDeleteProject && (
                      <DropdownMenuItem
                        onClick={() => void handleDeleteProject()}
                        className="text-destructive focus:text-destructive"
                      >
                        {deleteProjectMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        {t('actions.deleteProject')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />
      </div>

      <ProjectDetailTabNav
        basePath={basePath}
        canViewMembersTab={canViewMembersTab}
        canViewRolesTab={canViewRolesTab}
        canViewDocumentsTab={canViewDocumentsTab}
        canViewKpiTab={canViewKpiTab}
        canViewReportsTab={canViewReportsTab}
      />

      <div>{children}</div>

      {canViewSettingsTab && (
        <ProjectSettingsDialog
          open={isKpiSettingsOpen}
          projectId={projectId}
          onOpenChange={setKpiSettingsOpen}
        />
      )}

      <InviteProjectMemberDialog
        open={isInviteDialogOpen}
        projectId={projectId}
        onOpenChange={setInviteDialogOpen}
        projectMemberUserIds={(membersQuery.data ?? []).map((member) => member.userId)}
        isProjectMembersPending={membersQuery.isPending}
        projectMembersErrorMessage={membersQuery.error?.message ?? null}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>{t('editDialog.description')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmitEdit(e)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">{t('editDialog.name')}</Label>
                <Input
                  id="project-name"
                  value={settingsForm.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
                {settingsErrors.name && (
                  <p className="text-destructive text-xs">{settingsErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-description">{t('editDialog.descriptionLabel')}</Label>
                <Textarea
                  id="project-description"
                  value={settingsForm.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('editDialog.status')}</Label>
                  <Select
                    value={settingsForm.status}
                    onValueChange={(v) => setField('status', v as ProjectStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t('editDialog.priority')}</Label>
                  <Select
                    value={settingsForm.priority}
                    onValueChange={(v) => setField('priority', v as ProjectPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projectPriorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('editDialog.startDate')}</Label>
                  <DatePicker
                    value={settingsForm.startDate || null}
                    onChange={(d) => setField('startDate', d)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('editDialog.endDate')}</Label>
                  <DatePicker
                    value={settingsForm.endDate || null}
                    onChange={(d) => setField('endDate', d)}
                  />
                  {settingsErrors.endDate && (
                    <p className="text-destructive text-xs">{settingsErrors.endDate}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('editDialog.budgetCurrency')}</Label>
                  <Select
                    value={settingsForm.budgetCurrency}
                    onValueChange={(v) => setField('budgetCurrency', v as ProjectBudgetCurrency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                  {settingsErrors.budgetCurrency && (
                    <p className="text-destructive text-xs">{settingsErrors.budgetCurrency}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="project-estimated-budget">{t('editDialog.estimatedBudget')}</Label>
                  <Input
                    id="project-estimated-budget"
                    type="number"
                    min={0}
                    step="0.01"
                    value={settingsForm.estimatedBudget}
                    onChange={(e) => setField('estimatedBudget', e.target.value)}
                  />
                  {settingsErrors.estimatedBudget && (
                    <p className="text-destructive text-xs">{settingsErrors.estimatedBudget}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-actual-budget">{t('editDialog.actualBudget')}</Label>
                <Input
                  id="project-actual-budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={settingsForm.actualBudget}
                  onChange={(e) => setField('actualBudget', e.target.value)}
                />
                {settingsErrors.actualBudget && (
                  <p className="text-destructive text-xs">{settingsErrors.actualBudget}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>{t('editDialog.projectManagers')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between overflow-hidden font-normal"
                      disabled={updateProjectMutation.isPending || membersQuery.isPending}
                    >
                      <span className="truncate text-left">{selectedProjectManagersLabel}</span>
                      <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-2"
                  >
                    {memberOptions.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-center text-sm">
                        {membersQuery.isPending
                          ? t('editDialog.loadingMembers')
                          : t('editDialog.noMembers')}
                      </p>
                    ) : (
                      <div className="max-h-48 space-y-1 overflow-y-auto overscroll-contain pr-1">
                        {memberOptions.map((member) => {
                          const isChecked = settingsForm.managerId.includes(member.userId);

                          return (
                            <button
                              key={member.userId}
                              type="button"
                              className="hover:bg-muted/40 flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left"
                              onClick={() => toggleManagerSelection(member.userId, !isChecked)}
                              disabled={updateProjectMutation.isPending}
                            >
                              <Checkbox
                                checked={isChecked}
                                className="pointer-events-none mt-0.5"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm">{member.label}</p>
                                {member.subtitle ? (
                                  <p className="text-muted-foreground truncate text-xs">
                                    {member.subtitle}
                                  </p>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {settingsForm.managerId.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="mt-2 h-auto w-full justify-start px-2 py-1 text-xs"
                        onClick={() => setField('managerId', [])}
                        disabled={updateProjectMutation.isPending}
                      >
                        {t('editDialog.clearAll', { count: settingsForm.managerId.length })}
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
                {membersQuery.isPending && (
                  <p className="text-muted-foreground text-xs">{t('editDialog.loadingMembers')}</p>
                )}
                {membersQuery.isError && (
                  <p className="text-destructive text-xs">
                    {membersQuery.error?.message || t('toasts.loadMembersFailed')}
                  </p>
                )}
              </div>
            </div>
            {settingsSubmitError && (
              <p className="text-destructive mb-4 text-sm">{settingsSubmitError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditOpenChange(false)}
                disabled={updateProjectMutation.isPending}
              >
                {commonT('cancel')}
              </Button>
              <Button type="submit" disabled={updateProjectMutation.isPending}>
                {updateProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {commonT('saveChanges')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
