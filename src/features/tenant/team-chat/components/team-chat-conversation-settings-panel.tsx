import { useEffect, useState } from 'react';
import { Archive, Globe2, Loader2, Lock, Pin, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { type WorkspaceChannel } from '../data/team-chat-ui-data';

interface TeamChatConversationSettingsPanelProps {
  allowGuestPinMessages: boolean;
  allowMemberPinMessages: boolean;
  archiveUpdating: boolean;
  canChangeVisibilityToPrivate: boolean;
  canChangeVisibilityToPublic: boolean;
  canManagePinPolicy: boolean;
  canToggleArchive: boolean;
  channel: WorkspaceChannel;
  conversationKind: 'channel' | 'group_dm';
  conversationLabel: string;
  isArchived: boolean;
  notificationMeta: {
    label: string;
    description: string;
  };
  onApplyPolicies: () => Promise<boolean> | boolean;
  onToggleArchive: () => void;
  onUpdateVisibility: (nextVisibility: 'public' | 'private') => Promise<boolean> | boolean;
  pinPolicyDirty: boolean;
  setAllowGuestPinMessages: (value: boolean) => void;
  setAllowMemberPinMessages: (value: boolean) => void;
  visibility: 'public' | 'private';
  visibilityUpdating: boolean;
}

export function TeamChatConversationSettingsPanel({
  allowGuestPinMessages,
  allowMemberPinMessages,
  archiveUpdating,
  canChangeVisibilityToPrivate,
  canChangeVisibilityToPublic,
  canManagePinPolicy,
  canToggleArchive,
  channel,
  conversationKind,
  conversationLabel,
  isArchived,
  notificationMeta,
  onApplyPolicies,
  onToggleArchive,
  onUpdateVisibility,
  pinPolicyDirty,
  setAllowGuestPinMessages,
  setAllowMemberPinMessages,
  visibility,
  visibilityUpdating,
}: TeamChatConversationSettingsPanelProps) {
  const t = useTranslations('teamChat');
  const [pendingVisibility, setPendingVisibility] = useState<'public' | 'private' | null>(null);
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);
  const showVisibilitySettings = conversationKind === 'channel';
  const nextVisibility = visibility === 'public' ? 'private' : 'public';
  const canUpdateVisibility =
    nextVisibility === 'public' ? canChangeVisibilityToPublic : canChangeVisibilityToPrivate;
  const visibilityIcon = visibility === 'public' ? Globe2 : Lock;
  const VisibilityIcon = visibilityIcon;
  const localizedVisibility =
    visibility === 'public' ? t('browse.visibility.public') : t('browse.visibility.private');
  const visibilityCardDescription =
    visibility === 'public'
      ? t('settingsPanel.visibilityPublicDescription')
      : t('settingsPanel.visibilityPrivateDescription');
  const visibilityPermissionDescription = isArchived
    ? t('settingsPanel.visibilityUnarchiveFirst')
    : canUpdateVisibility
      ? nextVisibility === 'public'
        ? t('settingsPanel.visibilityCanPublic')
        : t('settingsPanel.visibilityCanPrivate')
      : nextVisibility === 'public'
        ? t('settingsPanel.visibilityNoPublicPermission')
        : t('settingsPanel.visibilityNoPrivatePermission');

  useEffect(() => {
    if (!policySaved) return;

    const timer = window.setTimeout(() => {
      setPolicySaved(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [policySaved]);

  const handleConfirmVisibilityChange = async () => {
    if (!pendingVisibility) return;
    const updated = await onUpdateVisibility(pendingVisibility);
    if (updated) {
      setPendingVisibility(null);
    }
  };

  const handleApplyPolicies = async () => {
    setPolicySaving(true);
    const updated = await onApplyPolicies();
    setPolicySaving(false);
    if (!updated) return;
    setPolicySaved(true);
  };

  return (
    <>
      <TabsContent value="settings" className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-2xl border border-border bg-background/70 px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground">
                    {t('settingsPanel.notificationPreference')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('settingsPanel.currentMode', {
                      label: notificationMeta.label,
                      description: notificationMeta.description,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70">
                  <Pin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground">
                    {t('settingsPanel.pinPolicies')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('settingsPanel.pinPoliciesDescription', { conversation: conversationLabel })}
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t('settingsPanel.allowMembersToPin')}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('settingsPanel.roleMember')}</p>
                      </div>
                      <Switch
                        checked={allowMemberPinMessages}
                        onCheckedChange={setAllowMemberPinMessages}
                        disabled={!canManagePinPolicy}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t('settingsPanel.allowGuestsToPin')}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('settingsPanel.roleGuest')}</p>
                      </div>
                      <Switch
                        checked={allowGuestPinMessages}
                        onCheckedChange={setAllowGuestPinMessages}
                        disabled={!canManagePinPolicy}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 cursor-pointer rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    disabled={!canManagePinPolicy || !pinPolicyDirty || policySaving}
                    onClick={() => {
                      void handleApplyPolicies();
                    }}
                  >
                    {policySaving
                      ? t('settingsPanel.saving')
                      : policySaved && !pinPolicyDirty
                        ? t('settingsPanel.saved')
                        : t('settingsPanel.applyPinPolicy')}
                  </Button>
                </div>
              </div>
            </div>

            {showVisibilitySettings ? (
              <div className="rounded-2xl border border-border bg-background/70 px-5 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70">
                    <VisibilityIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {t('settingsPanel.channelVisibility')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{visibilityCardDescription}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize',
                          visibility === 'public'
                            ? 'border-sky-500/25 bg-sky-500/10 text-sky-200'
                            : 'border-amber-500/25 bg-amber-500/10 text-amber-200',
                        )}
                      >
                        {localizedVisibility}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-border bg-background/85 px-4 py-4">
                      <p className="text-sm leading-6 text-muted-foreground">
                        {visibilityPermissionDescription}
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4 cursor-pointer rounded-xl"
                        disabled={!canUpdateVisibility || visibilityUpdating || isArchived}
                        onClick={() => setPendingVisibility(nextVisibility)}
                      >
                        {visibilityUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('settingsPanel.updatingVisibility')}
                          </>
                        ) : nextVisibility === 'public' ? (
                          t('settingsPanel.changeToPublic')
                        ) : (
                          t('settingsPanel.changeToPrivate')
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-background/70 px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground">
                    {isArchived
                      ? t('settingsPanel.archivedTitle', { conversation: conversationLabel })
                      : t('settingsPanel.archiveTitle', { conversation: conversationLabel })}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isArchived
                      ? t('settingsPanel.archivedDescription', { conversation: conversationLabel })
                      : conversationKind === 'group_dm'
                        ? t('settingsPanel.archiveGroupDescription')
                        : t('settingsPanel.archiveChannelDescription')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'mt-4 cursor-pointer rounded-xl',
                      isArchived
                        ? 'border-border text-foreground hover:bg-muted'
                        : 'border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive',
                    )}
                    disabled={!canToggleArchive || archiveUpdating}
                    onClick={onToggleArchive}
                  >
                    {archiveUpdating
                      ? t('settingsPanel.updating')
                      : isArchived
                        ? t('settingsPanel.unarchive', { name: channel.name })
                        : t('settingsPanel.archive', { name: channel.name })}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <AlertDialog
        open={showVisibilitySettings && Boolean(pendingVisibility)}
        onOpenChange={(open) => !open && setPendingVisibility(null)}
      >
        <AlertDialogContent className="overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-[560px]">
          <AlertDialogHeader className="space-y-3 px-6 pt-6 text-left">
            <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {pendingVisibility === 'public'
                ? t('settingsPanel.confirmPublicTitle')
                : t('settingsPanel.confirmPrivateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
              {pendingVisibility === 'public'
                ? t('settingsPanel.confirmPublicDescription')
                : t('settingsPanel.confirmPrivateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="px-6 py-2 text-sm text-muted-foreground">
            {t('settingsPanel.currentVisibility')}{' '}
            <span className="font-medium capitalize text-foreground">{localizedVisibility}</span>
          </div>

          <AlertDialogFooter className="border-t border-border bg-muted/15 px-6 py-4">
            <AlertDialogCancel className="h-10 cursor-pointer rounded-xl px-4">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-10 cursor-pointer rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
              disabled={visibilityUpdating}
              onClick={() => {
                void handleConfirmVisibilityChange();
              }}
            >
              {visibilityUpdating ? t('settingsPanel.updating') : t('settingsPanel.confirmChange')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
