'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Mail } from 'lucide-react';
import { TipTapEditor } from '@/components/ui/tiptap-editor';
import { RoleAssignmentMultiSelect } from '@/features/tenant/organization-roles/components/role-assignment-multi-select';
import { MemberMultiSelect } from './member-multi-select';
import { useOrganizationRolesQuery } from '@/features/tenant/organization-roles/query/organization-roles.queries';
import { useOrganizationMembersData } from '@/features/tenant/organization-members/hooks/use-organization-members';
import { useCreateCampaign } from '../query/use-notifications';
import { useDebounce } from '@/hooks';
import { useAppSelector } from '@/store';
import { toast } from '@/lib/toast';
import { isOk } from '@/lib/safe-query';
import type { CampaignTargetType } from '@/services/notifications/types';
import type { OrganizationRoleDto } from '@/services/organization-roles';

interface CreateCampaignPanelProps {
  onClose: () => void;
}

interface FormState {
  title: string;
  message: string;
  content: string;
  targetType: CampaignTargetType;
  targetRoleIds: string[];
  targetUserIds: string[];
  sendEmail: boolean;
}

const INITIAL_FORM: FormState = {
  title: '',
  message: '',
  content: '',
  targetType: 'ORG_ALL',
  targetRoleIds: [],
  targetUserIds: [],
  sendEmail: false,
};

function normalizeRoles(raw: unknown): OrganizationRoleDto[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as OrganizationRoleDto[];
  if (typeof raw === 'object' && 'data' in (raw as object))
    return (raw as { data: OrganizationRoleDto[] }).data;
  if (typeof raw === 'object' && 'items' in (raw as object))
    return (raw as { items: OrganizationRoleDto[] }).items;
  return [];
}

export function CreateCampaignPanel({ onClose }: CreateCampaignPanelProps) {
  const t = useTranslations('notifications.createCampaign');
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [memberSearch, setMemberSearch] = useState('');
  const debouncedMemberSearch = useDebounce(memberSearch, 400);
  const currentUserId = useAppSelector((state) => state.user.profile?.id);

  const rolesQuery = useOrganizationRolesQuery();
  const { members: rawMembers, isPending: membersPending } = useOrganizationMembersData({
    search: debouncedMemberSearch || undefined,
    limit: 10,
  });
  const createCampaign = useCreateCampaign();

  const roles = normalizeRoles(rolesQuery.data);
  const members = rawMembers.filter((m) => m.userId !== currentUserId);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function removeRole(id: string) {
    set('targetRoleIds', form.targetRoleIds.filter((r) => r !== id));
  }

  function removeMember(userId: string) {
    set('targetUserIds', form.targetUserIds.filter((u) => u !== userId));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) return toast.warning(t('validation.titleRequired'));
    if (!form.message.trim()) return toast.warning(t('validation.summaryRequired'));
    if (!form.content || form.content === '<p></p>') {
      return toast.warning(t('validation.contentRequired'));
    }
    if (form.targetType === 'ORG_ROLE' && form.targetRoleIds.length === 0)
      return toast.warning(t('validation.roleRequired'));
    if (form.targetType === 'SPECIFIC_USERS' && form.targetUserIds.length === 0)
      return toast.warning(t('validation.memberRequired'));

    const result = await createCampaign.mutateAsync({
      title: form.title.trim(),
      message: form.message.trim(),
      content: form.content,
      targetType: form.targetType,
      targetRoleIds: form.targetType === 'ORG_ROLE' ? form.targetRoleIds : undefined,
      targetUserIds: form.targetType === 'SPECIFIC_USERS' ? form.targetUserIds : undefined,
      sendEmail: form.sendEmail,
    });

    if (isOk(result)) {
      toast.success(t('toasts.success'));
      setForm(INITIAL_FORM);
      setMemberSearch('');
      onClose();
    }
  }

  const selectedRoles = roles.filter((r) => form.targetRoleIds.includes(r.id));
  // Keep a stable list of selected members across search changes using current members + previously selected
  const selectedMembers = members.filter((m) => form.targetUserIds.includes(m.userId));

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <h2 className="text-sm font-semibold">{t('title')}</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <form id="campaign-inline-form" onSubmit={handleSubmit} className="space-y-4 p-5">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ci-title">{t('titleLabel')}</Label>
            <Input
              id="ci-title"
              placeholder={t('titlePlaceholder')}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <Label htmlFor="ci-message">{t('summaryLabel')}</Label>
            <Textarea
              id="ci-message"
              placeholder={t('summaryPlaceholder')}
              rows={2}
              value={form.message}
              onChange={(e) => set('message', e.target.value)}
            />
          </div>

          {/* Target type */}
          <div className="space-y-1.5">
            <Label>{t('targetAudience')}</Label>
            <RadioGroup
              value={form.targetType}
              onValueChange={(v) => set('targetType', v as CampaignTargetType)}
              className="flex flex-wrap gap-x-4 gap-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ORG_ALL" id="ci-target-all" />
                <Label htmlFor="ci-target-all" className="cursor-pointer font-normal">
                  {t('targetAllMembers')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ORG_ROLE" id="ci-target-role" />
                <Label htmlFor="ci-target-role" className="cursor-pointer font-normal">
                  {t('targetByRole')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="SPECIFIC_USERS" id="ci-target-users" />
                <Label htmlFor="ci-target-users" className="cursor-pointer font-normal">
                  {t('targetSpecificMembers')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Role selector + tags */}
          {form.targetType === 'ORG_ROLE' && (
            <div className="space-y-2">
              <Label>{t('rolesLabel')}</Label>
              <RoleAssignmentMultiSelect
                roles={roles}
                selectedRoleIds={form.targetRoleIds}
                onChange={(ids) => set('targetRoleIds', ids)}
              />
              {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedRoles.map((role) => (
                    <span
                      key={role.id}
                      className="flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium"
                    >
                      {role.name}
                      <button
                        type="button"
                        onClick={() => removeRole(role.id)}
                        className="ml-0.5 rounded-full hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Member selector + tags */}
          {form.targetType === 'SPECIFIC_USERS' && (
            <div className="space-y-2">
              <Label>{t('membersLabel')}</Label>
              <MemberMultiSelect
                members={members}
                selectedUserIds={form.targetUserIds}
                search={memberSearch}
                onSearchChange={setMemberSearch}
                isLoading={membersPending && !!debouncedMemberSearch}
                onChange={(ids) => set('targetUserIds', ids)}
              />
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedMembers.map((m) => {
                    const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email;
                    return (
                      <span
                        key={m.userId}
                        className="flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeMember(m.userId)}
                          className="ml-0.5 rounded-full hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Send email — above content */}
          <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('sendEmail')}</p>
                <p className="text-xs text-muted-foreground">{t('sendEmailDescription')}</p>
              </div>
            </div>
            <Switch checked={form.sendEmail} onCheckedChange={(v) => set('sendEmail', v)} />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label>{t('contentLabel')}</Label>
            <TipTapEditor
              value={form.content}
              onChange={(html) => set('content', html)}
              placeholder={t('contentPlaceholder')}
            />
          </div>

        </form>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 justify-end gap-2 border-t px-5 py-3">
        <Button variant="outline" type="button" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button type="submit" form="campaign-inline-form" disabled={createCampaign.isPending}>
          {createCampaign.isPending ? t('sending') : t('sendCampaign')}
        </Button>
      </div>
    </div>
  );
}
