import type { ApiFetchOptions } from '@/config/http/api-client';
import { appConfig } from '@/common/constant/app';
import { HEADER_KEY } from '@/common/constant/header';
import type { ApiErrorDto, ApiResponseDto } from '@/common/types/api';
import { BaseService } from '@/services/base-service';
import type {
  AddTeamChatReactionBody,
  CompleteTeamChatDirectUploadBody,
  CreateTeamChatRoomBody,
  CreateTeamChatScheduledMessageBody,
  ForwardTeamChatMessageBody,
  GetTeamChatRoomBootstrapParams,
  GetTeamChatRoomDetailParams,
  GetTeamChatCreateRoomCandidatesParams,
  GetTeamChatRoomInviteCandidatesParams,
  GetTeamChatCurrentDraftParams,
  GetTeamChatMessageContextParams,
  InviteTeamChatRoomMembersBody,
  ListTeamChatDraftsParams,
  ListTeamChatDiscoverRoomsParams,
  ListTeamChatRoomAttachmentsParams,
  ListTeamChatMessageCursorParams,
  ListTeamChatRoomMessageSearchParams,
  ListTeamChatMentionsParams,
  ListTeamChatMessagesParams,
  ListTeamChatNotificationsParams,
  ListTeamChatRoomsParams,
  ListTeamChatScheduledMessagesParams,
  MarkAllTeamChatMentionsReadBody,
  MarkTeamChatPersonalInboxRoomReadBody,
  MarkAllTeamChatNotificationsReadBody,
  SendTeamChatMessageBody,
  TeamChatAcceptInvitationResponse,
  TeamChatArchiveRoomResponse,
  TeamChatCancelScheduledMessageToDraftResponse,
  TeamChatCurrentDraftSaveResponse,
  TeamChatCreateRoomCandidatesResponse,
  TeamChatDeleteDraftResponse,
  TeamChatDeleteScheduledMessageResponse,
  TeamChatDirectUploadAuthBody,
  TeamChatDirectUploadAuthResponse,
  TeamChatDiscoverRoomsResponse,
  TeamChatDraftListResponse,
  TeamChatDraftResponse,
  TeamChatForwardMessageResponse,
  TeamChatJoinRoomResponse,
  TeamChatMarkMyMentionsReadResponse,
  TeamChatMarkNotificationsReadAllResponse,
  TeamChatMentionResponse,
  TeamChatMessageAttachmentResponse,
  TeamChatMessageReactionBatchItemResponse,
  TeamChatMessageCursorResponse,
  TeamChatMessageReactionSummaryResponse,
  TeamChatNotificationsListResponse,
  TeamChatPaginatedResponse,
  TeamChatPersonalInboxRoomReadResponse,
  TeamChatToggleMessagePinResponse,
  TeamChatPinnedMessageResponse,
  TeamChatPresenceResponse,
  TeamChatReadStateResponse,
  TeamChatRemoveRoomMemberResponse,
  TeamChatResolvedMessageContextResponse,
  TeamChatResolvedMessageLinkPreviewResponse,
  TeamChatRoomBootstrapResponse,
  TeamChatRoomAttachmentListResponse,
  TeamChatRoomAttachmentResponse,
  TeamChatRoomDetailResponse,
  TeamChatRoomInviteCandidatesResponse,
  TeamChatRoomInvitationResponse,
  TeamChatRoomMessageResponse,
  TeamChatRoomMessageSearchResponse,
  TeamChatRoomPreviewResponse,
  TeamChatRoomSummaryResponse,
  TeamChatRoomTabItemResponse,
  TeamChatRoomTabsResponse,
  TeamChatScheduledMessageListResponse,
  TeamChatScheduledMessageResponse,
  TeamChatSendScheduledMessageNowResponse,
  TeamChatTransferRoomOwnershipResponse,
  TeamChatToggleRoomStarResponse,
  TeamChatUnreadSummaryResponse,
  TeamChatUpdateChannelVisibilityResponse,
  TeamChatUpdateMentionReadResponse,
  TeamChatUpdateMessageReactionResponse,
  TeamChatUpdateMyRoomNotifySettingsResponse,
  TeamChatUpdateMyRoomVisibilityResponse,
  TeamChatUpdateRoomInfoResponse,
  TeamChatUpdateRoomMemberRoleResponse,
  TeamChatUpdateRoomPoliciesResponse,
  UpdateTeamChatCurrentDraftBody,
  UpdateTeamChatMemberRoleBody,
  UpdateTeamChatMessageBody,
  UpdateTeamChatChannelVisibilityBody,
  UpdateTeamChatNotifySettingsBody,
  UpdateTeamChatPresenceBody,
  UpdateTeamChatReadStateBody,
  UpdateTeamChatRoomInfoBody,
  UpdateTeamChatRoomOwnershipBody,
  UpdateTeamChatRoomPoliciesBody,
  UpdateTeamChatRoomTabsBody,
  UpdateTeamChatRoomVisibilityBody,
  UpdateTeamChatScheduledMessageBody,
  UploadTeamChatMessageAttachmentBody,
} from './types/team-chat.types';
import type {
  GetTeamChatGlobalSearchResultsParams,
  GetTeamChatGlobalSearchSuggestParams,
  TeamChatGlobalSearchResultsResponse,
  TeamChatGlobalSearchSuggestResponse,
} from './types/team-chat-global-search.types';

