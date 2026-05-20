import {
  parseChatMode,
} from '../constants/chat-mode';
import {
  parseChatToolset,
} from '../constants/chat-toolset';
import type {
  ChatAssistantConfig,
  ChatContextScope,
  ChatMode,
  ChatSearchMode,
  ChatToolset,
  ConversationDto,
  CreateConversationBody,
  SendMessageBody,
  UpdateConversationBody,
} from '../types';

export type ExternalToolMode = 'web_search';

export interface ChatSearchConfigState {
  mode: ChatMode;
  toolset: ChatToolset;
  searchMode: ChatSearchMode;
  scope: ChatContextScope;
  scopeId: string;
  strictScope: boolean;
  includeSubfolders: boolean;
  preferOwner: boolean;
  includeSharedDocs: boolean;
  timeRange: '7d' | '30d' | 'all';
  category: string;
  fileType: string;
  documentIds: string[];
  internalEnabled: boolean;
  externalEnabled: boolean;
  externalMode: ExternalToolMode;
}

export const CHAT_INTERNAL_QUERY_PARAM = 'internalTool';
export const CHAT_EXTERNAL_QUERY_PARAM = 'externalTool';
export const CHAT_EXTERNAL_MODE_QUERY_PARAM = 'externalMode';

const SCOPE_REQUIRES_ID: ChatContextScope[] = ['project', 'folder', 'document'];

export function modeToSearchMode(mode: ChatMode): ChatSearchMode {
  if (mode === 'rag') return 'rag_internal';
  if (mode === 'auto') return 'hybrid';
  if (mode === 'web') return 'web_only';
  return 'hybrid';
}

