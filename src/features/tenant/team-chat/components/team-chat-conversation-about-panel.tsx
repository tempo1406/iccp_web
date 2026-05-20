import { useEffect, useState } from 'react';
import { Check, PencilLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { type WorkspaceChannel } from '../data/team-chat-ui-data';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import { TeamChatConfirmActionDialog } from './team-chat-confirm-action-dialog';

interface TeamChatConversationAboutPanelProps {
  aboutEditMode: boolean;
  canLeaveChannel: boolean;
  channel: WorkspaceChannel;
  conversationLabel: string;
  conversationTitleLabel: string;
  roomNameLabel: string;
  createdByLabel: string;
  details: {
    topic?: string;
    description?: string;
    createdAt?: string;
  };
  isLeavingChannel: boolean;
  roomDescriptionDraft: string;
  roomInfoDirty: boolean;
  roomInfoSaving: boolean;
  roomNameDraft: string;
  roomTopicDraft: string;
  onLeaveChannel: () => Promise<void> | void;
  onSaveRoomInfo: () => Promise<boolean>;
  setAboutEditMode: (value: boolean) => void;
  setRoomDescriptionDraft: (value: string) => void;
  setRoomNameDraft: (value: string) => void;
  setRoomTopicDraft: (value: string) => void;
}

export function TeamChatConversationAboutPanel({
  aboutEditMode,
  canLeaveChannel,
  channel,
  conversationLabel,
  conversationTitleLabel,
  roomNameLabel,
  createdByLabel,
  details,
  isLeavingChannel,
  roomDescriptionDraft,
  roomInfoDirty,
  roomInfoSaving,
  roomNameDraft,
  roomTopicDraft,
  onLeaveChannel,
  onSaveRoomInfo,
  setAboutEditMode,
  setRoomDescriptionDraft,
  setRoomNameDraft,
  setRoomTopicDraft,
}: TeamChatConversationAboutPanelProps) {
  const t = useTranslations('teamChat');
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [roomInfoSaved, setRoomInfoSaved] = useState(false);

  useEffect(() => {
    if (!roomInfoSaved) return;

    const timer = window.setTimeout(() => {
      setRoomInfoSaved(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [roomInfoSaved]);

  const handleConfirmLeaveChannel = async () => {
    await onLeaveChannel();
    setLeaveConfirmOpen(false);
  };

  return (
    <>
      <TabsContent value="about" className="min-h-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full min-h-0">
          <div className="space-y-4 px-6 py-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-background/70">
              <section className="space-y-4 border-b border-border px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t('aboutPanel.profileTitle', { conversation: conversationTitleLabel })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('aboutPanel.manageDescription', { conversation: conversationLabel })}
                    </p>
                  </div>
                  {aboutEditMode ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer rounded-lg"
                        onClick={() => {
                          setRoomNameDraft(channel.name);
                          setRoomTopicDraft(details.topic ?? '');
                          setRoomDescriptionDraft(details.description ?? '');
                          setAboutEditMode(false);
                        }}
                        disabled={roomInfoSaving}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="cursor-pointer rounded-lg"
                        onClick={async () => {
                          const saved = await onSaveRoomInfo();
                          if (saved) {
                            setRoomInfoSaved(true);
                            setAboutEditMode(false);
                          }
                        }}
                        disabled={roomInfoSaving || !roomNameDraft.trim() || !roomInfoDirty}
                      >
                        {roomInfoSaving ? t('aboutPanel.saving') : t('aboutPanel.saveChanges')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer rounded-lg"
                      onClick={() => setAboutEditMode(true)}
                    >
                      {roomInfoSaved ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          {t('aboutPanel.saved')}
                        </>
                      ) : (
                        <>
                          <PencilLine className="h-4 w-4" />
                          {t('common.edit')}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {aboutEditMode ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="channel-info-name">{roomNameLabel}</Label>
                      <Input
                        id="channel-info-name"
                        value={roomNameDraft}
                        onChange={(event) => setRoomNameDraft(event.target.value)}
                        placeholder={roomNameLabel}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel-info-topic">{t('aboutPanel.topic')}</Label>
                      <Input
                        id="channel-info-topic"
                        value={roomTopicDraft}
                        onChange={(event) => setRoomTopicDraft(event.target.value)}
                        placeholder={t('aboutPanel.topicPlaceholder', {
                          conversation: conversationLabel,
                        })}
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="channel-info-description">{t('aboutPanel.description')}</Label>
                      <textarea
                        id="channel-info-description"
                        rows={5}
                        value={roomDescriptionDraft}
                        onChange={(event) => setRoomDescriptionDraft(event.target.value)}
                        placeholder={t('aboutPanel.descriptionPlaceholder', {
                          conversation: conversationLabel,
                        })}
                        className={cn(
                          'border-input bg-background ring-offset-background flex min-h-[120px] w-full rounded-xl border px-3 py-2 text-sm outline-none',
                          focusRingClass,
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
                      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                        {roomNameLabel}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">{channel.name}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
                      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                        {t('aboutPanel.topic')}
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {details.topic || t('aboutPanel.noTopic')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background px-3 py-2.5">
                      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                        {t('aboutPanel.description')}
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {details.description || t('aboutPanel.noDescription')}
                      </p>
                    </div>
                  </div>
                )}
              </section>
              <section className="border-b border-border px-5 py-5">
                <p className="text-sm font-semibold text-foreground">{t('aboutPanel.createdBy')}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('aboutPanel.createdOn', {
                    name: createdByLabel,
                    date: details.createdAt || '--',
                  })}
                </p>
              </section>
              <section className="px-5 py-5">
                <button
                  type="button"
                  onClick={() => setLeaveConfirmOpen(true)}
                  disabled={!canLeaveChannel || isLeavingChannel}
                  className={cn(
                    'cursor-pointer text-sm font-semibold text-destructive transition-colors hover:text-destructive/80 disabled:cursor-default disabled:text-destructive/55',
                    focusRingClass,
                  )}
                >
                  {isLeavingChannel
                    ? t('aboutPanel.leaving', { conversation: conversationLabel })
                    : t('aboutPanel.leave', { conversation: conversationLabel })}
                </button>
                {!canLeaveChannel ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('aboutPanel.leaveUnavailable', { conversation: conversationLabel })}
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>

      <TeamChatConfirmActionDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title={t('header.leave.title', { title: channel.name })}
        description={t('aboutPanel.leaveDescription', { conversation: conversationLabel })}
        confirmLabel={t('header.leave.menu', { conversation: conversationLabel })}
        pending={isLeavingChannel}
        onConfirm={handleConfirmLeaveChannel}
      />
    </>
  );
}
