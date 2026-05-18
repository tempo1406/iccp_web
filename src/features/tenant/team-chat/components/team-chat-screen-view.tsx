import { Sidebar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Tabs } from '@/components/ui/tabs';
import {
  type ConversationKey,
  type ConversationKind,
  type ConversationMessage,
  type ConversationTab,
  type DirectMessageContact,
  type DiscoverableChannel,
  type GroupDirectMessageConversation,
  type WorkspaceChannel,
} from '../data/team-chat-ui-data';
import {
  type DraftHubTab,
  type TeamChatDraftItem,
  type TeamChatScheduledItem,
} from '../data/team-chat-drafts-ui-data';
import {
  type ActiveConversationDisplay,
  type ComposerAttachmentDraft,
  type ComposerState,
  type MentionCandidate,
  type PersonalFilter,
  type RecoverableConversationItem,
  type SidebarDraftIndicator,
  type StarredConversationItem,
  type TeamChatOpenSections,
  type TeamChatView,
  type TeamChatComposerDraftPayload,
  type UploadingAttachmentDraft,
} from '../lib/team-chat-screen.shared';
import { type InlineEditState } from '../lib/team-chat-messages-tab.shared';
import { TeamChatConversationHeader } from './team-chat-conversation-header';
import { TeamChatCreateChannelDialog } from './team-chat-create-channel-dialog';
import { TeamChatCreateGroupDmDialog } from './team-chat-create-group-dm-dialog';
import { TeamChatDeleteMessageDialog } from './team-chat-delete-message-dialog';
import { TeamChatBrowseChannelsView } from './team-chat-browse-channels-view';
import { TeamChatDraftsView } from './team-chat-drafts-view';
import { TeamChatFilesTab } from './team-chat-files-tab';
import { TeamChatForwardDialog } from './team-chat-forward-dialog';
import { TeamChatMessagesTab } from './team-chat-messages-tab';
import { TeamChatMobileChannelBar } from './team-chat-mobile-channel-bar';
import { TeamChatPersonalView } from './team-chat-personal-view';
import { TeamChatPhotosTab } from './team-chat-photos-tab';
import { TeamChatPinsTab } from './team-chat-pins-tab';
import { TeamChatSidebar } from './team-chat-sidebar';
import { type TeamChatRoomScopeFilterControls } from '../lib/team-chat-scope.shared';
import type { TeamChatUnreadAggregates } from '../services/types/team-chat.types';