const TEAM_CHAT_API_PREFIX = '/v1';
const TEAM_CHAT_ROOMS_LIMIT_MIN = 1;
const TEAM_CHAT_ROOMS_LIMIT_MAX = 100;
const TEAM_CHAT_MESSAGES_LIMIT_MIN = 1;
const TEAM_CHAT_MESSAGES_LIMIT_MAX = 100;
const TEAM_CHAT_PINNED_LIMIT_MIN = 1;
const TEAM_CHAT_PINNED_LIMIT_MAX = 10;
const TEAM_CHAT_DRAFTS_LIMIT_MIN = 1;
const TEAM_CHAT_DRAFTS_LIMIT_MAX = 50;
const TEAM_CHAT_DISCOVER_LIMIT_MIN = 1;
const TEAM_CHAT_DISCOVER_LIMIT_MAX = 50;
const TEAM_CHAT_GLOBAL_SEARCH_SUGGEST_LIMIT_MIN = 1;
const TEAM_CHAT_GLOBAL_SEARCH_SUGGEST_LIMIT_MAX = 8;
const TEAM_CHAT_GLOBAL_SEARCH_RESULTS_LIMIT_MIN = 1;
const TEAM_CHAT_GLOBAL_SEARCH_RESULTS_LIMIT_MAX = 50;
const TEAM_CHAT_LIVE_FETCH_OPTIONS: ApiFetchOptions = {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
};

function appendQueryParam(query: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === '') return;
  if (typeof value === 'boolean') {
    query.set(key, value ? 'true' : 'false');
    return;
  }
  query.set(key, String(value));
}

function buildQueryString<TParams extends object>(params: TParams) {
  const query = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) =>
    appendQueryParam(query, key, value),
  );
  return query.toString();
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max);
}

function sanitizeRoomsParams(params: ListTeamChatRoomsParams): ListTeamChatRoomsParams {
  const nextParams: ListTeamChatRoomsParams = { ...params };
  const rawLimit = nextParams.limit;

  if (rawLimit !== undefined) {
    if (Number.isFinite(rawLimit)) {
      nextParams.limit = clampInteger(
        rawLimit,
        TEAM_CHAT_ROOMS_LIMIT_MIN,
        TEAM_CHAT_ROOMS_LIMIT_MAX,
      );
    } else {
      delete nextParams.limit;
    }
  }

  return nextParams;
}

function sanitizeDiscoverRoomsParams(
  params: ListTeamChatDiscoverRoomsParams,
): ListTeamChatDiscoverRoomsParams {
  const nextParams: ListTeamChatDiscoverRoomsParams = { ...params };
  const rawLimit = nextParams.limit;

  if (rawLimit !== undefined) {
    if (Number.isFinite(rawLimit)) {
      nextParams.limit = clampInteger(
        rawLimit,
        TEAM_CHAT_DISCOVER_LIMIT_MIN,
        TEAM_CHAT_DISCOVER_LIMIT_MAX,
      );
    } else {
      delete nextParams.limit;
    }
  }

  return nextParams;
}

function sanitizeMessagesLimit(limit?: number): number | undefined {
  if (limit === undefined) return undefined;
  if (!Number.isFinite(limit)) return undefined;
  return clampInteger(limit, TEAM_CHAT_MESSAGES_LIMIT_MIN, TEAM_CHAT_MESSAGES_LIMIT_MAX);
}

function sanitizePinnedMessagesLimit(limit?: number): number | undefined {
  if (limit === undefined) return undefined;
  if (!Number.isFinite(limit)) return undefined;
  return clampInteger(limit, TEAM_CHAT_PINNED_LIMIT_MIN, TEAM_CHAT_PINNED_LIMIT_MAX);
}

function sanitizeDraftsLimit(limit?: number): number | undefined {
  if (limit === undefined) return undefined;
  if (!Number.isFinite(limit)) return undefined;
  return clampInteger(limit, TEAM_CHAT_DRAFTS_LIMIT_MIN, TEAM_CHAT_DRAFTS_LIMIT_MAX);
}

