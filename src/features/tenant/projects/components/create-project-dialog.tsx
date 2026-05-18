'use client';

import { useMemo, type WheelEvent } from 'react';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import {
  BUDGET_CURRENCY_OPTIONS,
  type CreateProjectFormState,
  useCreateProjectDialog,
} from '../hooks/use-create-project-dialog';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectSlug: string) => void;
}

function buildOrganizationMemberLabel(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
  userId?: string;
  fallback: string;
}): string {
  const displayName = [input.firstName, input.lastName].filter(Boolean).join(' ').trim();
  if (displayName) return displayName;
  if (input.email?.trim()) return input.email.trim();
  return input.userId?.trim() || input.fallback;
}

function handleScrollableListWheel(event: WheelEvent<HTMLDivElement>) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.scrollTop += event.deltaY;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const t = useTranslations('project.createDialog');
  const commonT = useTranslations('project.common');
  const statusT = useTranslations('project.detail.status');
  const priorityT = useTranslations('project.detail.priority');
  const organizationMembersData = useOrganizationMembersData();
  const statusOptions = useMemo(
    () => [
      { value: 'planning' as const, label: statusT('planning') },
      { value: 'active' as const, label: statusT('active') },
      { value: 'on_hold' as const, label: statusT('on_hold') },
      { value: 'completed' as const, label: statusT('completed') },
      { value: 'cancelled' as const, label: statusT('cancelled') },
    ],
    [statusT],
  );
  const priorityOptions = useMemo(
    () => [
      { value: 'low' as const, label: priorityT('low') },
      { value: 'medium' as const, label: priorityT('medium') },
      { value: 'high' as const, label: priorityT('high') },
      { value: 'critical' as const, label: priorityT('critical') },
    ],
    [priorityT],
  );
  const managerOptions = useMemo(() => {
    const map = new Map<string, { userId: string; label: string; email: string }>();
    for (const member of organizationMembersData.members) {
      if (!member.userId) continue;
      if (map.has(member.userId)) continue;
      map.set(member.userId, {
        userId: member.userId,
        label: buildOrganizationMemberLabel({
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          userId: member.userId,
          fallback: t('unknownMember'),
        }),
        email: member.email,
      });
    }
    return Array.from(map.values());
  }, [organizationMembersData.members, t]);

  const {
    formState,
    errors,
    submitError,
    isSubmitting,
    setField,
    handleOpenChange,
    handleSubmit,
  } = useCreateProjectDialog({
    onOpenChange,
    onCreated,
  });

  const selectedManagersLabel = useMemo(() => {
    if (formState.managerId.length === 0) {
      return t('selectedManagers.none');
    }

    const selectedLabels = managerOptions
      .filter((member) => formState.managerId.includes(member.userId))
      .map((member) => member.label);

    if (selectedLabels.length === 0) {
      return t('selectedManagers.fallback', { count: formState.managerId.length });
    }

    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ');
    }

    return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`;
  }, [formState.managerId, managerOptions, t]);

  const toggleManagerSelection = (userId: string, checked: boolean) => {
    if (checked) {
      if (formState.managerId.includes(userId)) return;
      setField('managerId', [...formState.managerId, userId]);
      return;
    }

    setField(
      'managerId',
      formState.managerId.filter((selectedId) => selectedId !== userId),
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto p-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-name">{t('fields.name')}</Label>
              <Input
                id="project-name"
                value={formState.name}
                onChange={(event) => setField('name', event.target.value)}
                placeholder={t('placeholders.name')}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-description">{t('fields.description')}</Label>
              <Textarea
                id="project-description"
                value={formState.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder={t('placeholders.description')}
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('fields.status')}</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setField('status', value as CreateProjectFormState['status'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.status')} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('fields.priority')}</Label>
              <Select
                value={formState.priority}
                onValueChange={(value) =>
                  setField('priority', value as CreateProjectFormState['priority'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.priority')} />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-start-date">{t('fields.startDate')}</Label>
              <DatePicker
                id="project-start-date"
                value={formState.startDate}
                onChange={(value) => setField('startDate', value)}
                placeholder={t('placeholders.startDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-end-date">{t('fields.endDate')}</Label>
              <DatePicker
                id="project-end-date"
                value={formState.endDate}
                onChange={(value) => setField('endDate', value)}
                placeholder={t('placeholders.endDate')}
              />
              {errors.endDate && (
                <p className="text-destructive text-xs">{errors.endDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('fields.budgetCurrency')}</Label>
              <Select
                value={formState.budgetCurrency}
                onValueChange={(value) =>
                  setField('budgetCurrency', value as CreateProjectFormState['budgetCurrency'])
                }
              >
                <SelectTrigger aria-invalid={Boolean(errors.budgetCurrency)}>
                  <SelectValue placeholder={t('placeholders.budgetCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.budgetCurrency && (
                <p className="text-destructive text-xs">{errors.budgetCurrency}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-estimated-budget">{t('fields.estimatedBudget')}</Label>
              <Input
                id="project-estimated-budget"
                type="number"
                min={0}
                step="0.01"
                value={formState.estimatedBudget}
                onChange={(event) => setField('estimatedBudget', event.target.value)}
                placeholder={t('placeholders.estimatedBudget')}
                aria-invalid={Boolean(errors.estimatedBudget)}
              />
              {errors.estimatedBudget && (
                <p className="text-destructive text-xs">{errors.estimatedBudget}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-actual-budget">{t('fields.actualBudget')}</Label>
              <Input
                id="project-actual-budget"
                type="number"
                min={0}
                step="0.01"
                value={formState.actualBudget}
                onChange={(event) => setField('actualBudget', event.target.value)}
                placeholder={t('placeholders.actualBudget')}
                aria-invalid={Boolean(errors.actualBudget)}
              />
              {errors.actualBudget && (
                <p className="text-destructive text-xs">{errors.actualBudget}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t('fields.projectManagers')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={organizationMembersData.isPending}
                    className="w-full justify-between overflow-hidden font-normal"
                  >
                    <span className="truncate text-left">{selectedManagersLabel}</span>
                    <ChevronsUpDown className="text-muted-foreground ml-2 h-4 w-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
                  {managerOptions.length === 0 ? (
                    <p className="text-muted-foreground py-2 text-center text-sm">
                      {organizationMembersData.isPending
                        ? t('members.loading')
                        : t('members.empty')}
                    </p>
                  ) : (
                    <div
                      className="max-h-48 space-y-1 overflow-y-auto overscroll-contain pr-1"
                      onWheelCapture={handleScrollableListWheel}
                    >
                      {managerOptions.map((member) => {
                        const isChecked = formState.managerId.includes(member.userId);
                        return (
                          <button
                            key={member.userId}
                            type="button"
                            className="hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left"
                            onClick={() => toggleManagerSelection(member.userId, !isChecked)}
                          >
                            <Checkbox checked={isChecked} className="pointer-events-none" />
                            <span className="truncate text-sm">
                              {member.label}
                              {member.email ? ` (${member.email})` : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {formState.managerId.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-auto w-full justify-start px-2 py-1 text-xs"
                      onClick={() => setField('managerId', [])}
                    >
                      {t('members.clearAll', { count: formState.managerId.length })}
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
              {organizationMembersData.isPending && (
                <p className="text-muted-foreground text-xs">
                  {t('members.loading')}
                </p>
              )}
              {organizationMembersData.isError && (
                <p className="text-destructive text-xs">
                  {organizationMembersData.error?.message || t('members.empty')}
                </p>
              )}
            </div>
          </div>

          {submitError && <p className="text-destructive text-sm">{submitError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {commonT('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