export interface TeamChatScreenViewProps {
  activeChannel: WorkspaceChannel;
  activeConversationRoom: WorkspaceChannel;
  activeConversationDisplay: ActiveConversationDisplay;
  activeConversationKey: ConversationKey;
  activeConversationKind: ConversationKind;
  activeConversationIsManualUnread: boolean;
  activeConversationPlaceholder: string;
  activeConversationStarred: boolean;
  activeDmId: string;
  activeTab: ConversationTab;
  activeTypingSummary: string;
  activeView: TeamChatView;
  archivedRecoverableItems: RecoverableConversationItem[];
  availableHeaderTabs: Parameters<typeof TeamChatConversationHeader>[0]['availableTabs'];
  composerAttachments: ComposerAttachmentDraft[];
  composerDraftSeedValue: string;
  composerDraftSeedPayload: TeamChatComposerDraftPayload;
  composerResetKey: number;
  composerState: ComposerState | null;
  composerScheduledNotice:
    | {
        label: string;
        ctaLabel: string;
      }
    | null;
  createChannelDialogOpen: boolean;
  createGroupDmDialogOpen: boolean;
  currentUserPresenceStatus: 'online' | 'away' | 'busy' | 'offline';
  draftHubCounts: { drafts: number; scheduled: number };
  sidebarDraftIndicators: Record<string, SidebarDraftIndicator>;
  manualUnreadRoomIds: string[];
  draftItems: TeamChatDraftItem[];
  draftHubActiveTab: DraftHubTab;
  draftsHasMore?: boolean;
  draftsLoading?: boolean;
  draftsLoadingMore?: boolean;
  deferredMessageSearch: string;
  deleteDialogMessage: Parameters<typeof TeamChatDeleteMessageDialog>[0]['message'];
  deleteMessagePending: boolean;
  browseChannels: DiscoverableChannel[];
  browseHasMore: boolean;
  browseJoiningRoomId?: string | null;
  browseLoading: boolean;
  browseLoadingMore: boolean;
  browsePreviewChannel: DiscoverableChannel | null;
  browsePreviewErrorMessage?: string | null;
  browsePreviewLoading: boolean;
  browseSearch: string;
  browseSelectedChannelId: string;
  browseSortBy: 'recent' | 'members' | 'name';
  roomScopeFilter: TeamChatRoomScopeFilterControls;
  dmContacts: DirectMessageContact[];
  filesSearch: string;
  filesLoading?: boolean;
  filteredFiles: Parameters<typeof TeamChatFilesTab>[0]['filteredFiles'];
  forwardState: Parameters<typeof TeamChatForwardDialog>[0]['forwardState'];
  forwardTargets: Parameters<typeof TeamChatForwardDialog>[0]['targets'];
  photosLoading?: boolean;
  groupedPhotos: Parameters<typeof TeamChatPhotosTab>[0]['groupedPhotos'];
  hiddenRecoverableItems: RecoverableConversationItem[];
  highlightedMessageId: string | null;
  isDraftsView: boolean;
  inlineEditState: InlineEditState | null;
  isLoadingOlderMessages?: boolean;
  isPersonalView: boolean;
  mentionCandidates: MentionCandidate[];
  mentionNameLookup: string[];
  messageSearch: string;
  messages: ConversationMessage[];
  openSections: TeamChatOpenSections;
  personalFeeds: Parameters<typeof TeamChatPersonalView>[0]['personalFeeds'];
  personalFilter: PersonalFilter;
  personalUnreadCounts: Record<'mentions' | 'threads' | 'reactions' | 'unread', number>;
  unreadAggregates?: TeamChatUnreadAggregates | null;
  pinnedConversationMessages: Parameters<typeof TeamChatPinsTab>[0]['pinnedMessages'];
  activePinnedCount: number;
  scheduledHasMore?: boolean;
  scheduledLoading?: boolean;
  scheduledLoadingMore?: boolean;
  searchLoading: boolean;
  searchOpen: boolean;
  searchResults: Parameters<typeof TeamChatConversationHeader>[0]['searchResults'];
  selectedPersonalFeed: Parameters<typeof TeamChatPersonalView>[0]['selectedPersonalFeed'];
  sidebarChannels: WorkspaceChannel[];
  sidebarGroupDmRooms: GroupDirectMessageConversation[];
  starredItems: StarredConversationItem[];
  typingIndicatorText: string | null;
  readOnlyVariant?: 'default' | 'announcements';
  uploadingAttachmentsByMessageId: Record<string, UploadingAttachmentDraft[]>;
  workspaceChannels: WorkspaceChannel[];
  canLoadOlderMessages?: boolean;
  activeChannelDetails: Parameters<typeof TeamChatConversationHeader>[0]['activeChannelDetails'];
  activeChannelTabs: Parameters<typeof TeamChatConversationHeader>[0]['channelTabs'];
  activeDirectMessageTabs: Parameters<typeof TeamChatConversationHeader>[0]['directMessageTabs'];
  onAcceptInvitation: (invitationId: string) => void;
  onCancelComposer: () => void;
  onComposerAttachmentRemove: (attachmentId: string) => void;
  onComposerAttachmentSelect: (files: File[]) => void;
  onConfirmDeleteMessage: () => void;
  onBrowseSearchChange: (value: string) => void;
  onBrowseSelectChannel: (roomId: string) => void;
  onBrowseSortChange: (value: 'recent' | 'members' | 'name') => void;
  onCopyLink: (message: ConversationMessage) => void;
  onCopyMessage: (message: ConversationMessage) => void;
  onCreateChannelDialogOpenChange: (open: boolean) => void;
  onCreateChannelSubmit: Parameters<typeof TeamChatCreateChannelDialog>[0]['onSubmit'];
  onCreateGroupDmDialogOpenChange: (open: boolean) => void;
  onCreateGroupDmSubmit: Parameters<typeof TeamChatCreateGroupDmDialog>[0]['onSubmit'];
  onDelete: (message: ConversationMessage) => void;
  onDeleteAttachment: (messageId: string, attachmentId: string) => void;
  onDeleteDraft: (draftId: string) => void;
  onDeleteDrafts: (draftIds: string[]) => void;
  onDeleteScheduled: (scheduledId: string) => void;
  onLoadMoreBrowseChannels: () => void;
  onLoadMoreDrafts: () => void;
  onLoadMoreScheduled: () => void;
  onRetryUploadingAttachment: (messageId: string, attachmentId: string) => void;
  onRemoveUploadingAttachment: (messageId: string, attachmentId: string) => void;
  onDeleteDialogOpenChange: (open: boolean) => void;
  onDraftChange: (payload: TeamChatComposerDraftPayload) => void;
  onDraftPresenceChange: (hasText: boolean) => void;
  onEdit: (message: ConversationMessage) => void;
  onEditDraft: (draftId: string) => void;
  onEditScheduled: (scheduledId: string) => void;
  onEmojiPick: (messageId: string, emojiData: { emoji: string }) => void;
  onFilesSearchChange: (value: string) => void;
  onForward: (message: ConversationMessage) => void;
  onForwardDialogOpenChange: (open: boolean) => void;
  onForwardSourceOpen: (conversationKey: ConversationKey, messageId?: string) => void;
  canOpenForwardSourceConversation: Parameters<
    typeof TeamChatMessagesTab
  >[0]['canOpenForwardSourceConversation'];
  onHydrateReactionActors?: Parameters<typeof TeamChatMessagesTab>[0]['onHydrateReactionActors'];
  onInlineEditCancel: () => void;
  onInlineEditRemoveAttachment: (attachmentId: string) => void;
  onInlineEditSave: (value: string) => void;
  onInviteMembers: Parameters<typeof TeamChatConversationHeader>[0]['onInviteMembers'];
  onJoinPublicRoom: Parameters<typeof TeamChatConversationHeader>[0]['onJoinPublicRoom'];
  onLoadOlderMessages: () => void;
  onOpenDraftHubTab: (tab: DraftHubTab) => void;
  onOpenMessageLink?: (href: string) => void;
  onMarkAllMentionsRead: () => void;
  onMarkAllNotificationsRead: () => void;
  onMarkAllUnread: () => void;
  onMarkConversationUnread: () => void;
  onMessageSearchChange: (value: string) => void;
  onMoveChannelTab: Parameters<typeof TeamChatConversationHeader>[0]['onMoveChannelTab'];
  onMoveDirectMessageTab: Parameters<typeof TeamChatConversationHeader>[0]['onMoveDirectMessageTab'];
  onOpenChannel: (channelId: string) => void;
  onOpenBrowseChannels: () => void;
  onOpenCreateChannel: () => void;
  onOpenCreateGroupDm: () => void;
  onOpenDirectMessage: (contactId: string) => void;
  onOpenGroupChat: (roomId: string) => void;
  onOpenFeed: (feedId: string) => void;
  onOpenMemberDirectMessage: Parameters<typeof TeamChatConversationHeader>[0]['onOpenMemberDirectMessage'];
  onOpenPersonal: (itemId: 'mentions' | 'threads' | 'reactions' | 'unread' | 'drafts') => void;
  onOpenPinnedMessage: (messageId: string) => void;
  onReply: (message: ConversationMessage) => void;
  onRescheduleScheduled: (scheduledId: string, scheduledFor: Date) => void;
  onDismissOptimisticMessage: (messageId: string) => void;
  onRetryOptimisticMessage: (message: ConversationMessage) => void;
  onSearchOpenChange: (open: boolean) => void;
  onSearchResultSelect: (messageId: string) => void;
  onSelectFeed: (feedId: string) => void;
  onSelectFilter: (filter: PersonalFilter) => void;
  onSend: (payload: TeamChatComposerDraftPayload) => void;
  onSendDraftNow: (draftId: string) => void;
  onSendScheduledNow: (scheduledId: string) => void;
  onScheduleDraft: (draftId: string, scheduledFor: Date) => void;
  onScheduleMessage: (payload: TeamChatComposerDraftPayload, scheduledFor: Date) => void;
  scheduledDraftItems: TeamChatScheduledItem[];
  onSetActiveTab: (tab: ConversationTab) => void;
  onSubmitForward: Parameters<typeof TeamChatForwardDialog>[0]['onSubmit'];
  onToggleArchiveState: Parameters<typeof TeamChatConversationHeader>[0]['onToggleArchiveState'];
  onToggleChannelTabVisibility: Parameters<typeof TeamChatConversationHeader>[0]['onToggleChannelTabVisibility'];
  onToggleDirectMessageTabVisibility: Parameters<typeof TeamChatConversationHeader>[0]['onToggleDirectMessageTabVisibility'];
  onTogglePinMessage: (messageId: string, isPinned: boolean) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onToggleSection: (section: keyof TeamChatOpenSections) => void;
  onConvertScheduledToDraft: (scheduledId: string) => void;
  onToggleStarredConversation: () => void;
  onRemoveMember: Parameters<typeof TeamChatConversationHeader>[0]['onRemoveMember'];
  onUnarchiveConversation: (roomId: string) => void;
  onUnhideConversation: (roomId: string) => void;
  onUpdateMemberRole: Parameters<typeof TeamChatConversationHeader>[0]['onUpdateMemberRole'];
  onUpdateNotificationPreference: Parameters<typeof TeamChatConversationHeader>[0]['onUpdateNotificationPreference'];
  onUpdatePresenceStatus: (status: 'online' | 'away' | 'busy' | 'offline') => void;
  onUpdateRoomInfo: Parameters<typeof TeamChatConversationHeader>[0]['onUpdateRoomInfo'];
  onUpdateChannelVisibility: Parameters<typeof TeamChatConversationHeader>[0]['onUpdateChannelVisibility'];
  onUpdateRoomPolicies: Parameters<typeof TeamChatConversationHeader>[0]['onUpdateRoomPolicies'];
  getPersonalFeedCount: Parameters<typeof TeamChatPersonalView>[0]['getPersonalFeedCount'];
}

