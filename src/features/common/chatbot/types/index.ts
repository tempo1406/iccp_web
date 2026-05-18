// ── be_ai API DTOs ─────────────────────────────────────────────────────────

export type ChatMode = 'general' | 'auto' | 'rag' | 'web';
export type ChatSearchMode = 'rag_internal' | 'hybrid' | 'web_only';
export type ChatToolset =
  | 'auto'
  | 'none'
  | 'projects'
  | 'tasks'
  | 'tickets'
  | 'documents'
  | 'organization'
  | 'daily_reports';
export type ChatContextScope =
  | 'organization'
  | 'project'
  | 'my_docs'
  | 'folder'
  | 'document'
  | 'custom_docs';

export interface ChatAssistantConfig {
  internal_enabled: boolean;
  external_enabled: boolean;
  external_mode?: 'web_search';
}

export interface ChatContextOptions {
  strict_scope?: boolean;
  include_subfolders?: boolean;
  prefer_owner?: boolean;
  include_shared_docs?: boolean;
  time_range?: '7d' | '30d' | 'all';
  category?: string;
  file_type?: string;
  document_ids?: string[];
}

export interface ConversationDto {
  id: string;
  organization_id: string;
  user_id: string;
  title: string | null;
  mode: ChatMode;
  toolset: ChatToolset;
  search_mode?: ChatSearchMode | null;
  assistant_config?: ChatAssistantConfig;
  status: string;
  context_scope: ChatContextScope;
  context_id: string | null;
  context_options?: ChatContextOptions;
  created_at: string;
  updated_at: string;
}

export interface CitationDto {
  document_id: string;
  chunk_index: number;
  file_name: string;
  relevance_score: number;
  cited_content: string;
}

export interface WebSourceDto {
  title: string;
  url: string;
  snippet: string;
}

export interface MessageDto {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: string | null;
  intent: string | null;
  citations: CitationDto[];
  web_sources: WebSourceDto[];
  tokens_used: number | null;
  documents_retrieved: number | null;
  response_time_ms: number | null;
  created_at: string;
}

export interface ConversationHistoryDto {
  conversation_id: string;
  messages: MessageDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateConversationBody {
  title?: string;
  mode: ChatMode;
  toolset?: ChatToolset;
  search_mode?: ChatSearchMode;
  assistant_config?: ChatAssistantConfig;
  context_scope?: ChatContextScope;
  context_id?: string;
  context_options?: ChatContextOptions;
}

export interface UpdateConversationBody {
  title?: string;
  mode?: ChatMode;
  toolset?: ChatToolset;
  search_mode?: ChatSearchMode;
  assistant_config?: ChatAssistantConfig;
  context_scope?: ChatContextScope;
  context_id?: string | null;
  context_options?: ChatContextOptions;
}

export interface InlineHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendMessageBody {
  content: string;
  mode?: ChatMode;
  toolset?: ChatToolset;
  assistant_config?: ChatAssistantConfig;
  model_config_id?: string;
  confirmed_action_id?: string;
  context_scope?: ChatContextScope;
  context_id?: string;
  context_options?: ChatContextOptions;
  /** Bounded recent history sent from FE (GENERAL mode only) to skip BE DB fetch */
  inline_history?: InlineHistoryMessage[];
}

export interface AIModelOptionDto {
  id: string;
  name: string;
}

// ── SSE stream event types ─────────────────────────────────────────────────

export type SseTokenEvent = {
  type: 'token';
  content: string;
};

export type SseDoneEvent = {
  type: 'done';
  message_id: string;
  citations: CitationDto[];
  web_sources: WebSourceDto[];
  response_time_ms: number;
  tokens_used?: number;
  grounded?: boolean;
  abstained?: boolean;
  evidence_status?: string;
};

// ── Quota DTOs ─────────────────────────────────────────────────────────────

export interface UserQuotaDto {
  user_id: string;
  organization_id: string;
  daily_message_limit: number;
  daily_messages_used: number;
  daily_token_limit: number;
  daily_tokens_used: number;
  daily_tokens_remaining: number;
  reset_at: string;
}

export interface OrgQuotaDto {
  organization_id: string;
  monthly_message_limit: number;
  monthly_messages_used: number;
  token_limit: number;
  tokens_used: number;
  tokens_remaining: number;
  monthly_tokens_used?: number;
  monthly_token_limit?: number;
  monthly_tokens_remaining?: number;
  monthly_ingestion_limit: number;
  monthly_ingestions_used: number;
  reset_at: string;
}

export interface QuotaMeDto {
  user: UserQuotaDto;
  organization: OrgQuotaDto;
}

export type SseErrorEvent = {
  type: 'error';
  error: string;
};

export type SseSuggestionsEvent = {
  type: 'suggestions';
  questions: string[];
};

export type SseToolCallEvent = {
  type: 'tool_call';
  content: string;
  tool_name?: string;
};

export type SseToolResultEvent = {
  type: 'tool_result';
  data: {
    success?: boolean;
    tool?: string;
    data?: unknown;
    error?: string;
  };
};

export type SseConfirmRequiredEvent = {
  type: 'confirm_required';
  action_id: string;
  preview: string;
  tool_name: string;
  expires_at?: string;
};

export type SseEvent =
  | SseTokenEvent
  | SseDoneEvent
  | SseErrorEvent
  | SseSuggestionsEvent
  | SseToolCallEvent
  | SseToolResultEvent
  | SseConfirmRequiredEvent;

// ── UI-layer types ─────────────────────────────────────────────────────────

export type PendingActionUiStatus =
  | 'pending'
  | 'confirmed'
  | 'executed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export interface PendingActionUi {
  action_id: string;
  preview: string;
  tool_name: string;
  status: PendingActionUiStatus;
  error?: string | null;
}

export interface PendingActionDto {
  id: string;
  conversation_id: string;
  tool_name: string;
  preview: string;
  status: PendingActionUiStatus;
  error?: string | null;
  created_at: string;
  expires_at: string;
}

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: CitationDto[];
  web_sources: WebSourceDto[];
  pending_action?: PendingActionUi;
  isStreaming?: boolean;
  created_at: string;
}
