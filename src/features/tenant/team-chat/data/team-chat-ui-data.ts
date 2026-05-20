export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type PersonalItemId =
  | 'mentions'
  | 'threads'
  | 'reactions'
  | 'unread'
  | 'drafts';
export type PersonalFeedKind = 'mentions' | 'threads' | 'reactions' | 'unread';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'canceled' | string;
export type ConversationKind = 'channel' | 'dm' | 'group_dm';
export type ConversationTab = 'messages' | 'files' | 'photos' | 'pins';
export type ConversationMessageContentFormat = 'plain_text' | 'rich_text_v1';
export type FileKind =
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'image'
  | 'video';
export type ConversationKey = `channel:${string}` | `dm:${string}` | `group_dm:${string}`;

export interface PersonalItem {
  id: PersonalItemId;
  label: string;
  unread?: number;
}

export interface WorkspaceChannel {
  id: string;
  name: string;
  unread?: number;
  visibility: 'public' | 'private';
  memberCount?: number;
  topic?: string;
  lastMessageSnippet?: string;
}

export interface ChannelViewerState {
  membershipStatus: 'member' | 'invited' | 'non_member';
  isInvited: boolean;
  canViewPreview: boolean;
  canJoin: boolean;
}

export interface DiscoverableChannel {
  id: string;
  name: string;
  roomKey?: string;
  visibility: 'public' | 'private';
  topic?: string;
  description?: string;
  memberCount: number;
  lastMessageAt?: string;
  updatedAt?: string;
  createdByDisplayName?: string;
  isArchived?: boolean;
  viewerState: ChannelViewerState;
}

export interface DirectMessageContact {
  id: string;
  name: string;
  unread?: number;
  status: PresenceStatus;
  source?: 'room' | 'directory';
  userId?: string;
  roomId?: string;
  avatarUrl?: string;
  role?: string;
  email?: string;
  localTime?: string;
  lastMessageSnippet?: string;
}

export interface GroupDirectMessageConversation {
  id: string;
  roomId: string;
  name: string;
  unread?: number;
  topic?: string;
  description?: string;
  memberCount: number;
  isArchived?: boolean;
  myRole?: string;
  lastMessageSnippet?: string;
  memberPreview?: PresenceUser[];
  memberPreviewOverflowCount?: number;
}

export interface PresenceUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface ConversationQuote {
  author: string;
  time: string;
  content: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted?: boolean;
  reactors?: MessageReactionReactor[];
}

export interface MessageReactionReactor {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
  reactedAt?: string;
}

export interface LinkPreview {
  url: string;
  canonicalUrl?: string;
  displayUrl?: string;
  title: string;
  resourceTitle?: string;
  caption: string;
  description?: string;
  excerpt?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  previewImageUrl?: string;
  previewImageAlt?: string;
  previewImageWidth?: number;
  previewImageHeight?: number;
  provider?: string;
  providerName?: string;
  providerIconUrl?: string;
  siteName?: string;
  type?: string;
  mediaType?: string;
  mimeType?: string;
  resourceType?: string;
  resourceTypeLabel?: string;
  embedUrl?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  status?: string;
  fetchedAt?: string;
  previewAssetId?: string;
  previewAssetStatus?: 'pending' | 'ready' | 'failed' | string;
  previewAssetSource?: 'rendered' | 'cached' | 'proxied' | 'external' | 'fallback' | string;
  previewAssetErrorCode?: string;
  previewVersion?: string;
  internalReference?: {
    kind: 'team_chat_message' | string;
    roomId: string;
    messageId: string;
    deepLinkUrl?: string;
    previewState?: 'ready' | 'message_deleted' | 'message_not_found' | 'forbidden' | string;
    roomSnapshot?: {
      id: string;
      roomType?: 'channel' | 'dm' | 'group_dm' | string;
      visibility?: 'public' | 'private' | string;
      name?: string;
      roomKey?: string;
    };
    messageSnapshot?: {
      id: string;
      authorId?: string;
      authorName?: string;
      authorAvatarUrl?: string;
      contentPreview?: string;
      createdAt?: string;
      isDeleted?: boolean;
      hasAttachments?: boolean;
    };
  };
}