export function TeamChatScreenView({
  activeChannel,
  activeConversationRoom,
  activeConversationDisplay,
  activeConversationKey,
  activeConversationKind,
  activeConversationIsManualUnread,
  activeConversationPlaceholder,
  activeConversationStarred,
  activeDmId,
  activeTab,
  activeTypingSummary,
  activeView,
  archivedRecoverableItems,
  availableHeaderTabs,
  composerAttachments,
  composerDraftSeedValue,
  composerDraftSeedPayload,
  composerResetKey,
  composerState,
  composerScheduledNotice,
  createChannelDialogOpen,
  createGroupDmDialogOpen,
  currentUserPresenceStatus,
  draftHubCounts,
  sidebarDraftIndicators,
  manualUnreadRoomIds,
  draftItems,
  draftHubActiveTab,
  draftsHasMore,
  draftsLoading,
  draftsLoadingMore,
  deferredMessageSearch,
  deleteDialogMessage,
  deleteMessagePending,
  browseChannels,
  browseHasMore,
  browseJoiningRoomId,
  browseLoading,
  browseLoadingMore,
  browsePreviewChannel,
  browsePreviewErrorMessage,
  browsePreviewLoading,
  browseSearch,
  browseSelectedChannelId,
  browseSortBy,
  roomScopeFilter,
  dmContacts,
  filesSearch,
  filesLoading,
  filteredFiles,
  forwardState,
  forwardTargets,
  photosLoading,
  groupedPhotos,
  hiddenRecoverableItems,
  highlightedMessageId,
  isDraftsView,
  inlineEditState,
  isLoadingOlderMessages,
  isPersonalView,
  mentionCandidates,
  mentionNameLookup,
  messageSearch,
  messages,
  openSections,
  personalFeeds,
  personalFilter,
  personalUnreadCounts,
  unreadAggregates,
  pinnedConversationMessages,
  activePinnedCount,
  scheduledHasMore,
  scheduledLoading,
  scheduledLoadingMore,
  searchLoading,
  searchOpen,
  searchResults,
  selectedPersonalFeed,
  sidebarChannels,
  sidebarGroupDmRooms,
  starredItems,
  typingIndicatorText,
  readOnlyVariant,
  uploadingAttachmentsByMessageId,
  workspaceChannels,
  canLoadOlderMessages,
  activeChannelDetails,
  activeChannelTabs,
  activeDirectMessageTabs,
  onAcceptInvitation,
  onCancelComposer,
  onComposerAttachmentRemove,
  onComposerAttachmentSelect,
  onConfirmDeleteMessage,
  onBrowseSearchChange,
  onBrowseSelectChannel,
  onBrowseSortChange,
  onCopyLink,
  onCopyMessage,
  onCreateChannelDialogOpenChange,
  onCreateChannelSubmit,
  onCreateGroupDmDialogOpenChange,
  onCreateGroupDmSubmit,
  onDelete,
  onDeleteAttachment,
  onDeleteDraft,
  onDeleteDrafts,
  onDeleteScheduled,
  onLoadMoreBrowseChannels,
  onLoadMoreDrafts,
  onLoadMoreScheduled,
  onRetryUploadingAttachment,
  onRemoveUploadingAttachment,
  onDeleteDialogOpenChange,
  onDraftChange,
  onDraftPresenceChange,
  onEdit,
  onEditDraft,
  onEditScheduled,
  onEmojiPick,
  onFilesSearchChange,
  onForward,
  onForwardDialogOpenChange,
  onForwardSourceOpen,
  canOpenForwardSourceConversation,
  onHydrateReactionActors,
  onInlineEditCancel,
  onInlineEditRemoveAttachment,
  onInlineEditSave,
  onInviteMembers,
  onJoinPublicRoom,
  onLoadOlderMessages,
  onOpenDraftHubTab,
  onOpenMessageLink,
  onMarkAllMentionsRead,
  onMarkAllNotificationsRead,
  onMarkAllUnread,
  onMarkConversationUnread,
  onMessageSearchChange,
  onMoveChannelTab,
  onMoveDirectMessageTab,
  onOpenChannel,
  onOpenBrowseChannels,
  onOpenCreateChannel,
  onOpenCreateGroupDm,
  onOpenDirectMessage,
  onOpenFeed,
  onOpenGroupChat,
  onOpenMemberDirectMessage,
  onOpenPersonal,
  onOpenPinnedMessage,
  onReply,
  onRescheduleScheduled,
  onDismissOptimisticMessage,
  onRetryOptimisticMessage,
  onSearchOpenChange,
  onSearchResultSelect,
  onSelectFeed,
  onSelectFilter,
  onSend,
  onSendDraftNow,
  onSendScheduledNow,
  onScheduleDraft,
  onScheduleMessage,
  scheduledDraftItems,
  onConvertScheduledToDraft,

  onSetActiveTab,
  onSubmitForward,
  onToggleArchiveState,
  onToggleChannelTabVisibility,
  onToggleDirectMessageTabVisibility,
  onTogglePinMessage,
  onToggleReaction,
  onToggleSection,
  onToggleStarredConversation,
  onRemoveMember,
  onUnarchiveConversation,
  onUnhideConversation,
  onUpdateMemberRole,
  onUpdateNotificationPreference,
  onUpdatePresenceStatus,
  onUpdateRoomInfo,
  onUpdateChannelVisibility,
  onUpdateRoomPolicies,
  getPersonalFeedCount,
}: TeamChatScreenViewProps) {
  const t = useTranslations('teamChat');
  return (
    <div className="bg-background flex h-full min-h-0 w-full flex-1 overflow-hidden border-y border-border">
      <div className="flex min-h-0 min-w-0 flex-1">
        <TeamChatSidebar
          activeConversationKey={activeConversationKey}
          activeConversationKind={activeConversationKind}
          activeChannelId={activeChannel.id}
          directMessageContacts={dmContacts}
          groupDmRooms={sidebarGroupDmRooms}
          activeDmId={activeDmId}
          activeView={activeView}
          channels={sidebarChannels}
          hiddenItems={hiddenRecoverableItems}
          archivedItems={archivedRecoverableItems}
          openSections={openSections}
          personalFilter={personalFilter}
          personalUnreadCounts={personalUnreadCounts}
          draftHubCounts={draftHubCounts}
          sidebarDraftIndicators={sidebarDraftIndicators}
          manualUnreadRoomIds={manualUnreadRoomIds}
          starredItems={starredItems}
          currentPresenceStatus={currentUserPresenceStatus}
          roomScopeFilter={roomScopeFilter}
          onToggleSection={onToggleSection}
          onUpdatePresenceStatus={onUpdatePresenceStatus}
          onOpenPersonal={onOpenPersonal}
          onOpenChannel={onOpenChannel}
          onOpenDirectMessage={onOpenDirectMessage}
          onOpenGroupChat={onOpenGroupChat}
          onUnhideConversation={onUnhideConversation}
          onUnarchiveConversation={onUnarchiveConversation}
          onOpenCreateChannel={onOpenCreateChannel}
          onOpenCreateGroupDm={onOpenCreateGroupDm}
          onOpenBrowseChannels={onOpenBrowseChannels}
        />

        <section className="bg-background relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-16 items-center border-b border-border bg-muted/25 px-4 sm:px-6 lg:hidden">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="rounded-lg border border-border bg-card p-1.5">
                <Sidebar className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-semibold">{t('common.workspace')}</span>
            </div>
          </div>

          {activeView === 'channel' && activeConversationKind === 'channel' ? (
            <TeamChatMobileChannelBar
              activeConversationKind={activeConversationKind}
              activeChannelId={activeChannel.id}
              channels={workspaceChannels}
              onOpenChannel={onOpenChannel}
            />
          ) : null}

          {isPersonalView ? (
            <TeamChatPersonalView
              personalFeeds={personalFeeds}
              personalFilter={personalFilter}
              selectedPersonalFeed={selectedPersonalFeed}
              onSelectFilter={onSelectFilter}
              onSelectFeed={onSelectFeed}
              onOpenFeed={onOpenFeed}
              onMarkAllMentionsRead={onMarkAllMentionsRead}
              onMarkAllNotificationsRead={onMarkAllNotificationsRead}
              onMarkAllUnread={onMarkAllUnread}
              onAcceptInvitation={onAcceptInvitation}
              getPersonalFeedCount={getPersonalFeedCount}
              unreadAggregates={unreadAggregates}
            />
          ) : isDraftsView ? (
            <TeamChatDraftsView
              activeTab={draftHubActiveTab}
              draftItems={draftItems}
              draftsHasMore={draftsHasMore}
              draftsLoading={draftsLoading}
              draftsLoadingMore={draftsLoadingMore}
              scheduledHasMore={scheduledHasMore}
              scheduledItems={scheduledDraftItems}
              scheduledLoading={scheduledLoading}
              scheduledLoadingMore={scheduledLoadingMore}
              onDeleteDraft={onDeleteDraft}
              onDeleteDrafts={onDeleteDrafts}
              onDeleteScheduled={onDeleteScheduled}
              onEditDraft={onEditDraft}
              onEditScheduled={onEditScheduled}
              onLoadMoreDrafts={onLoadMoreDrafts}
              onLoadMoreScheduled={onLoadMoreScheduled}
              onActiveTabChange={onOpenDraftHubTab}
              onRescheduleScheduled={onRescheduleScheduled}
              onScheduleDraft={onScheduleDraft}
              onSendDraftNow={onSendDraftNow}
              onSendScheduledNow={onSendScheduledNow}
              onConvertScheduledToDraft={onConvertScheduledToDraft}
            />
          ) : activeView === 'browse' ? (
            <TeamChatBrowseChannelsView
              channels={browseChannels}
              hasMore={browseHasMore}
              isLoading={browseLoading}
              isLoadingMore={browseLoadingMore}
              joiningRoomId={browseJoiningRoomId}
              previewChannel={browsePreviewChannel}
              previewErrorMessage={browsePreviewErrorMessage}
              previewLoading={browsePreviewLoading}
              search={browseSearch}
              selectedChannelId={browseSelectedChannelId}
              sortBy={browseSortBy}
              onJoinChannel={(roomId) => void onJoinPublicRoom(roomId)}
              onLoadMore={onLoadMoreBrowseChannels}
              onOpenChannel={onOpenChannel}
              onSearchChange={onBrowseSearchChange}
              onSelectChannel={onBrowseSelectChannel}
              onSortChange={onBrowseSortChange}
            />
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(value) => onSetActiveTab(value as ConversationTab)}
              className="flex h-full min-h-0 flex-1 gap-0 overflow-hidden"
            >
              <TeamChatConversationHeader
                activeConversationRoom={activeConversationRoom}
                availableTabs={availableHeaderTabs}
                activeConversationDisplay={activeConversationDisplay}
                activeConversationSubtitle={activeTypingSummary || undefined}
                activeConversationKind={activeConversationKind}
                isManualUnread={activeConversationIsManualUnread}
                activeConversationStarred={activeConversationStarred}
                activeChannelDetails={activeChannelDetails}
                channelTabs={activeChannelTabs}
                directMessageTabs={activeDirectMessageTabs}
                deferredMessageSearch={deferredMessageSearch}
                messageSearch={messageSearch}
                searchOpen={searchOpen}
                searchResults={searchResults}
                searchLoading={searchLoading}
                searchActiveMessageId={highlightedMessageId}
                mentionNames={mentionNameLookup}
                onMoveChannelTab={onMoveChannelTab}
                onMoveDirectMessageTab={onMoveDirectMessageTab}
                onMessageSearchChange={onMessageSearchChange}
                onSearchOpenChange={onSearchOpenChange}
                onSearchResultSelect={onSearchResultSelect}
                onSetActiveTab={onSetActiveTab}
                onOpenMemberDirectMessage={onOpenMemberDirectMessage}
                onToggleChannelTabVisibility={onToggleChannelTabVisibility}
                onToggleDirectMessageTabVisibility={onToggleDirectMessageTabVisibility}
                onToggleStarredConversation={onToggleStarredConversation}
                onMarkConversationUnread={onMarkConversationUnread}
                onUpdateNotificationPreference={onUpdateNotificationPreference}
                onInviteMembers={onInviteMembers}
                onUpdateMemberRole={onUpdateMemberRole}
                onJoinPublicRoom={onJoinPublicRoom}
                onUpdateRoomPolicies={onUpdateRoomPolicies}
                onRemoveMember={onRemoveMember}
                onUpdateRoomInfo={onUpdateRoomInfo}
                onUpdateChannelVisibility={onUpdateChannelVisibility}
                onToggleArchiveState={onToggleArchiveState}
              />

              <TeamChatMessagesTab
                activeConversationPlaceholder={activeConversationPlaceholder}
                canForwardMessages={activeChannelDetails.myPermissions?.canView ?? true}
                canReactToMessages={activeChannelDetails.myPermissions?.canSendMessage ?? true}
                canReplyToMessages={activeChannelDetails.myPermissions?.canSendMessage ?? true}
                readOnlyForwardOnlyActions={
                  activeChannelDetails.myPermissions?.canSendMessage === false &&
                  activeChannelDetails.myRole === 'member'
                }
                canSendMessage={activeChannelDetails.myPermissions?.canSendMessage ?? true}
                canTogglePinMessages={activeChannelDetails.myPermissions?.canPinMessages ?? true}
                canEditOwnMessages={activeChannelDetails.myPermissions?.canSendMessage ?? true}
                canDeleteOwnMessages={activeChannelDetails.myPermissions?.canSendMessage ?? true}
                readOnlyVariant={readOnlyVariant}
                conversationKey={activeConversationKey}
                composerAttachments={composerAttachments}
                composerResetKey={composerResetKey}
                composerState={composerState}
                draftSeedPayload={composerDraftSeedPayload}
                composerScheduledNotice={composerScheduledNotice}
                highlightedMessageId={highlightedMessageId}
                isActive={activeTab === 'messages'}
                inlineEditState={inlineEditState}
                mentionCandidates={mentionCandidates}
                mentionContextKind={activeConversationKind}
                messages={messages}
                typingIndicatorText={typingIndicatorText}
                canLoadOlderMessages={canLoadOlderMessages}
                isLoadingOlderMessages={isLoadingOlderMessages}
                onCancelComposer={onCancelComposer}
                onComposerAttachmentRemove={onComposerAttachmentRemove}
                onComposerAttachmentSelect={onComposerAttachmentSelect}
                onCopyLink={onCopyLink}
                onCopyMessage={onCopyMessage}
                onDeleteAttachment={onDeleteAttachment}
                onRetryUploadingAttachment={onRetryUploadingAttachment}
                onRemoveUploadingAttachment={onRemoveUploadingAttachment}
                onDelete={onDelete}
                onDraftChange={onDraftChange}
                onDraftPresenceChange={onDraftPresenceChange}
                draftSeedValue={composerDraftSeedValue}
                onEdit={onEdit}
                onEmojiPick={onEmojiPick}
                onForward={onForward}
                onForwardSourceOpen={onForwardSourceOpen}
                canOpenForwardSourceConversation={canOpenForwardSourceConversation}
                onInlineEditCancel={onInlineEditCancel}
                onInlineEditRemoveAttachment={onInlineEditRemoveAttachment}
                onInlineEditSave={onInlineEditSave}
                onLoadOlderMessages={onLoadOlderMessages}
                onOpenMessageLink={onOpenMessageLink}
                onOpenScheduledMessages={() => onOpenDraftHubTab('scheduled')}
                onReply={onReply}
                onSchedule={onScheduleMessage}
                onDismissOptimisticMessage={onDismissOptimisticMessage}
                onRetryOptimisticMessage={onRetryOptimisticMessage}
                onSend={onSend}
                onTogglePinMessage={onTogglePinMessage}
                onToggleReaction={onToggleReaction}
                onHydrateReactionActors={onHydrateReactionActors}
                uploadingAttachmentsByMessageId={uploadingAttachmentsByMessageId}
              />

              <TeamChatFilesTab
                conversationTitle={activeConversationDisplay.title}
                filesSearch={filesSearch}
                isLoading={Boolean(filesLoading)}
                filteredFiles={filteredFiles}
                onFilesSearchChange={onFilesSearchChange}
              />

              <TeamChatPhotosTab
                groupedPhotos={groupedPhotos}
                isLoading={Boolean(photosLoading)}
              />

              <TeamChatPinsTab
                canTogglePinMessage={activeChannelDetails.myPermissions?.canPinMessages ?? true}
                pinnedMessages={pinnedConversationMessages}
                pinnedCount={activePinnedCount}
                onOpenMessage={onOpenPinnedMessage}
                onOpenMessageLink={onOpenMessageLink}
                onTogglePinMessage={onTogglePinMessage}
              />
            </Tabs>
          )}

          <TeamChatForwardDialog
            key={forwardState ? `forward-${forwardState.message.id}` : 'forward-closed'}
            open={Boolean(forwardState)}
            forwardState={forwardState}
            targets={forwardTargets}
            onOpenChange={onForwardDialogOpenChange}
            onSubmit={onSubmitForward}
          />

          <TeamChatDeleteMessageDialog
            open={Boolean(deleteDialogMessage)}
            message={deleteDialogMessage}
            pending={deleteMessagePending}
            onOpenChange={onDeleteDialogOpenChange}
            onConfirm={onConfirmDeleteMessage}
          />

          <TeamChatCreateChannelDialog
            key={`channel-create-${roomScopeFilter.scope}-${roomScopeFilter.projectId || 'organization'}`}
            open={createChannelDialogOpen}
            onOpenChange={onCreateChannelDialogOpenChange}
            onSubmit={onCreateChannelSubmit}
            defaultScope={roomScopeFilter.scope}
            defaultProjectId={roomScopeFilter.projectId}
            projects={roomScopeFilter.projects}
            loadingProjects={roomScopeFilter.loadingProjects}
            projectErrorMessage={roomScopeFilter.projectErrorMessage}
          />

          <TeamChatCreateGroupDmDialog
            key={`group-dm-create-${roomScopeFilter.scope}-${roomScopeFilter.projectId || 'organization'}`}
            open={createGroupDmDialogOpen}
            onOpenChange={onCreateGroupDmDialogOpenChange}
            onSubmit={onCreateGroupDmSubmit}
            defaultScope={roomScopeFilter.scope}
            defaultProjectId={roomScopeFilter.projectId}
            projects={roomScopeFilter.projects}
            loadingProjects={roomScopeFilter.loadingProjects}
            projectErrorMessage={roomScopeFilter.projectErrorMessage}
          />
        </section>
      </div>
    </div>
  );
}