function sanitizeGlobalSearchSuggestParams(
  params: GetTeamChatGlobalSearchSuggestParams,
): GetTeamChatGlobalSearchSuggestParams {
  const nextParams = { ...params };
  if (nextParams.limitPerSection !== undefined) {
    if (Number.isFinite(nextParams.limitPerSection)) {
      nextParams.limitPerSection = clampInteger(
        nextParams.limitPerSection,
        TEAM_CHAT_GLOBAL_SEARCH_SUGGEST_LIMIT_MIN,
        TEAM_CHAT_GLOBAL_SEARCH_SUGGEST_LIMIT_MAX,
      );
    } else {
      delete nextParams.limitPerSection;
    }
  }

  return nextParams;
}

function sanitizeGlobalSearchResultsParams(
  params: GetTeamChatGlobalSearchResultsParams,
): GetTeamChatGlobalSearchResultsParams {
  const nextParams = { ...params };
  if (nextParams.limit !== undefined) {
    if (Number.isFinite(nextParams.limit)) {
      nextParams.limit = clampInteger(
        nextParams.limit,
        TEAM_CHAT_GLOBAL_SEARCH_RESULTS_LIMIT_MIN,
        TEAM_CHAT_GLOBAL_SEARCH_RESULTS_LIMIT_MAX,
      );
    } else {
      delete nextParams.limit;
    }
  }

  return nextParams;
}

function buildAttachmentFormData(body: UploadTeamChatMessageAttachmentBody): FormData {
  const formData = new FormData();
  formData.append('file', body.file);

  if (body.attachmentType) formData.append('attachmentType', body.attachmentType);
  if (body.clientUploadId) formData.append('clientUploadId', body.clientUploadId);
  if (body.checksum) formData.append('checksum', body.checksum);
  if (body.width !== undefined) formData.append('width', String(body.width));
  if (body.height !== undefined) formData.append('height', String(body.height));
  if (body.durationMs !== undefined) formData.append('durationMs', String(body.durationMs));
  if (body.fileName) formData.append('fileName', body.fileName);

  return formData;
}

interface RawTeamChatRoomBootstrapResponse {
  room?: TeamChatRoomDetailResponse | null;
  roomDetail?: TeamChatRoomDetailResponse | null;
  tabs?: TeamChatRoomTabsResponse | TeamChatRoomTabItemResponse[] | null;
  roomTabs?: TeamChatRoomTabsResponse | TeamChatRoomTabItemResponse[] | null;
  messageCursor?: TeamChatMessageCursorResponse | null;
  messages?: TeamChatMessageCursorResponse | TeamChatRoomMessageResponse[] | null;
  cursor?: TeamChatMessageCursorResponse | null;
  draft?: TeamChatDraftResponse | null;
  currentDraft?: TeamChatDraftResponse | null;
  pinnedMessages?: TeamChatPinnedMessageResponse[] | null;
  pins?: TeamChatPinnedMessageResponse[] | null;
  readState?: TeamChatReadStateResponse | null;
  readStateSnapshot?: TeamChatReadStateResponse | null;
}

function normalizeRoomBootstrapTabs(
  roomId: string,
  value:
    | TeamChatRoomTabsResponse
    | TeamChatRoomTabItemResponse[]
    | null
    | undefined,
): TeamChatRoomTabsResponse | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return {
      roomId,
      tabs: value,
      updated: false,
      updatedAt: null,
    };
  }

  return value;
}

function normalizeRoomBootstrapMessageCursor(
  value:
    | TeamChatMessageCursorResponse
    | TeamChatRoomMessageResponse[]
    | null
    | undefined,
): TeamChatMessageCursorResponse | null {
  if (!value) return null;

  if (Array.isArray(value)) {
    return {
      items: value,
      hasMore: false,
      nextCursor: null,
    };
  }

  return value;
}

function normalizeRoomBootstrapResponse(
  roomId: string,
  value: RawTeamChatRoomBootstrapResponse,
): TeamChatRoomBootstrapResponse {
  return {
    room: value.room ?? value.roomDetail ?? null,
    tabs: normalizeRoomBootstrapTabs(roomId, value.tabs ?? value.roomTabs),
    messageCursor: normalizeRoomBootstrapMessageCursor(
      value.messageCursor ?? value.messages ?? value.cursor,
    ),
    draft: value.currentDraft ?? value.draft ?? null,
    pinnedMessages: value.pinnedMessages ?? value.pins ?? [],
    readState: value.readState ?? value.readStateSnapshot ?? null,
  };
}

function extractApiErrorMessage(payload?: ApiErrorDto): string {
  if (!payload) return 'Failed to upload attachment';

  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }

  return payload.message || payload.error || 'Failed to upload attachment';
}