export interface ImagePreview {
  title: string;
  fileName: string;
}

export interface ConversationMessageAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  attachmentType: 'file' | 'image' | 'video' | 'audio';
  mimeType?: string | null;
  fileSize?: string | null;
  documentType?: 'word' | 'excel' | 'powerpoint' | 'pdf' | 'text' | 'archive' | 'unknown' | string;
  previewStatus?: 'pending' | 'ready' | 'failed' | string;
  thumbnailUrl?: string;
  thumbnailUrlSmall?: string;
  thumbnailUrlMedium?: string;
  previewUrl?: string;
  openUrl?: string;
  downloadUrl?: string;
  previewWidth?: number;
  previewHeight?: number;
  previewPage?: number;
  pageCount?: number;
  previewUpdatedAt?: string;
  previewErrorCode?: string;
  previewVersion?: string;
  previewAssetSource?: 'rendered' | 'derived' | 'fallback' | 'none' | string;
}

export interface ConversationMessage {
  id: string;
  clientMessageId?: string;
  parentMessageId?: string;
  author: string;
  handle: string;
  time: string;
  sentAt?: string;
  messageType?: string;
  isSystem?: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  content: string;
  contentFormat?: ConversationMessageContentFormat;
  richContent?: Record<string, unknown> | null;
  avatarUrl?: string;
  isOwn?: boolean;
  dayLabel?: string;
  quote?: ConversationQuote;
  reactions?: MessageReaction[];
  attachments?: ConversationMessageAttachment[];
  isPinned?: boolean;
  imagePreview?: ImagePreview;
  linkPreviews?: LinkPreview[];
  linkPreview?: LinkPreview;
  linkPreviewStatus?: 'pending' | 'partial' | 'ready' | 'failed' | string;
  linkPreviewPendingUrls?: string[];
  linkPreviewFailedUrls?: string[];
  linkPreviewVersion?: string;
  forwardedMessage?: ForwardedMessageReference;
  isAttachmentPlaceholder?: boolean;
  deliveryStatus?: 'sending' | 'sent' | 'failed';
  isOptimistic?: boolean;
  errorMessage?: string;
}

export interface ForwardedMessageReference {
  sourceConversationKey: ConversationKey;
  sourceConversationKind: ConversationKind;
  sourceConversationVisibility?: 'public' | 'private';
  sourceConversationLabel: string;
  sourceConversationContext: string;
  sourceDateLabel: string;
  originalMessageId: string;
  originalAuthor: string;
  originalTime: string;
  originalContent: string;
  originalContentFormat?: ConversationMessageContentFormat;
  originalRichContent?: Record<string, unknown> | null;
  originalAvatarUrl?: string;
  attachments?: ConversationMessageAttachment[];
}

export interface SharedFile {
  id: string;
  name: string;
  kind: FileKind;
  sharedBy: string;
  uploadedAt: string;
  sizeLabel: string;
  fileUrl?: string;
  openUrl?: string;
  downloadUrl?: string;
  viewerSrc?: string;
  thumbnailSrc?: string;
  thumbnailSrcMedium?: string;
  documentType?: 'word' | 'excel' | 'powerpoint' | 'pdf' | 'text' | 'archive' | 'unknown' | string;
  previewStatus?: 'pending' | 'ready' | 'failed' | string;
  previewErrorCode?: string;
  previewVersion?: string;
  previewAssetSource?: 'rendered' | 'derived' | 'fallback' | 'none' | string;
  messageId?: string;
  attachmentType?: 'file' | 'image' | 'video' | 'audio';
}

export interface SharedPhoto {
  id: string;
  src: string;
  viewerSrc?: string;
  alt: string;
  monthLabel: string;
  uploadedAt: string;
  messageId?: string;
  sharedBy?: string;
}

