'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { DraftHubTab } from '../../data/team-chat-drafts-ui-data';
import type {
  ConversationMessage,
  ConversationTab,
} from '../../data/team-chat-ui-data';
import type {
  TeamChatComposerDraftPayload,
  TeamChatOpenSections,
} from '../../lib/team-chat-screen.shared';
import type { TeamChatScreenViewProps } from '../../components/team-chat-screen-view';

type WrappedViewModelKeys =
  | 'onAcceptInvitation'
  | 'onBrowseSortChange'
  | 'onConfirmDeleteMessage'
  | 'onDelete'
  | 'onDeleteAttachment'
  | 'onDeleteDraft'
  | 'onDeleteDrafts'
  | 'onDeleteScheduled'
  | 'onLoadMoreDrafts'
  | 'onLoadMoreScheduled'
  | 'onRetryUploadingAttachment'
  | 'onRemoveUploadingAttachment'
  | 'onForwardDialogOpenChange'
  | 'onInlineEditSave'
  | 'onMarkAllMentionsRead'
  | 'onMarkAllNotificationsRead'
  | 'onMarkAllUnread'
  | 'onMarkConversationUnread'
  | 'onOpenBrowseChannels'
  | 'onOpenCreateChannel'
  | 'onOpenCreateGroupDm'
  | 'onOpenDirectMessage'
  | 'onOpenFeed'
  | 'onOpenDraftHubTab'
  | 'onOpenPinnedMessage'
  | 'onRescheduleScheduled'
  | 'onRetryOptimisticMessage'
  | 'onSearchResultSelect'
  | 'onSend'
  | 'onSendDraftNow'
  | 'onSendScheduledNow'
  | 'onScheduleDraft'
  | 'onScheduleMessage'
  | 'onSubmitForward'
  | 'onTogglePinMessage'
  | 'onToggleReaction'
  | 'onToggleSection'
  | 'onConvertScheduledToDraft'
  | 'onToggleStarredConversation'
  | 'onUnarchiveConversation'
  | 'onUnhideConversation'
  | 'onUpdatePresenceStatus';

interface UseTeamChatViewModelParams {
  baseProps: Omit<TeamChatScreenViewProps, WrappedViewModelKeys>;
  actions: {
    setCreateChannelDialogOpen: Dispatch<SetStateAction<boolean>>;
    setCreateGroupDmDialogOpen: Dispatch<SetStateAction<boolean>>;
    setBrowseSortBy: Dispatch<SetStateAction<'recent' | 'members' | 'name'>>;
    setActiveTab: Dispatch<SetStateAction<ConversationTab>>;
    setHighlightedMessageId: Dispatch<SetStateAction<string | null>>;
    setOpenSections: Dispatch<SetStateAction<TeamChatOpenSections>>;
    clearForwardState: () => void;
    handleAcceptInvitation: (invitationId: string) => unknown;
    handleConfirmDeleteMessage: () => unknown;
    requestDeleteMessage: (
      messageId: string,
      source?: 'menu' | 'inline-edit-empty',
    ) => void;
    handleDeleteAttachment: (messageId: string, attachmentId: string) => unknown;
    handleDeleteDraftHubDraft: (draftId: string) => unknown;
    handleDeleteDraftHubDrafts: (draftIds: string[]) => unknown;
    handleDeleteScheduledDraft: (scheduledId: string) => unknown;
    handleLoadMoreDrafts: () => unknown;
    handleLoadMoreScheduledMessages: () => unknown;
    handleRetryUploadingAttachment: (
      messageId: string,
      attachmentId: string,
    ) => unknown;
    handleRemoveUploadingAttachment: (
      messageId: string,
      attachmentId: string,
    ) => unknown;
    handleInlineEditSave: (value: string) => unknown;
    handleMarkAllMentionsRead: () => unknown;
    handleMarkAllNotificationsRead: () => unknown;
    handleMarkAllUnreadActivities: () => unknown;
    handleMarkConversationUnread: () => unknown;
    openBrowseChannels: () => void;
    openDirectMessage: (contactId: string) => unknown;
    handleOpenPersonalFeed: (feedId: string) => unknown;
    openDraftHubTab: (tab: DraftHubTab) => void;
    handleRescheduleScheduledDraft: (
      scheduledId: string,
      scheduledFor: Date,
    ) => unknown;
    handleRetryOptimisticMessage: (message: ConversationMessage) => unknown;
    handleSearchResultSelect: (messageId: string) => unknown;
    handleSend: (payload: TeamChatComposerDraftPayload) => unknown;
    handleSendDraftHubDraftNow: (draftId: string) => unknown;
    handleSendScheduledDraftNow: (scheduledId: string) => unknown;
    handleScheduleDraftHubDraft: (
      draftId: string,
      scheduledFor: Date,
    ) => unknown;
    handleScheduleComposerMessage: (
      payload: TeamChatComposerDraftPayload,
      scheduledFor: Date,
    ) => unknown;
    handleForwardSubmit: (
      payload: Parameters<TeamChatScreenViewProps['onSubmitForward']>[0],
    ) => unknown;
    handleTogglePinMessage: (messageId: string, isPinned: boolean) => unknown;
    toggleReaction: (messageId: string, emoji: string) => unknown;
    handleConvertScheduledDraftToDraft: (scheduledId: string) => unknown;
    toggleStarredConversation: () => unknown;
    handleUnarchiveConversation: (roomId: string) => unknown;
    handleUnhideConversation: (roomId: string) => unknown;
    handleUpdatePresence: (
      status: 'online' | 'away' | 'busy' | 'offline',
    ) => unknown;
  };
}

