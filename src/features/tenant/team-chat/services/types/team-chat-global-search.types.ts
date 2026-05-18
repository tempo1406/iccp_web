import type {
  TeamChatAttachmentDocumentType,
  TeamChatAttachmentType,
  TeamChatPresenceStatus,
  TeamChatRoomType,
  TeamChatRoomVisibility,
  TeamChatSupportedContextScope,
} from './team-chat.types';

export type TeamChatGlobalSearchApiTab = 'all' | 'people' | 'rooms' | 'messages' | 'files';
export type TeamChatGlobalSearchSort = 'best_match' | 'recent';

export interface GetTeamChatGlobalSearchSuggestParams {
  q: string;
  limitPerSection?: number;
  contextScope?: TeamChatSupportedContextScope;
  contextId?: string;
  currentRoomId?: string;
}

export interface GetTeamChatGlobalSearchResultsParams {
  q: string;
  tab?: TeamChatGlobalSearchApiTab;
  limit?: number;
  cursor?: string;
  contextScope?: TeamChatSupportedContextScope;
  contextId?: string;
  roomId?: string;
  roomType?: TeamChatRoomType;
  fromUserId?: string;
  hasAttachments?: boolean;
  fileType?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: TeamChatGlobalSearchSort;
}

export interface TeamChatGlobalSearchPersonItemResponse {
  entityType: 'person';
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  presenceStatus?: TeamChatPresenceStatus;
  isSelf?: boolean;
  dmRoomId?: string;
}

export interface TeamChatGlobalSearchRoomItemResponse {
  entityType: 'room';
  roomId: string;
  roomType: TeamChatRoomType;
  visibility: TeamChatRoomVisibility;
  name: string;
  roomKey?: string | null;
  topic?: string | null;
  memberCount: number;
  lastMessageAt?: string | null;
}

export interface TeamChatGlobalSearchMessageItemResponse {
  entityType: 'message';
  messageId: string;
  roomId: string;
  roomName: string;
  roomType: TeamChatRoomType;
  senderId: string;
  senderDisplayName: string;
  senderAvatarUrl?: string | null;
  snippet: string;
  sentAt: string;
  hasAttachments?: boolean;
}

export interface TeamChatGlobalSearchFileItemResponse {
  entityType: 'file';
  attachmentId: string;
  messageId: string;
  roomId: string;
  roomName: string;
  fileName: string;
  documentType?: TeamChatAttachmentDocumentType | null;
  attachmentType: TeamChatAttachmentType;
  uploaderDisplayName?: string | null;
  sentAt?: string | null;
}

export interface TeamChatGlobalSearchSectionResponse<TItem> {
  count: number;
  hasMore: boolean;
  items: TItem[];
}

export interface TeamChatGlobalSearchCountsResponse {
  people: number;
  rooms: number;
  messages: number;
  files: number;
}

export type TeamChatGlobalSearchResponseItem =
  | TeamChatGlobalSearchPersonItemResponse
  | TeamChatGlobalSearchRoomItemResponse
  | TeamChatGlobalSearchMessageItemResponse
  | TeamChatGlobalSearchFileItemResponse;

export interface TeamChatGlobalSearchSectionsResponse {
  people: TeamChatGlobalSearchSectionResponse<TeamChatGlobalSearchPersonItemResponse>;
  rooms: TeamChatGlobalSearchSectionResponse<TeamChatGlobalSearchRoomItemResponse>;
  messages: TeamChatGlobalSearchSectionResponse<TeamChatGlobalSearchMessageItemResponse>;
  files: TeamChatGlobalSearchSectionResponse<TeamChatGlobalSearchFileItemResponse>;
}

export interface TeamChatGlobalSearchSuggestResponse {
  query: string;
  tookMs: number;
  sections: TeamChatGlobalSearchSectionsResponse;
}

export interface TeamChatGlobalSearchResultsResponse {
  query: string;
  selectedTab: TeamChatGlobalSearchApiTab;
  sort: TeamChatGlobalSearchSort | string;
  tookMs: number;
  counts: TeamChatGlobalSearchCountsResponse;
  items: TeamChatGlobalSearchResponseItem[];
  sections?: TeamChatGlobalSearchSectionsResponse;
  hasMore: boolean;
  nextCursor?: string | null;
}