export interface PersonalFeedItem {
  id: string;
  kind: PersonalFeedKind;
  isUnread: boolean;
  occurredAt?: string;
  channelId: string;
  channelName: string;
  channelRoomType?: ConversationKind;
  channelVisibility: 'public' | 'private';
  organizationId?: string;
  actor: string;
  actorAvatarUrl?: string;
  time: string;
  dateLabel: string;
  context: string;
  preview: string;
  detailContent?: string;
  mentionId?: string;
  notificationId?: string;
  messageId?: string;
  invitationId?: string;
  invitationStatus?: InvitationStatus;
  invitationMemberRole?: string;
  invitationAcceptedAt?: string;
  notificationType?: string;
  reactionEmoji?: string;
  reactionCount?: number;
  replyCount?: number;
  unreadMessageCount?: number;
  isReadStateDerived?: boolean;
}

export const quickReactionEmojis = [
  '\u{1F44D}',
  '\u{2764}\u{FE0F}',
  '\u{1F602}',
  '\u{1F62E}',
] as const;

export const defaultStarredConversationKeys: ConversationKey[] = [
  'channel:issues',
  'channel:general',
  'dm:aarav-shen',
];

export const personalItems: PersonalItem[] = [
  { id: 'mentions', label: 'Mentions' },
  { id: 'threads', label: 'Threads' },
  { id: 'reactions', label: 'Reactions' },
  { id: 'unread', label: 'Unread Message' },
  { id: 'drafts', label: 'Drafts & Scheduled' },
];

export const workspaceChannels: WorkspaceChannel[] = [
  {
    id: 'app-development',
    name: 'App Development',
    unread: 2,
    visibility: 'public',
    memberCount: 24,
    topic: 'Frontend and backend sprint delivery',
  },
  {
    id: 'general',
    name: 'General',
    unread: 9,
    visibility: 'public',
    memberCount: 20,
    topic: 'Company-wide updates and announcements',
  },
  {
    id: 'issues',
    name: 'Issues',
    visibility: 'public',
    memberCount: 20,
    topic: 'Bugs, incidents, hotfixes, and release blockers',
  },
  {
    id: 'tech-talk',
    name: 'Tech Talk',
    visibility: 'public',
    memberCount: 14,
    topic: 'Architecture, performance, and engineering deep dives',
  },
  {
    id: 'creative-corner',
    name: 'Creative Corner',
    unread: 9,
    visibility: 'private',
    memberCount: 9,
    topic: 'Design reviews and concept explorations',
  },
  {
    id: 'book-nook',
    name: 'Book Nook',
    visibility: 'private',
    memberCount: 7,
    topic: 'Reading club and knowledge sharing',
  },
];