interface DirectUploadTransportResponse {
  url?: string;
  filePath?: string;
  thumbnailUrl?: string;
  name?: string;
}


export class TeamChatService extends BaseService {
  private endpoint(path: string) {
    return `${TEAM_CHAT_API_PREFIX}${path}`;
  }

  private getByChatApi<T>(path: string, options?: ApiFetchOptions): Promise<T> {
    return this.get<T>(this.endpoint(path), options);
  }

  private postByChatApi<T, B = unknown>(
    path: string,
    body?: B,
    options?: ApiFetchOptions<B>,
  ): Promise<T> {
    return this.post<T, B>(this.endpoint(path), body, options);
  }

  private putByChatApi<T, B = unknown>(
    path: string,
    body?: B,
    options?: ApiFetchOptions<B>,
  ): Promise<T> {
    return this.put<T, B>(this.endpoint(path), body, options);
  }

  private deleteByChatApi<T>(path: string, options?: ApiFetchOptions): Promise<T> {
    return this.delete<T>(this.endpoint(path), options);
  }

  createRoom(body: CreateTeamChatRoomBody): Promise<TeamChatRoomDetailResponse> {
    return this.postByChatApi('/chat-box/rooms', body);
  }

  listRooms(
    params: ListTeamChatRoomsParams = {},
  ): Promise<TeamChatPaginatedResponse<TeamChatRoomSummaryResponse>> {
    const queryString = buildQueryString(sanitizeRoomsParams(params));
    return this.getByChatApi(
      queryString ? `/chat-box/rooms?${queryString}` : '/chat-box/rooms',
    );
  }