export function parseBooleanParam(value: string | null, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function deriveAssistantConfigFromLegacy(
  mode: ChatMode,
  toolset: ChatToolset,
): ChatAssistantConfig {
  return {
    internal_enabled: toolset !== 'none' || mode === 'rag' || mode === 'auto',
    external_enabled: mode === 'web' || mode === 'auto',
    external_mode: 'web_search',
  };
}

function normalizeAssistantConfig(
  raw: ChatAssistantConfig | null | undefined,
  mode: ChatMode,
  toolset: ChatToolset,
): ChatAssistantConfig {
  const fallback = deriveAssistantConfigFromLegacy(mode, toolset);
  if (!raw) return fallback;

  return {
    internal_enabled:
      typeof raw.internal_enabled === 'boolean'
        ? raw.internal_enabled
        : fallback.internal_enabled,
    external_enabled:
      typeof raw.external_enabled === 'boolean'
        ? raw.external_enabled
        : fallback.external_enabled,
    external_mode: raw.external_mode === 'web_search' ? 'web_search' : 'web_search',
  };
}

export function readSearchConfigFromParams(
  searchParams: URLSearchParams,
  fallbackMode: ChatMode,
  fallbackToolset: ChatToolset,
): ChatSearchConfigState {
  const mode = parseChatMode(searchParams.get('mode')) ?? fallbackMode;
  const toolset = parseChatToolset(searchParams.get('toolset')) ?? fallbackToolset;

  const rawScope = searchParams.get('scope');
  const scope: ChatContextScope =
    rawScope === 'organization' ||
    rawScope === 'project' ||
    rawScope === 'my_docs' ||
    rawScope === 'folder' ||
    rawScope === 'document' ||
    rawScope === 'custom_docs'
      ? rawScope
      : 'organization';

  const legacyAssistantConfig = deriveAssistantConfigFromLegacy(mode, toolset);
  const internalEnabled = parseBooleanParam(
    searchParams.get(CHAT_INTERNAL_QUERY_PARAM),
    legacyAssistantConfig.internal_enabled,
  );
  const externalEnabled = parseBooleanParam(
    searchParams.get(CHAT_EXTERNAL_QUERY_PARAM),
    legacyAssistantConfig.external_enabled,
  );
  const externalMode =
    searchParams.get(CHAT_EXTERNAL_MODE_QUERY_PARAM) === 'web_search'
      ? 'web_search'
      : 'web_search';

  return {
    mode,
    toolset,
    searchMode: modeToSearchMode(mode),
    scope,
    scopeId: searchParams.get('scopeId') ?? '',
    strictScope: parseBooleanParam(searchParams.get('strictScope'), false),
    includeSubfolders: parseBooleanParam(searchParams.get('includeSubfolders'), false),
    preferOwner: parseBooleanParam(searchParams.get('preferOwner'), true),
    includeSharedDocs: parseBooleanParam(searchParams.get('includeSharedDocs'), false),
    timeRange:
      searchParams.get('timeRange') === '7d' || searchParams.get('timeRange') === '30d'
        ? (searchParams.get('timeRange') as '7d' | '30d')
        : 'all',
    category: searchParams.get('category') ?? '',
    fileType: searchParams.get('fileType') ?? '',
    documentIds: (searchParams.get('documentIds') ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    internalEnabled,
    externalEnabled,
    externalMode,
  };
}

export function deriveLegacyConfigFromCapabilities(
  config: ChatSearchConfigState,
): ChatSearchConfigState {
  const next = { ...config };

  if (!next.internalEnabled && !next.externalEnabled) {
    next.mode = 'general';
    next.toolset = 'none';
    next.searchMode = modeToSearchMode(next.mode);
    return next;
  }

  if (!next.internalEnabled && next.externalEnabled) {
    next.mode = 'web';
    next.toolset = 'none';
    next.searchMode = modeToSearchMode(next.mode);
    return next;
  }

  if (next.internalEnabled && !next.externalEnabled) {
    if (next.toolset !== 'none') {
      next.mode = 'general';
    } else {
      next.mode = 'rag';
    }
    next.searchMode = modeToSearchMode(next.mode);
    return next;
  }

  // Both internal and external are enabled.
  next.mode = 'auto';
  next.searchMode = modeToSearchMode(next.mode);
  return next;
}

export function applyConfigToParams(
  params: URLSearchParams,
  rawConfig: ChatSearchConfigState,
): void {
  const config = deriveLegacyConfigFromCapabilities(rawConfig);

  params.set('mode', config.mode);
  params.set('toolset', config.toolset);
  params.set('searchMode', config.searchMode);
  params.set('scope', config.scope);
  params.set(CHAT_INTERNAL_QUERY_PARAM, String(config.internalEnabled));
  params.set(CHAT_EXTERNAL_QUERY_PARAM, String(config.externalEnabled));
  params.set(CHAT_EXTERNAL_MODE_QUERY_PARAM, config.externalMode);

  if (SCOPE_REQUIRES_ID.includes(config.scope) && config.scopeId.trim()) {
    params.set('scopeId', config.scopeId.trim());
  } else {
    params.delete('scopeId');
  }

  if (config.scope === 'custom_docs' && config.documentIds.length > 0) {
    params.set('documentIds', config.documentIds.join(','));
  } else {
    params.delete('documentIds');
  }

  if (config.searchMode !== 'web_only') {
    params.set('strictScope', String(config.strictScope));
  } else {
    params.delete('strictScope');
  }

  if (config.scope === 'folder' && config.searchMode !== 'web_only') {
    params.set('includeSubfolders', String(config.includeSubfolders));
  } else {
    params.delete('includeSubfolders');
  }

  if (config.scope === 'my_docs' && config.searchMode !== 'web_only') {
    params.set('preferOwner', String(config.preferOwner));
    params.set('includeSharedDocs', String(config.includeSharedDocs));
    params.set('timeRange', config.timeRange);
  } else {
    params.delete('preferOwner');
    params.delete('includeSharedDocs');
    params.delete('timeRange');
  }

  if (config.searchMode !== 'web_only' && config.category.trim()) {
    params.set('category', config.category.trim());
  } else {
    params.delete('category');
  }

  if (config.searchMode !== 'web_only' && config.fileType.trim()) {
    params.set('fileType', config.fileType.trim());
  } else {
    params.delete('fileType');
  }
}

export function buildAssistantConfigDto(
  rawConfig: ChatSearchConfigState,
): ChatAssistantConfig {
  const config = deriveLegacyConfigFromCapabilities(rawConfig);
  return {
    internal_enabled: config.internalEnabled,
    external_enabled: config.externalEnabled,
    external_mode: config.externalMode,
  };
}

export function toConversationRequestConfig(
  rawConfig: ChatSearchConfigState,
): Pick<
  CreateConversationBody,
  'mode' | 'toolset' | 'search_mode' | 'context_scope' | 'context_id' | 'context_options' | 'assistant_config'
> {
  const config = deriveLegacyConfigFromCapabilities(rawConfig);
  return {
    mode: config.mode,
    toolset: config.toolset,
    search_mode: config.searchMode,
    context_scope: config.scope,
    context_id: SCOPE_REQUIRES_ID.includes(config.scope) ? config.scopeId || undefined : undefined,
    context_options: {
      strict_scope: config.strictScope,
      include_subfolders: config.includeSubfolders,
      prefer_owner: config.preferOwner,
      include_shared_docs: config.includeSharedDocs,
      time_range: config.timeRange,
      category: config.category || undefined,
      file_type: config.fileType || undefined,
      document_ids: config.documentIds,
    },
    assistant_config: buildAssistantConfigDto(config),
  };
}

export function toSendMessageConfig(
  rawConfig: ChatSearchConfigState,
): Pick<
  SendMessageBody,
  'mode' | 'toolset' | 'context_scope' | 'context_id' | 'context_options' | 'assistant_config'
> {
  const config = toConversationRequestConfig(rawConfig);
  return {
    mode: config.mode,
    toolset: config.toolset,
    context_scope: config.context_scope,
    context_id: config.context_id,
    context_options: config.context_options,
    assistant_config: config.assistant_config,
  };
}

export function toUpdateConversationConfig(
  rawConfig: ChatSearchConfigState,
): Pick<
  UpdateConversationBody,
  'mode' | 'toolset' | 'search_mode' | 'context_scope' | 'context_id' | 'context_options' | 'assistant_config'
> {
  return toConversationRequestConfig(rawConfig);
}

export function configFromConversation(
  conversation: ConversationDto,
): ChatSearchConfigState {
  const assistantConfig = normalizeAssistantConfig(
    conversation.assistant_config,
    conversation.mode,
    conversation.toolset,
  );

  return {
    mode: conversation.mode,
    toolset: conversation.toolset,
    searchMode: conversation.search_mode ?? modeToSearchMode(conversation.mode),
    scope: conversation.context_scope,
    scopeId: conversation.context_id ?? '',
    strictScope: Boolean(conversation.context_options?.strict_scope),
    includeSubfolders: Boolean(conversation.context_options?.include_subfolders),
    preferOwner:
      conversation.context_options?.prefer_owner === undefined
        ? true
        : Boolean(conversation.context_options?.prefer_owner),
    includeSharedDocs: Boolean(conversation.context_options?.include_shared_docs),
    timeRange: conversation.context_options?.time_range ?? 'all',
    category: conversation.context_options?.category ?? '',
    fileType: conversation.context_options?.file_type ?? '',
    documentIds: conversation.context_options?.document_ids ?? [],
    internalEnabled: assistantConfig.internal_enabled,
    externalEnabled: assistantConfig.external_enabled,
    externalMode: assistantConfig.external_mode === 'web_search' ? 'web_search' : 'web_search',
  };
}

export function areConfigsEquivalent(
  left: ChatSearchConfigState,
  right: ChatSearchConfigState,
): boolean {
  const normalize = (config: ChatSearchConfigState) => JSON.stringify({
    ...deriveLegacyConfigFromCapabilities(config),
    scopeId: config.scopeId || '',
    category: config.category || '',
    fileType: config.fileType || '',
    documentIds: [...config.documentIds].sort(),
  });

  return normalize(left) === normalize(right);
}