export const directMessageContacts: DirectMessageContact[] = [
  {
    id: 'aarav-shen',
    name: 'Aarav Shen',
    unread: 2,
    status: 'online',
    role: 'Frontend Engineer',
    email: 'aarav.shen@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'diya-patel',
    name: 'Diya Patel',
    unread: 9,
    status: 'online',
    role: 'Product Designer',
    email: 'diya.patel@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'rohan',
    name: 'Rohan',
    status: 'away',
    role: 'QA Engineer',
    email: 'rohan.singh@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'priya-shah',
    name: 'Priya Shah',
    status: 'away',
    role: 'People Ops',
    email: 'priya.shah@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'piyush-aryan',
    name: 'Piyush Aryan',
    unread: 9,
    status: 'online',
    role: 'Backend Engineer',
    email: 'piyush.aryan@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'nayan-nook',
    name: 'Nayan Nook',
    status: 'away',
    role: 'Customer Success',
    email: 'nayan.nook@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'khang-nguyen',
    name: 'Khang Nguyen',
    status: 'online',
    role: 'Frontend Engineer',
    email: 'khang.nguyen@iccp.io',
    localTime: '3:14 PM',
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
];

export const issueFollowers: PresenceUser[] = [
  {
    id: 'alex-dev',
    name: 'Alex Dev',
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'nina-product',
    name: 'Nina Product',
    avatarUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'jason-ui',
    name: 'Jason UI',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'sophia-ops',
    name: 'Sophia Ops',
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
  },
  {
    id: 'mike-backend',
    name: 'Mike Backend',
    avatarUrl:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=80',
  },
];

export const personalFeedItems: PersonalFeedItem[] = [
  {
    id: 'feed-1',
    kind: 'threads',
    isUnread: true,
    channelId: 'issues',
    channelName: 'Issues',
    channelVisibility: 'public',
    actor: 'Khang Nguyen',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=100&q=80',
    time: '11:05 AM',
    dateLabel: 'Friday',
    context: 'replied in thread with 8 people',
    preview: 'FYI @hieu_nguyen we can ship this fix in the next hotpatch window.',
    replyCount: 8,
  },
  {
    id: 'feed-2',
    kind: 'mentions',
    isUnread: true,
    channelId: 'creative-corner',
    channelName: 'Creative Corner',
    channelVisibility: 'private',
    actor: 'Owen Tran',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=100&q=80',
    time: '10:21 AM',
    dateLabel: 'Friday',
    context: '@mention in private channel',
    preview: '@you can you validate the switch tab behavior before lunch?',
    replyCount: 3,
  },
  {
    id: 'feed-3',
    kind: 'reactions',
    isUnread: true,
    channelId: 'general',
    channelName: 'General',
    channelVisibility: 'public',
    actor: 'Mai Tran',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80',
    time: '09:42 AM',
    dateLabel: 'Friday',
    context: 'reacted to your message',
    preview: 'Release note deck is ready and stakeholder review starts at 2 PM.',
    reactionEmoji: '\u{2705}',
    reactionCount: 2,
  },
  {
    id: 'feed-4',
    kind: 'threads',
    isUnread: false,
    channelId: 'creative-corner',
    channelName: 'Creative Corner',
    channelVisibility: 'private',
    actor: 'Trinh Le',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=100&q=80',
    time: '03:38 PM',
    dateLabel: 'Thursday',
    context: 'continued thread discussion',
    preview: 'Pushed revised typography options with stronger hierarchy for mobile.',
    replyCount: 5,
  },
  {
    id: 'feed-5',
    kind: 'mentions',
    isUnread: false,
    channelId: 'tech-talk',
    channelName: 'Tech Talk',
    channelVisibility: 'public',
    actor: 'Jason UI',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    time: '02:10 PM',
    dateLabel: 'Thursday',
    context: '@channel mention',
    preview: '@channel We have a deep-dive on rendering performance at 4 PM.',
    replyCount: 2,
  },
  {
    id: 'feed-6',
    kind: 'reactions',
    isUnread: false,
    channelId: 'book-nook',
    channelName: 'Book Nook',
    channelVisibility: 'private',
    actor: 'Sophia Ops',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=100&q=80',
    time: '11:55 AM',
    dateLabel: 'Wednesday',
    context: 'reacted to your thread',
    preview: 'Designing Data-Intensive Applications chapter notes were very useful.',
    reactionEmoji: '\u{1F44F}',
    reactionCount: 3,
  },
];

export const seededMessagesByConversation: Record<ConversationKey, ConversationMessage[]> = {
  'channel:issues': [
    {
      id: 'msg-1',
      author: 'Alex Dev',
      handle: 'alex_dev',
      time: '10:02 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
      content:
        'Hey everyone, looks like the "Join Meeting" button is not working on Safari (v17.3). Anyone else seeing this?',
    },
    {
      id: 'msg-2',
      author: 'Nina Product',
      handle: 'nina_product',
      time: '10:03 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80',
      content:
        'Just tested and I can reproduce the same issue here. The button does nothing on click.',
      quote: {
        author: 'Alex Dev',
        time: '10:02 AM',
        content:
          'Hey everyone, looks like the "Join Meeting" button is not working on Safari (v17.3). Anyone else seeing this?',
      },
    },
    {
      id: 'msg-3',
      author: 'Jason UI',
      handle: 'jason_ui',
      time: '10:05 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      content:
        'Can confirm, it is a JavaScript event issue. We recently updated the modal component. Looking into it now.',
      reactions: [{ emoji: '\u{1F440}', count: 1 }],
    },
    {
      id: 'msg-4',
      author: 'Alex Dev',
      handle: 'alex_dev',
      time: '10:06 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
      content: "Here's what I'm seeing:",
      imagePreview: {
        title: 'Screenshot Preview',
        fileName: 'Screenshot2025-10-12_at_4.58.50_PM_1.png',
      },
    },
    {
      id: 'msg-5',
      author: 'Sophia Ops',
      handle: 'sophia_ops',
      time: '10:11 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      content:
        'Our team is receiving duplicate email notifications for every scheduled meeting.',
      reactions: [{ emoji: '\u{2705}', count: 2 }],
    },
    {
      id: 'msg-6',
      author: 'Mike Backend',
      handle: 'mike_backend',
      time: '10:13 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=120&q=80',
      content:
        'Can you drop a sample email header? It might be something in the cron job that is looping.',
      quote: {
        author: 'Sophia Ops',
        time: '10:11 AM',
        content:
          'Our team is receiving duplicate email notifications for every scheduled meeting.',
      },
    },
    {
      id: 'msg-7',
      author: 'You',
      handle: 'you',
      time: '10:17 AM',
      isOwn: true,
      content:
        'I can reproduce it on macOS Safari as well. I am checking whether the modal close trap is swallowing the click event.',
      reactions: [{ emoji: '\u{1F44D}', count: 1, reacted: true }],
    },
  ],
  'channel:general': [
    {
      id: 'gen-1',
      author: 'Platform Bot',
      handle: 'platform_bot',
      time: '09:40 AM',
      content:
        'Reminder: Release note review starts at 3:30 PM. Please publish your updates before noon.',
    },
    {
      id: 'gen-2',
      author: 'Mai Tran',
      handle: 'mai_tran',
      time: '09:42 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&q=80',
      content: 'Release note deck is ready and stakeholder review starts at 2 PM.',
      reactions: [{ emoji: '\u{2705}', count: 2 }],
    },
  ],
  'channel:app-development': [
    {
      id: 'app-1',
      author: 'Engineering Lead',
      handle: 'eng_lead',
      time: '09:12 AM',
      content: 'Frontend and backend sprint check-in has moved to 4:00 PM today.',
    },
  ],
  'channel:tech-talk': [
    {
      id: 'tech-1',
      author: 'Architecture Guild',
      handle: 'arch_guild',
      time: 'Yesterday',
      content:
        'Next week: session on real-time collaboration patterns with WebSocket streams.',
    },
  ],
  'channel:creative-corner': [
    {
      id: 'creative-1',
      author: 'Design Team',
      handle: 'design_team',
      time: 'Yesterday',
      content: 'Posting Figma explorations for the new onboarding flow in #creative-corner.',
    },
  ],
  'channel:book-nook': [
    {
      id: 'book-1',
      author: 'People Ops',
      handle: 'people_ops',
      time: 'Friday',
      content: 'March reading pick: "Designing Data-Intensive Applications".',
    },
  ],
  'dm:aarav-shen': [
    {
      id: 'dm-1',
      author: 'Aarav Shen',
      handle: 'aarav_shen',
      time: '09:48 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      content: 'I pushed the latest workspace search states. Can you sanity-check the empty state copy?',
      linkPreview: {
        url: 'https://www.figma.com/file/iccp/team-chat-search-flow',
        title: 'Workspace search states',
        caption: 'figma.com',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=320&q=80',
      },
    },
    {
      id: 'dm-2',
      author: 'You',
      handle: 'you',
      time: '10:02 AM',
      isOwn: true,
      content: 'Looking now. The loading copy feels good, but the no-results state could suggest channels as fallback.',
      reactions: [{ emoji: '\u{1F44D}', count: 1, reacted: true }],
    },
    {
      id: 'dm-3',
      author: 'Aarav Shen',
      handle: 'aarav_shen',
      time: '10:08 AM',
      avatarUrl:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      content: 'Agree. I also attached the screen capture in case you want to compare the motion with Teams.',
      imagePreview: {
        title: 'Prototype walkthrough',
        fileName: 'team-chat-hover-menu.mp4',
      },
    },
  ],
  'dm:diya-patel': [
    {
      id: 'dm-diya-1',
      author: 'Diya Patel',
      handle: 'diya_patel',
      time: 'Yesterday',
      avatarUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      content: 'I dropped the updated spacing tokens for the composer shell. See if the footer still feels too tall.',
    },
  ],
  'dm:rohan': [
    {
      id: 'dm-rohan-1',
      author: 'Rohan',
      handle: 'rohan',
      time: 'Monday',
      avatarUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
      content: 'QA note: the notification dropdown still flashes when there are zero unread items.',
    },
  ],
  'dm:priya-shah': [
    {
      id: 'dm-priya-1',
      author: 'Priya Shah',
      handle: 'priya_shah',
      time: 'Monday',
      avatarUrl:
        'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=120&q=80',
      content: 'Can we align the team-chat mock with the onboarding workshop deck before Thursday?',
    },
  ],
  'dm:piyush-aryan': [
    {
      id: 'dm-piyush-1',
      author: 'Piyush Aryan',
      handle: 'piyush_aryan',
      time: 'Friday',
      avatarUrl:
        'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=120&q=80',
      content: 'Backend is ready for emoji reactions payloads once the UI shape is finalized.',
    },
  ],
  'dm:nayan-nook': [
    {
      id: 'dm-nayan-1',
      author: 'Nayan Nook',
      handle: 'nayan_nook',
      time: 'Friday',
      avatarUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      content: 'Customer success wants pinned screenshots in the Files tab too, not only in messages.',
    },
  ],
};

export const sharedFilesByConversation: Record<ConversationKey, SharedFile[]> = {
  'channel:issues': [
    {
      id: 'issues-file-1',
      name: 'Safari-click-regression-notes.docx',
      kind: 'document',
      sharedBy: 'Nina Product',
      uploadedAt: '11 Mar',
      sizeLabel: '1.2 MB',
    },
    {
      id: 'issues-file-2',
      name: 'join-meeting-error-headers.txt',
      kind: 'document',
      sharedBy: 'Mike Backend',
      uploadedAt: '11 Mar',
      sizeLabel: '18 KB',
    },
    {
      id: 'issues-file-3',
      name: 'modal-event-trace.json',
      kind: 'archive',
      sharedBy: 'Alex Dev',
      uploadedAt: '10 Mar',
      sizeLabel: '340 KB',
    },
  ],
  'channel:general': [
    {
      id: 'general-file-1',
      name: 'Release-Review-Checklist.pdf',
      kind: 'document',
      sharedBy: 'Platform Bot',
      uploadedAt: 'Today',
      sizeLabel: '482 KB',
    },
  ],
  'channel:app-development': [
    {
      id: 'app-file-1',
      name: 'Sprint-Burndown.xlsx',
      kind: 'spreadsheet',
      sharedBy: 'Engineering Lead',
      uploadedAt: 'Yesterday',
      sizeLabel: '220 KB',
    },
  ],
  'channel:tech-talk': [
    {
      id: 'tech-file-1',
      name: 'Realtime-Collaboration-Slides.pptx',
      kind: 'presentation',
      sharedBy: 'Architecture Guild',
      uploadedAt: 'Yesterday',
      sizeLabel: '3.1 MB',
    },
  ],
  'channel:creative-corner': [
    {
      id: 'creative-file-1',
      name: 'Composer-spacing-v4.fig',
      kind: 'image',
      sharedBy: 'Design Team',
      uploadedAt: 'Yesterday',
      sizeLabel: '1.8 MB',
    },
  ],
  'channel:book-nook': [
    {
      id: 'book-file-1',
      name: 'DDIA-notes.md',
      kind: 'document',
      sharedBy: 'People Ops',
      uploadedAt: 'Friday',
      sizeLabel: '56 KB',
    },
  ],
  'dm:aarav-shen': [
    {
      id: 'dm-file-1',
      name: 'Search-empty-state-copy.docx',
      kind: 'document',
      sharedBy: 'Aarav Shen',
      uploadedAt: 'Today',
      sizeLabel: '96 KB',
    },
    {
      id: 'dm-file-2',
      name: 'hover-toolbar-comparison.mp4',
      kind: 'video',
      sharedBy: 'Aarav Shen',
      uploadedAt: 'Today',
      sizeLabel: '24 MB',
    },
  ],
  'dm:diya-patel': [
    {
      id: 'diya-file-1',
      name: 'Composer-spacing-tokens.fig',
      kind: 'image',
      sharedBy: 'Diya Patel',
      uploadedAt: 'Yesterday',
      sizeLabel: '1.1 MB',
    },
  ],
  'dm:rohan': [],
  'dm:priya-shah': [],
  'dm:piyush-aryan': [],
  'dm:nayan-nook': [],
};

export const sharedPhotosByConversation: Record<ConversationKey, SharedPhoto[]> = {
  'channel:issues': [
    {
      id: 'issues-photo-1',
      src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80',
      alt: 'Laptop with debug tooling open',
      monthLabel: 'March',
      uploadedAt: 'Today',
    },
    {
      id: 'issues-photo-2',
      src: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80',
      alt: 'Meeting room with dashboard display',
      monthLabel: 'March',
      uploadedAt: 'Yesterday',
    },
    {
      id: 'issues-photo-3',
      src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=640&q=80',
      alt: 'Team discussing around a laptop',
      monthLabel: 'February',
      uploadedAt: '2 weeks ago',
    },
  ],
  'channel:general': [
    {
      id: 'general-photo-1',
      src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=640&q=80',
      alt: 'People collaborating in the office',
      monthLabel: 'March',
      uploadedAt: 'Today',
    },
  ],
  'channel:app-development': [],
  'channel:tech-talk': [],
  'channel:creative-corner': [
    {
      id: 'creative-photo-1',
      src: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=640&q=80',
      alt: 'Design desk with monitor and tablet',
      monthLabel: 'March',
      uploadedAt: 'Yesterday',
    },
    {
      id: 'creative-photo-2',
      src: 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?auto=format&fit=crop&w=640&q=80',
      alt: 'Workspace monitor with UI mockups',
      monthLabel: 'January',
      uploadedAt: '2 months ago',
    },
  ],
  'channel:book-nook': [],
  'dm:aarav-shen': [
    {
      id: 'dm-aarav-photo-1',
      src: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=640&q=80',
      alt: 'Developer workspace with multiple screens',
      monthLabel: 'March',
      uploadedAt: 'Today',
    },
    {
      id: 'dm-aarav-photo-2',
      src: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=640&q=80',
      alt: 'Code editor on a laptop',
      monthLabel: 'February',
      uploadedAt: 'Last month',
    },
  ],
  'dm:diya-patel': [
    {
      id: 'dm-diya-photo-1',
      src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=640&q=80',
      alt: 'Design critique session around a whiteboard',
      monthLabel: 'March',
      uploadedAt: 'Yesterday',
    },
  ],
  'dm:rohan': [],
  'dm:priya-shah': [],
  'dm:piyush-aryan': [],
  'dm:nayan-nook': [],
};