  getRoomDetail(
    roomId: string,
    params: GetTeamChatRoomDetailParams = {},
  ): Promise<TeamChatRoomDetailResponse> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString ? `/chat-box/rooms/${roomId}?${queryString}` : `/chat-box/rooms/${roomId}`,
    );
  }

  getRoomBootstrap(
    roomId: string,
    params: GetTeamChatRoomBootstrapParams = {},
  ): Promise<TeamChatRoomBootstrapResponse> {
    const queryString = buildQueryString({
      includeMembers: params.includeMembers,
      messageLimit: sanitizeMessagesLimit(params.messageLimit),
      pinnedLimit: sanitizePinnedMessagesLimit(params.pinnedLimit),
    });

    return this.getByChatApi<RawTeamChatRoomBootstrapResponse>(
      queryString
        ? `/chat-box/rooms/${roomId}/bootstrap?${queryString}`
        : `/chat-box/rooms/${roomId}/bootstrap`,
      TEAM_CHAT_LIVE_FETCH_OPTIONS,
    ).then((response) => normalizeRoomBootstrapResponse(roomId, response));
  }

  getRoomInviteCandidates(
    roomId: string,
    params: GetTeamChatRoomInviteCandidatesParams = {},
  ): Promise<TeamChatRoomInviteCandidatesResponse> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/invite-candidates?${queryString}`
        : `/chat-box/rooms/${roomId}/invite-candidates`,
    );
  }

  getCreateRoomCandidates(
    params: GetTeamChatCreateRoomCandidatesParams,
  ): Promise<TeamChatCreateRoomCandidatesResponse> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/create-candidates?${queryString}`
        : '/chat-box/rooms/create-candidates',
    );
  }

  discoverRooms(
    params: ListTeamChatDiscoverRoomsParams = {},
  ): Promise<TeamChatDiscoverRoomsResponse> {
    const queryString = buildQueryString(sanitizeDiscoverRoomsParams(params));
    return this.getByChatApi(
      queryString ? `/chat-box/rooms/discover?${queryString}` : '/chat-box/rooms/discover',
    );
  }

  getRoomPreview(roomId: string): Promise<TeamChatRoomPreviewResponse> {
    return this.getByChatApi(`/chat-box/rooms/${roomId}/preview`);
  }

  getMessageLinkPreview(
    roomId: string,
    messageId: string,
  ): Promise<TeamChatResolvedMessageLinkPreviewResponse> {
    const queryString = buildQueryString({ roomId, messageId });
    return this.getByChatApi(`/chat-box/messages/link-preview?${queryString}`);
  }

  getMessageContext(
    roomId: string,
    messageId: string,
    params: GetTeamChatMessageContextParams = {},
  ): Promise<TeamChatResolvedMessageContextResponse> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/messages/${messageId}/context?${queryString}`
        : `/chat-box/rooms/${roomId}/messages/${messageId}/context`,
    );
  }

  searchGlobalSuggest(
    params: GetTeamChatGlobalSearchSuggestParams,
    options?: ApiFetchOptions,
  ): Promise<TeamChatGlobalSearchSuggestResponse> {
    const queryString = buildQueryString(sanitizeGlobalSearchSuggestParams(params));
    return this.getByChatApi(
      queryString ? `/chat-box/search/suggest?${queryString}` : '/chat-box/search/suggest',
      options,
    );
  }

  searchGlobalResults(
    params: GetTeamChatGlobalSearchResultsParams,
    options?: ApiFetchOptions,
  ): Promise<TeamChatGlobalSearchResultsResponse> {
    const queryString = buildQueryString(sanitizeGlobalSearchResultsParams(params));
    return this.getByChatApi(
      queryString ? `/chat-box/search/results?${queryString}` : '/chat-box/search/results',
      options,
    );
  }

  updateRoomInfo(
    roomId: string,
    body: UpdateTeamChatRoomInfoBody,
  ): Promise<TeamChatUpdateRoomInfoResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}`, body);
  }

  updateChannelVisibility(
    roomId: string,
    body: UpdateTeamChatChannelVisibilityBody,
  ): Promise<TeamChatUpdateChannelVisibilityResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/visibility`, body);
  }

  updateRoomPolicies(
    roomId: string,
    body: UpdateTeamChatRoomPoliciesBody,
  ): Promise<TeamChatUpdateRoomPoliciesResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/policies`, body);
  }

  joinRoom(roomId: string): Promise<TeamChatJoinRoomResponse> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/join`);
  }

  inviteMembers(
    roomId: string,
    body: InviteTeamChatRoomMembersBody,
  ): Promise<TeamChatRoomInvitationResponse[]> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/invitations`, body);
  }

  acceptInvitation(invitationId: string): Promise<TeamChatAcceptInvitationResponse> {
    return this.postByChatApi(`/chat-box/invitations/${invitationId}/accept`);
  }

  updateMemberRole(
    roomId: string,
    memberId: string,
    body: UpdateTeamChatMemberRoleBody,
  ): Promise<TeamChatUpdateRoomMemberRoleResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/members/${memberId}/role`, body);
  }

  transferRoomOwnership(
    roomId: string,
    body: UpdateTeamChatRoomOwnershipBody,
  ): Promise<TeamChatTransferRoomOwnershipResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/ownership`, body);
  }

  updateMyNotifySettings(
    roomId: string,
    body: UpdateTeamChatNotifySettingsBody,
  ): Promise<TeamChatUpdateMyRoomNotifySettingsResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/members/me/notify-settings`, body);
  }

  updateMyRoomVisibility(
    roomId: string,
    body: UpdateTeamChatRoomVisibilityBody,
  ): Promise<TeamChatUpdateMyRoomVisibilityResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/members/me/visibility`, body);
  }

  archiveRoom(roomId: string): Promise<TeamChatArchiveRoomResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/archive`);
  }

  unarchiveRoom(roomId: string): Promise<TeamChatArchiveRoomResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/unarchive`);
  }

  getRoomTabs(roomId: string): Promise<TeamChatRoomTabsResponse> {
    return this.getByChatApi(`/chat-box/rooms/${roomId}/tabs`);
  }

  updateRoomTabs(
    roomId: string,
    body: UpdateTeamChatRoomTabsBody,
  ): Promise<TeamChatRoomTabsResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/tabs`, body);
  }

  removeMember(roomId: string, memberId: string): Promise<TeamChatRemoveRoomMemberResponse> {
    return this.deleteByChatApi(`/chat-box/rooms/${roomId}/members/${memberId}`);
  }

  starRoom(roomId: string): Promise<TeamChatToggleRoomStarResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/star`);
  }

  unstarRoom(roomId: string): Promise<TeamChatToggleRoomStarResponse> {
    return this.deleteByChatApi(`/chat-box/rooms/${roomId}/star`);
  }

  sendMessage(roomId: string, body: SendTeamChatMessageBody): Promise<TeamChatRoomMessageResponse> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/messages`, body);
  }

  forwardMessage(
    roomId: string,
    messageId: string,
    body: ForwardTeamChatMessageBody,
  ): Promise<TeamChatForwardMessageResponse> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}/forward`, body);
  }

  listMessages(
    roomId: string,
    params: ListTeamChatMessagesParams = {},
  ): Promise<TeamChatRoomMessageResponse[]> {
    const queryString = buildQueryString({
      ...params,
      limit: sanitizeMessagesLimit(params.limit),
    });
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/messages?${queryString}`
        : `/chat-box/rooms/${roomId}/messages`,
      TEAM_CHAT_LIVE_FETCH_OPTIONS,
    );
  }

  listMessagesByCursor(
    roomId: string,
    params: ListTeamChatMessageCursorParams = {},
  ): Promise<TeamChatMessageCursorResponse> {
    const queryString = buildQueryString({
      ...params,
      limit: sanitizeMessagesLimit(params.limit),
    });
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/messages/cursor?${queryString}`
        : `/chat-box/rooms/${roomId}/messages/cursor`,
      TEAM_CHAT_LIVE_FETCH_OPTIONS,
    );
  }

  searchMessages(
    roomId: string,
    params: ListTeamChatRoomMessageSearchParams,
  ): Promise<TeamChatRoomMessageSearchResponse> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/messages/search?${queryString}`
        : `/chat-box/rooms/${roomId}/messages/search`,
    );
  }

  updateMessage(
    roomId: string,
    messageId: string,
    body: UpdateTeamChatMessageBody,
  ): Promise<TeamChatRoomMessageResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}`, body);
  }

  deleteMessage(roomId: string, messageId: string): Promise<TeamChatRoomMessageResponse> {
    return this.deleteByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}`);
  }

  uploadMessageAttachment(
    roomId: string,
    messageId: string,
    body: UploadTeamChatMessageAttachmentBody,
  ): Promise<TeamChatMessageAttachmentResponse> {
    return this.postByChatApi(
      `/chat-box/rooms/${roomId}/messages/${messageId}/attachments`,
      buildAttachmentFormData(body),
    );
  }

  uploadMessageAttachmentWithProgress(
    roomId: string,
    messageId: string,
    body: UploadTeamChatMessageAttachmentBody,
    options?: {
      onProgress?: (progress: { loaded: number; total: number; percent: number }) => void;
    },
  ): Promise<TeamChatMessageAttachmentResponse> {
    const url = `${appConfig.apiBaseUrl}${this.endpoint(
      `/chat-box/rooms/${roomId}/messages/${messageId}/attachments`,
    )}`;
    const headers = new Headers();
    const accessToken = this.getToken();

    if (this.ctx.tenantId) {
      headers.set(HEADER_KEY.X_ORGANIZATION_ID, this.ctx.tenantId);
    }

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.responseType = 'json';

      headers.forEach((value, key) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        options?.onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100))),
        });
      };

      xhr.onerror = () => reject(new Error('Network error while uploading attachment'));
      xhr.onabort = () => reject(new Error('Attachment upload was aborted'));

      xhr.onload = () => {
        const responsePayload = xhr.response ?? (() => {
          try {
            return JSON.parse(xhr.responseText) as
              | ApiResponseDto<TeamChatMessageAttachmentResponse>
              | ApiErrorDto;
          } catch {
            return undefined;
          }
        })();

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve((responsePayload as ApiResponseDto<TeamChatMessageAttachmentResponse>).data);
          return;
        }

        reject(
          new Error(extractApiErrorMessage(responsePayload as ApiErrorDto | undefined)),
        );
      };

      xhr.send(buildAttachmentFormData(body));
    });
  }

  getDirectUploadAuth(
    roomId: string,
    messageId: string,
    body: TeamChatDirectUploadAuthBody,
  ): Promise<TeamChatDirectUploadAuthResponse> {
    return this.postByChatApi(
      `/chat-box/rooms/${roomId}/messages/${messageId}/attachments/direct-upload/auth`,
      body,
    );
  }

  completeDirectUpload(
    roomId: string,
    messageId: string,
    body: CompleteTeamChatDirectUploadBody,
  ): Promise<TeamChatMessageAttachmentResponse> {
    return this.putByChatApi(
      `/chat-box/rooms/${roomId}/messages/${messageId}/attachments/direct-upload/complete`,
      body,
    );
  }

  uploadMessageAttachmentDirect(
    roomId: string,
    messageId: string,
    body: UploadTeamChatMessageAttachmentBody & { clientUploadId: string },
    options?: {
      onProgress?: (progress: { loaded: number; total: number; percent: number }) => void;
    },
  ): Promise<TeamChatMessageAttachmentResponse> {
    return this.getDirectUploadAuth(roomId, messageId, {
      clientUploadId: body.clientUploadId,
      fileName: body.fileName ?? body.file.name,
    }).then(async (auth) => {
      const uploadResult = await this.uploadFileToDirectEndpoint(auth, body.file, options);
      const fileUrl = uploadResult.url?.trim();

      if (!fileUrl) {
        throw new Error('Direct upload succeeded but no file URL was returned');
      }

      return this.completeDirectUpload(roomId, messageId, {
        fileUrl,
        fileName: body.fileName ?? body.file.name,
        mimeType: body.file.type || body.attachmentType || 'application/octet-stream',
        fileSize: body.file.size,
        clientUploadId: body.clientUploadId,
        checksum: body.checksum,
      });
    });
  }

  private uploadFileToDirectEndpoint(
    auth: TeamChatDirectUploadAuthResponse,
    file: File,
    options?: {
      onProgress?: (progress: { loaded: number; total: number; percent: number }) => void;
    },
  ): Promise<DirectUploadTransportResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', auth.fileName || file.name);
      formData.append('folder', auth.folder);
      formData.append('publicKey', auth.publicKey);
      formData.append('token', auth.token);
      formData.append('signature', auth.signature);
      formData.append('expire', String(auth.expire));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', auth.uploadEndpoint, true);
      xhr.responseType = 'json';

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        options?.onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.max(0, Math.round((event.loaded / event.total) * 100))),
        });
      };

      xhr.onerror = () => reject(new Error('Network error while uploading attachment'));
      xhr.onabort = () => reject(new Error('Attachment upload was aborted'));

      xhr.onload = () => {
        const responsePayload =
          xhr.response ??
          (() => {
            try {
              return JSON.parse(xhr.responseText) as DirectUploadTransportResponse;
            } catch {
              return undefined;
            }
          })();

        if (xhr.status >= 200 && xhr.status < 300 && responsePayload) {
          resolve(responsePayload);
          return;
        }

        reject(new Error('Failed to upload attachment directly'));
      };

      xhr.send(formData);
    });
  }

  listMessageAttachments(
    roomId: string,
    messageId: string,
  ): Promise<TeamChatMessageAttachmentResponse[]> {
    return this.getByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}/attachments`);
  }

  listRoomAttachments(
    roomId: string,
    params: ListTeamChatRoomAttachmentsParams = {},
  ): Promise<TeamChatRoomAttachmentListResponse | TeamChatRoomAttachmentResponse[]> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/attachments?${queryString}`
        : `/chat-box/rooms/${roomId}/attachments`,
    );
  }

  deleteMessageAttachment(
    roomId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<TeamChatMessageAttachmentResponse> {
    return this.deleteByChatApi(
      `/chat-box/rooms/${roomId}/messages/${messageId}/attachments/${attachmentId}`,
    );
  }

  updateReadState(
    roomId: string,
    body: UpdateTeamChatReadStateBody,
  ): Promise<TeamChatReadStateResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/read-state`, body);
  }

  upsertCurrentDraft(
    roomId: string,
    body: UpdateTeamChatCurrentDraftBody,
  ): Promise<TeamChatCurrentDraftSaveResponse> {
    return this.putByChatApi(`/chat-box/rooms/${roomId}/drafts/current`, body);
  }

  getCurrentDraft(
    roomId: string,
    params: GetTeamChatCurrentDraftParams = {},
  ): Promise<TeamChatDraftResponse | null> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString
        ? `/chat-box/rooms/${roomId}/drafts/current?${queryString}`
        : `/chat-box/rooms/${roomId}/drafts/current`,
      TEAM_CHAT_LIVE_FETCH_OPTIONS,
    );
  }

  listDrafts(
    params: ListTeamChatDraftsParams = {},
  ): Promise<TeamChatDraftListResponse> {
    const queryString = buildQueryString({
      ...params,
      limit: sanitizeDraftsLimit(params.limit),
    });
    return this.getByChatApi(
      queryString ? `/chat-box/drafts?${queryString}` : '/chat-box/drafts',
      TEAM_CHAT_LIVE_FETCH_OPTIONS,
    );
  }

  deleteDraft(draftId: string): Promise<TeamChatDeleteDraftResponse> {
    return this.deleteByChatApi(`/chat-box/drafts/${draftId}`);
  }

  createScheduledMessage(
    roomId: string,
    body: CreateTeamChatScheduledMessageBody,
  ): Promise<TeamChatScheduledMessageResponse> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/scheduled-messages`, body);
  }

  listScheduledMessages(
    params: ListTeamChatScheduledMessagesParams = {},
  ): Promise<TeamChatScheduledMessageListResponse> {
    const queryString = buildQueryString({
      ...params,
      limit: sanitizeDraftsLimit(params.limit),
    });
    return this.getByChatApi(
      queryString
        ? `/chat-box/scheduled-messages?${queryString}`
        : '/chat-box/scheduled-messages',
      TEAM_CHAT_LIVE_FETCH_OPTIONS,
    );
  }

  updateScheduledMessage(
    scheduledMessageId: string,
    body: UpdateTeamChatScheduledMessageBody,
  ): Promise<TeamChatScheduledMessageResponse> {
    return this.putByChatApi(`/chat-box/scheduled-messages/${scheduledMessageId}`, body);
  }

  cancelScheduledMessageToDraft(
    scheduledMessageId: string,
  ): Promise<TeamChatCancelScheduledMessageToDraftResponse> {
    return this.putByChatApi(`/chat-box/scheduled-messages/${scheduledMessageId}/cancel-to-draft`);
  }

  sendScheduledMessageNow(
    scheduledMessageId: string,
  ): Promise<TeamChatSendScheduledMessageNowResponse> {
    return this.putByChatApi(`/chat-box/scheduled-messages/${scheduledMessageId}/send-now`);
  }

  deleteScheduledMessage(
    scheduledMessageId: string,
  ): Promise<TeamChatDeleteScheduledMessageResponse> {
    return this.deleteByChatApi(`/chat-box/scheduled-messages/${scheduledMessageId}`);
  }

  getUnreadSummary(): Promise<TeamChatUnreadSummaryResponse> {
    return this.getByChatApi('/chat-box/read-states/unread-counts');
  }

  addReaction(
    roomId: string,
    messageId: string,
    body: AddTeamChatReactionBody,
  ): Promise<TeamChatUpdateMessageReactionResponse> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}/reactions`, body);
  }

  removeReaction(
    roomId: string,
    messageId: string,
    emoji: string,
  ): Promise<TeamChatUpdateMessageReactionResponse> {
    const queryString = buildQueryString({ emoji });
    return this.deleteByChatApi(
      `/chat-box/rooms/${roomId}/messages/${messageId}/reactions${
        queryString ? `?${queryString}` : ''
      }`,
    );
  }

  listReactions(
    roomId: string,
    messageId: string,
  ): Promise<TeamChatMessageReactionSummaryResponse[]> {
    return this.getByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}/reactions`);
  }

  listReactionsByMessageIds(
    roomId: string,
    messageIds: string[],
  ): Promise<TeamChatMessageReactionBatchItemResponse[]> {
    const query = new URLSearchParams();

    Array.from(
      new Set(
        messageIds
          .map((messageId) => messageId.trim())
          .filter((messageId) => messageId.length > 0),
      ),
    )
      .slice(0, 100)
      .forEach((messageId) => {
        query.append('messageIds', messageId);
      });

    return this.getByChatApi(`/chat-box/rooms/${roomId}/messages/reactions?${query.toString()}`);
  }

  pinMessage(roomId: string, messageId: string): Promise<TeamChatToggleMessagePinResponse> {
    return this.postByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}/pin`);
  }

  unpinMessage(roomId: string, messageId: string): Promise<TeamChatToggleMessagePinResponse> {
    return this.deleteByChatApi(`/chat-box/rooms/${roomId}/messages/${messageId}/pin`);
  }

  listPinnedMessages(roomId: string): Promise<TeamChatPinnedMessageResponse[]> {
    return this.getByChatApi(`/chat-box/rooms/${roomId}/pins`);
  }

  updateMyPresence(body: UpdateTeamChatPresenceBody): Promise<TeamChatPresenceResponse> {
    return this.putByChatApi('/chat-box/presence/me', body);
  }

  listPresence(): Promise<TeamChatPresenceResponse[]> {
    return this.getByChatApi('/chat-box/presence');
  }

  listMyMentions(params: ListTeamChatMentionsParams = {}): Promise<TeamChatMentionResponse[]> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString ? `/chat-box/mentions/me?${queryString}` : '/chat-box/mentions/me',
    );
  }

  markMentionRead(mentionId: string): Promise<TeamChatUpdateMentionReadResponse> {
    return this.putByChatApi(`/chat-box/mentions/${mentionId}/read`);
  }

  markMyMentionsReadAll(
    body: MarkAllTeamChatMentionsReadBody = {},
  ): Promise<TeamChatMarkMyMentionsReadResponse> {
    return this.putByChatApi('/chat-box/mentions/me/read-all', body);
  }

  markPersonalInboxRoomRead(
    roomId: string,
    body: MarkTeamChatPersonalInboxRoomReadBody = {},
  ): Promise<TeamChatPersonalInboxRoomReadResponse> {
    return this.putByChatApi(`/chat-box/personal-inbox/rooms/${roomId}/read`, body);
  }

  listNotifications(
    params: ListTeamChatNotificationsParams = {},
  ): Promise<TeamChatNotificationsListResponse> {
    const queryString = buildQueryString(params);
    return this.getByChatApi(
      queryString ? `/notifications?${queryString}` : '/notifications',
    );
  }

  markNotificationRead(notificationId: string): Promise<void> {
    return this.putByChatApi(`/notifications/${notificationId}/read`);
  }

  markNotificationsReadAll(
    body: MarkAllTeamChatNotificationsReadBody = {},
  ): Promise<TeamChatMarkNotificationsReadAllResponse> {
    return this.putByChatApi('/notifications/read-all', body);
  }
}

