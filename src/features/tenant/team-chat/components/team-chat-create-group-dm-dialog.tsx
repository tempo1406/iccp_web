import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useTeamChatCreateRoomCandidates } from '../query/use-team-chat';
import { type TeamChatProjectOption } from '../lib/team-chat-scope.shared';
import { focusRingClass, initials } from '../lib/team-chat-screen.shared';
import { type TeamChatCreateRoomCandidateResponse } from '../services/types/team-chat.types';
import {
  getInviteOptionBlockedLabel,
  type InviteOption,
} from './team-chat-conversation-details-shared';
import { TeamChatRoomScopeFilter } from './team-chat-room-scope-filter';

interface CreateGroupDmForm {
  name: string;
  topic: string;
  description: string;
  contextScope: 'organization' | 'project';
  contextId: string;
}

interface TeamChatCreateGroupDmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    topic?: string;
    description?: string;
    memberIds: string[];
    contextScope: 'organization' | 'project';
    contextId?: string;
  }) => Promise<boolean> | boolean;
  defaultScope: 'organization' | 'project';
  defaultProjectId: string;
  projects: TeamChatProjectOption[];
  loadingProjects: boolean;
  projectErrorMessage?: string | null;
}

function createInitialForm(
  defaultScope: 'organization' | 'project',
  defaultProjectId: string,
): CreateGroupDmForm {
  return {
    name: '',
    topic: '',
    description: '',
    contextScope: defaultScope,
    contextId: defaultProjectId,
  };
}

function mapCreateCandidateToInviteOption(
  candidate: TeamChatCreateRoomCandidateResponse,
): InviteOption {
  return {
    userId: candidate.userId,
    displayName: candidate.displayName,
    email: candidate.email,
    avatarUrl: candidate.avatarUrl ?? undefined,
    reasonBlocked: candidate.reasonBlocked ?? (!candidate.isEligible ? 'not_in_project' : null),
  };
}

function toCreateCandidatesErrorMessage(
  error: { code?: string; message?: string } | null,
  contextScope: 'organization' | 'project',
  translate: (key: string) => string,
) {
  const rawMessage = error?.message?.trim() ?? '';
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    error?.code === 'FORBIDDEN' ||
    normalizedMessage.includes('403') ||
    normalizedMessage.includes('forbidden')
  ) {
    return contextScope === 'project'
      ? translate('createGroup.forbiddenProject')
      : translate('createGroup.forbiddenDefault');
  }

  if (
    error?.code === 'NOT_FOUND' ||
    normalizedMessage.includes('404') ||
    normalizedMessage.includes('not found')
  ) {
    return contextScope === 'project'
      ? translate('createGroup.notFoundProject')
      : translate('createGroup.notFoundDefault');
  }

  if (
    error?.code === 'BAD_REQUEST' ||
    normalizedMessage.includes('400') ||
    normalizedMessage.includes('422') ||
    normalizedMessage.includes('contextid') ||
    normalizedMessage.includes('context id') ||
    normalizedMessage.includes('uuid') ||
    normalizedMessage.includes('limit') ||
    normalizedMessage.includes('roomtype')
  ) {
    return contextScope === 'project'
      ? translate('createGroup.invalidProject')
      : translate('createGroup.invalidDefault');
  }

  return (
    rawMessage ||
    (contextScope === 'project'
      ? translate('createGroup.fallbackProject')
      : translate('createGroup.fallbackDefault'))
  );
}

export function TeamChatCreateGroupDmDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultScope,
  defaultProjectId,
  projects,
  loadingProjects,
  projectErrorMessage,
}: TeamChatCreateGroupDmDialogProps) {
  const t = useTranslations('teamChat');
  const [form, setForm] = useState<CreateGroupDmForm>(() =>
    createInitialForm(defaultScope, defaultProjectId),
  );
  const [query, setQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [optionCache, setOptionCache] = useState<Record<string, InviteOption>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSuggestionsOpen, setMemberSuggestionsOpen] = useState(false);
  const memberSearchContainerRef = useRef<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query.trim());

  const normalizedContextId = form.contextId.trim();
  const candidateQueryEnabled =
    open && (form.contextScope === 'organization' || normalizedContextId.length > 0);

  const createCandidatesQuery = useTeamChatCreateRoomCandidates(
    {
      roomType: 'group_dm',
      contextScope: form.contextScope,
      contextId: form.contextScope === 'project' ? normalizedContextId || undefined : undefined,
      search: deferredQuery || undefined,
      limit: 100,
    },
    {
      enabled: candidateQueryEnabled,
      staleTime: 20_000,
    },
  );

  const memberOptions = useMemo(
    () => (createCandidatesQuery.data?.items ?? []).map(mapCreateCandidateToInviteOption),
    [createCandidatesQuery.data?.items],
  );

  const selectedOptions = useMemo(
    () =>
      selectedUserIds.map(
        (userId) =>
          optionCache[userId] ?? {
            userId,
            displayName: userId,
            email: '--',
          },
      ),
    [optionCache, selectedUserIds],
  );

  const availableOptions = useMemo(
    () => memberOptions.filter((option) => !selectedUserIds.includes(option.userId)),
    [memberOptions, selectedUserIds],
  );

  const queryError = createCandidatesQuery.isError
    ? toCreateCandidatesErrorMessage(createCandidatesQuery.error, form.contextScope, t)
    : null;
  const blockedLabels = useMemo(
    () => ({
      already_member: t('createGroup.blocked.alreadyMember'),
      pending_invitation: t('createGroup.blocked.pendingInvite'),
      not_in_project: t('createGroup.blocked.notInProject'),
    }),
    [t],
  );

  useEffect(() => {
    if (!memberSuggestionsOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!memberSearchContainerRef.current) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (memberSearchContainerRef.current.contains(target)) return;
      setMemberSuggestionsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [memberSuggestionsOpen]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) return;

    setForm(createInitialForm(defaultScope, defaultProjectId));
    setQuery('');
    setSelectedUserIds([]);
    setOptionCache({});
    setIsSubmitting(false);
    setMemberSuggestionsOpen(false);
  };

  const resetSelectedMembers = () => {
    setSelectedUserIds([]);
    setOptionCache({});
  };

  const toggleUser = (option: InviteOption) => {
    const blockedLabel = getInviteOptionBlockedLabel(option, blockedLabels);
    if (blockedLabel) return;

    setOptionCache((previous) => ({
      ...previous,
      [option.userId]: option,
    }));

    setSelectedUserIds((previous) =>
      previous.includes(option.userId)
        ? previous.filter((value) => value !== option.userId)
        : [...previous, option.userId],
    );
  };

  const handleSelectUser = (option: InviteOption) => {
    toggleUser(option);
    setQuery('');
    setMemberSuggestionsOpen(true);
  };

  const handleSubmit = async () => {
    const normalizedName = form.name.trim();
    if (!normalizedName) {
      toast.warning(t('createGroup.nameRequired'));
      return;
    }

    if (selectedUserIds.length === 0) {
      toast.warning(t('createGroup.selectMember'));
      return;
    }

    if (form.contextScope === 'project' && !normalizedContextId) {
      toast.warning(t('createGroup.projectRequired'));
      return;
    }

    setIsSubmitting(true);
    const created = await onSubmit({
      name: normalizedName,
      topic: form.topic.trim() || undefined,
      description: form.description.trim() || undefined,
      memberIds: selectedUserIds,
      contextScope: form.contextScope,
      contextId: form.contextScope === 'project' ? normalizedContextId || undefined : undefined,
    });
    setIsSubmitting(false);

    if (created) {
      handleOpenChange(false);
    }
  };

  const submitDisabled =
    !form.name.trim() ||
    selectedUserIds.length === 0 ||
    isSubmitting ||
    (form.contextScope === 'project' && !normalizedContextId);

  const emptyStateMessage =
    form.contextScope === 'project' && !normalizedContextId
      ? t('createGroup.emptyProject')
      : deferredQuery
        ? t('createGroup.emptySearch')
        : t('createGroup.emptyDefault');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden border-border bg-card p-0 sm:max-w-[760px]">
        <div className="flex max-h-[85vh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-5 text-left">
            <DialogTitle className="inline-flex items-center gap-2 text-2xl tracking-tight">
              <Users className="h-5 w-5 text-muted-foreground" />
              {t('createGroup.title')}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {t('createGroup.description')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-group-dm-name">{t('createGroup.name')}</Label>
                    <Input
                      id="create-group-dm-name"
                      value={form.name}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, name: event.target.value }))
                      }
                      placeholder={t('createGroup.namePlaceholder')}
                      className="h-11 rounded-xl"
                      autoFocus
                    />
                  </div>

                  <TeamChatRoomScopeFilter
                    mode="dialog"
                    scope={form.contextScope}
                    projectId={form.contextId}
                    projects={projects}
                    loadingProjects={loadingProjects}
                    projectErrorMessage={projectErrorMessage}
                    onScopeChange={(contextScope) =>
                      {
                        resetSelectedMembers();
                        setForm((previous) => ({
                          ...previous,
                          contextScope,
                          contextId:
                            contextScope === 'project'
                              ? previous.contextId || defaultProjectId
                              : '',
                        }));
                      }
                    }
                    onProjectChange={(contextId) =>
                      {
                        resetSelectedMembers();
                        setForm((previous) => ({
                          ...previous,
                          contextId,
                        }));
                      }
                    }
                    hint={
                      form.contextScope === 'project'
                        ? t('createGroup.projectHint')
                        : t('createGroup.organizationHint')
                    }
                  />

                  <div className="space-y-2">
                    <Label htmlFor="create-group-dm-topic">{t('createGroup.topic')}</Label>
                    <Input
                      id="create-group-dm-topic"
                      value={form.topic}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, topic: event.target.value }))
                      }
                      placeholder={t('createGroup.topicPlaceholder')}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="create-group-dm-description">
                      {t('createGroup.descriptionLabel')}
                    </Label>
                    <textarea
                      id="create-group-dm-description"
                      rows={5}
                      value={form.description}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, description: event.target.value }))
                      }
                      placeholder={t('createGroup.descriptionPlaceholder')}
                      className={cn(
                        'border-input bg-background ring-offset-background flex min-h-[120px] w-full rounded-xl border px-3 py-2 text-sm outline-none',
                        focusRingClass,
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div ref={memberSearchContainerRef} className="space-y-2">
                    <Label htmlFor="create-group-dm-members">{t('createGroup.members')}</Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="create-group-dm-members"
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setMemberSuggestionsOpen(true);
                        }}
                        onFocus={() => setMemberSuggestionsOpen(true)}
                        placeholder={t('createGroup.searchPlaceholder')}
                        className="h-11 rounded-xl pl-10"
                      />
                      {memberSuggestionsOpen ? (
                        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
                          <div className="max-h-72 overflow-x-hidden overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]">
                            <div className="divide-y divide-border/70">
                              {createCandidatesQuery.isPending ? (
                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                  {t('createGroup.loadingMembers')}
                                </p>
                              ) : queryError ? (
                                <p className="px-4 py-3 text-sm text-destructive">{queryError}</p>
                              ) : availableOptions.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-muted-foreground">
                                  {emptyStateMessage}
                                </p>
                              ) : (
                                availableOptions.map((option) => {
                                  const blockedLabel = getInviteOptionBlockedLabel(option, blockedLabels);
                                  const isBlocked = Boolean(blockedLabel);

                                  return (
                                    <button
                                      key={option.userId}
                                      type="button"
                                      title={blockedLabel ?? undefined}
                                      onClick={() => handleSelectUser(option)}
                                      disabled={isBlocked}
                                      className={cn(
                                        'flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40',
                                        isBlocked &&
                                          'cursor-not-allowed opacity-60 hover:bg-transparent',
                                        focusRingClass,
                                      )}
                                    >
                                      <div className="flex min-w-0 items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-border">
                                          <AvatarImage
                                            src={option.avatarUrl}
                                            alt={option.displayName}
                                          />
                                          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                            {initials(option.displayName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-foreground">
                                            {option.displayName}
                                          </p>
                                          <p className="truncate text-xs text-muted-foreground">
                                            {option.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-2">
                                        {blockedLabel ? (
                                          <Badge
                                            variant="outline"
                                            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                          >
                                            {blockedLabel}
                                          </Badge>
                                        ) : null}
                                        <div
                                          className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground transition-colors',
                                            !isBlocked &&
                                              'hover:border-primary/30 hover:text-foreground',
                                          )}
                                        >
                                          <Plus className="h-4 w-4" />
                                          <span className="sr-only">
                                            {t('createGroup.selectMemberSrOnly')}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {form.contextScope === 'project'
                        ? t('createGroup.membersHintProject')
                        : t('createGroup.membersHintDefault')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label>{t('createGroup.selected')}</Label>
                      <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                        {t('createGroup.membersCount', { count: selectedUserIds.length })}
                      </Badge>
                    </div>

                    <div className="min-h-[74px] rounded-2xl border border-border bg-background px-3 py-3">
                      {selectedOptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('createGroup.noneSelected')}</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedOptions.map((option) => (
                            <Badge
                              key={option.userId}
                              variant="secondary"
                              className="flex items-center gap-1 rounded-full px-2.5 py-1"
                            >
                              <span className="max-w-[220px] truncate">{option.displayName}</span>
                              <button
                                type="button"
                                aria-label={t('createGroup.removeMember', { name: option.displayName })}
                                onClick={() => toggleUser(option)}
                                className={cn(
                                  'flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                                  focusRingClass,
                                )}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer rounded-xl"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              className="cursor-pointer rounded-xl"
              disabled={submitDisabled}
              onClick={() => {
                void handleSubmit();
              }}
            >
              {isSubmitting ? t('createGroup.creating') : t('createGroup.create')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