export function useTeamChatViewModel(
  params: UseTeamChatViewModelParams,
): TeamChatScreenViewProps {
  const { baseProps, actions } = params;

  return {
    ...baseProps,
    onAcceptInvitation: (invitationId) => {
      void actions.handleAcceptInvitation(invitationId);
    },
    onBrowseSortChange: (value) => {
      actions.setBrowseSortBy(value);
    },
    onConfirmDeleteMessage: () => {
      void actions.handleConfirmDeleteMessage();
    },
    onDelete: (message) => {
      actions.requestDeleteMessage(message.id, 'menu');
    },
    onDeleteAttachment: (messageId, attachmentId) => {
      void actions.handleDeleteAttachment(messageId, attachmentId);
    },
    onDeleteDraft: (draftId) => {
      void actions.handleDeleteDraftHubDraft(draftId);
    },
    onDeleteDrafts: (draftIds) => {
      void actions.handleDeleteDraftHubDrafts(draftIds);
    },
    onDeleteScheduled: (scheduledId) => {
      void actions.handleDeleteScheduledDraft(scheduledId);
    },
    onLoadMoreDrafts: () => {
      void actions.handleLoadMoreDrafts();
    },
    onLoadMoreScheduled: () => {
      void actions.handleLoadMoreScheduledMessages();
    },
    onRetryUploadingAttachment: (messageId, attachmentId) => {
      void actions.handleRetryUploadingAttachment(messageId, attachmentId);
    },
    onRemoveUploadingAttachment: (messageId, attachmentId) => {
      void actions.handleRemoveUploadingAttachment(messageId, attachmentId);
    },
    onForwardDialogOpenChange: (open) => {
      if (!open) actions.clearForwardState();
    },
    onInlineEditSave: (value) => {
      void actions.handleInlineEditSave(value);
    },
    onMarkAllMentionsRead: () => {
      void actions.handleMarkAllMentionsRead();
    },
    onMarkAllNotificationsRead: () => {
      void actions.handleMarkAllNotificationsRead();
    },
    onMarkAllUnread: () => {
      void actions.handleMarkAllUnreadActivities();
    },
    onMarkConversationUnread: () => {
      void actions.handleMarkConversationUnread();
    },
    onOpenBrowseChannels: () => {
      actions.openBrowseChannels();
    },
    onOpenCreateChannel: () => actions.setCreateChannelDialogOpen(true),
    onOpenCreateGroupDm: () => actions.setCreateGroupDmDialogOpen(true),
    onOpenDirectMessage: (contactId) => {
      void actions.openDirectMessage(contactId);
    },
    onOpenFeed: (feedId) => {
      void actions.handleOpenPersonalFeed(feedId);
    },
    onOpenDraftHubTab: (tab) => {
      actions.openDraftHubTab(tab);
    },
    onOpenPinnedMessage: (messageId) => {
      void actions.handleSearchResultSelect(messageId);
    },
    onRescheduleScheduled: (scheduledId, scheduledFor) => {
      void actions.handleRescheduleScheduledDraft(scheduledId, scheduledFor);
    },
    onRetryOptimisticMessage: (message) => {
      void actions.handleRetryOptimisticMessage(message);
    },
    onSearchResultSelect: (messageId) => {
      void actions.handleSearchResultSelect(messageId);
    },
    onSend: (value) => {
      void actions.handleSend(value);
    },
    onSendDraftNow: (draftId) => {
      void actions.handleSendDraftHubDraftNow(draftId);
    },
    onSendScheduledNow: (scheduledId) => {
      void actions.handleSendScheduledDraftNow(scheduledId);
    },
    onScheduleDraft: (draftId, scheduledFor) => {
      void actions.handleScheduleDraftHubDraft(draftId, scheduledFor);
    },
    onScheduleMessage: (value, scheduledFor) => {
      void actions.handleScheduleComposerMessage(value, scheduledFor);
    },
    onSubmitForward: (payload) => {
      void actions.handleForwardSubmit(payload);
    },
    onTogglePinMessage: (messageId, isPinned) => {
      void actions.handleTogglePinMessage(messageId, isPinned);
    },
    onToggleReaction: (messageId, emoji) => {
      void actions.toggleReaction(messageId, emoji);
    },
    onToggleSection: (section) =>
      actions.setOpenSections((previous) => ({
        ...previous,
        [section]: !previous[section],
      })),
    onConvertScheduledToDraft: (scheduledId) => {
      void actions.handleConvertScheduledDraftToDraft(scheduledId);
    },
    onToggleStarredConversation: () => {
      void actions.toggleStarredConversation();
    },
    onUnarchiveConversation: (roomId) => {
      void actions.handleUnarchiveConversation(roomId);
    },
    onUnhideConversation: (roomId) => {
      void actions.handleUnhideConversation(roomId);
    },
    onUpdatePresenceStatus: (status) => {
      void actions.handleUpdatePresence(status);
    },
  };
}
