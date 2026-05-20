'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useModelOptions,
  useMyQuota,
  chatbotKeys,
} from '../query/use-chatbot';
import { useChatStream, buildStreamingMessage } from './use-chat-stream';
import type {
  AIModelOptionDto,
  ChatMode,
  ChatToolset,
  ConversationDto,
  SendMessageBody,
  UiMessage,
} from '../types';
import { ChatbotService } from '../services/chatbot.service';
import { useServiceContext } from '@/lib/use-service-context';
import { toast } from '@/lib/toast';
import { useCan } from '@/features/tenant/access-control/hooks/use-can';
import { PERMISSIONS } from '@/features/tenant/access-control/permissions';
import { useAppSelector } from '@/store';
import {
  applyConfigToParams,
  areConfigsEquivalent,
  configFromConversation,
  readSearchConfigFromParams,
  toConversationRequestConfig,
  toSendMessageConfig,
  toUpdateConversationConfig,
  type ChatSearchConfigState,
} from '../utils/chat-config';

interface UseChatbotPageOptions {
  conversationId: string | null;
  onNavigate: (id: string | null) => void;
  mode: ChatMode;
  toolset: ChatToolset;
  preferredModelId: string | null;
  onPreferredModelIdChange: (modelId: string | null) => void;
}

function buildUserMessage(content: string): UiMessage {
  return {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    citations: [],
    web_sources: [],
    created_at: new Date().toISOString(),
  };
}

export function useChatbotPage({
  conversationId,
  onNavigate,
  mode,
  toolset,
  preferredModelId,
  onPreferredModelIdChange,
}: UseChatbotPageOptions) {
  const t = useTranslations('chatbot');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ctx = useServiceContext();
  const qc = useQueryClient();
  const canUseChatbot = useCan(PERMISSIONS.CHATBOT_USE);
  const rbacPermissionsLoaded = useAppSelector(
    (state) => state.user.rbacPermissionsLoaded,
  );

  const convQuery = useConversations();
  const quotaQuery = useMyQuota(rbacPermissionsLoaded && canUseChatbot);
  const modelOptionsQuery = useModelOptions(rbacPermissionsLoaded && canUseChatbot);

  const conversations: ConversationDto[] = useMemo(
    () => convQuery.data ?? [],
    [convQuery.data],
  );

  const isConvListPending = convQuery.isPending;
  const isConvListFetching = Boolean(
    (convQuery.raw as { isFetching?: boolean } | undefined)?.isFetching,
  );
  const isConvListError = convQuery.isError;

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const { isStreaming, error: streamError, stream, abort } = useChatStream();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [busyPendingActionId, setBusyPendingActionId] = useState<string | null>(null);
  const draftConversationIdRef = useRef<string | null>(null);

  const modelOptions: AIModelOptionDto[] = useMemo(
    () => modelOptionsQuery.data ?? [],
    [modelOptionsQuery.data],
  );

  // ── Typewriter queue ───────────────────────────────────────────────────
  // Pending characters from the SSE stream that haven't been revealed yet.
  const typeQueueRef = useRef('');
  const typingIdRef = useRef<string | null>(null);

  const ctxRef = useRef(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  });

  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => {
      if (!typeQueueRef.current) return;
      const batch = Math.max(1, Math.min(4, Math.ceil(typeQueueRef.current.length / 8)));
      const reveal = typeQueueRef.current.slice(0, batch);
      typeQueueRef.current = typeQueueRef.current.slice(batch);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === typingIdRef.current
            ? { ...message, content: message.content + reveal }
            : message,
        ),
      );
    }, 18);
    return () => clearInterval(id);
  }, [isStreaming]);

  const activeConversation = useMemo(
    () =>
      conversationId == null
        ? null
        : conversations.find((conversation) => conversation.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  const inList = useMemo(
    () =>
      conversationId == null
        ? false
        : conversations.some((conversation) => conversation.id === conversationId),
    [conversations, conversationId],
  );

  const historyLoading =
    conversationId != null &&
    (isConvListPending || (isConvListFetching && !inList) || isFetchingMessages);

  const selectedModelId = useMemo(() => {
    if (modelOptions.length === 0) return null;
    if (
      preferredModelId &&
      modelOptions.some((option) => option.id === preferredModelId)
    ) {
      return preferredModelId;
    }
    return modelOptions[0].id;
  }, [modelOptions, preferredModelId]);

  const setSelectedModelId = useCallback(
    (modelId: string | null) => {
      onPreferredModelIdChange(modelId);
    },
    [onPreferredModelIdChange],
  );

  const currentSearchConfig = useMemo(
    () =>
      readSearchConfigFromParams(
        new URLSearchParams(searchParams.toString()),
        mode,
        toolset,
      ),
    [mode, searchParams, toolset],
  );

  const hydratedConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeConversation) return;

    const serverConfig = configFromConversation(activeConversation);
    if (hydratedConversationIdRef.current === activeConversation.id) return;
    hydratedConversationIdRef.current = activeConversation.id;

    if (areConfigsEquivalent(currentSearchConfig, serverConfig)) return;

    const params = new URLSearchParams(searchParams.toString());
    applyConfigToParams(params, serverConfig);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [
    activeConversation,
    currentSearchConfig,
    pathname,
    router,
    searchParams,
  ]);

  // Fetch messages only when the conversation is confirmed in GET /conversations.
  // All setState calls are inside an async IIFE to avoid synchronous setState in effect body.
  useEffect(() => {
    if (!conversationId) return;
    if (isConvListPending || isConvListFetching) return;

    let cancelled = false;

    void (async () => {
      if (!inList && !isConvListError) {
        if (!cancelled) setMessages([]);
        return;
      }

      if (!cancelled) setIsFetchingMessages(true);
      try {
        const loadedMessages = await new ChatbotService(ctxRef.current).getAllMessages(
          conversationId,
        );
        if (!cancelled) {
          const pendingActions = await new ChatbotService(ctxRef.current)
            .listPendingActions(conversationId, 'pending')
            .catch(() => []);
          setMessages(
            [
              ...loadedMessages.map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
                citations: message.citations,
                web_sources: message.web_sources,
                created_at: message.created_at,
              })),
              ...pendingActions.map((action) => ({
                id: `pending-${action.id}`,
                role: 'assistant' as const,
                content: action.preview,
                citations: [],
                web_sources: [],
                pending_action: {
                  action_id: action.id,
                  preview: action.preview,
                  tool_name: action.tool_name,
                  status: action.status,
                  error: action.error,
                },
                created_at: action.created_at,
              })),
            ],
          );
        }
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setIsFetchingMessages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, inList, isConvListPending, isConvListFetching, isConvListError]);

  const handleNewChat = useCallback(() => {
    abort();
    draftConversationIdRef.current = null;
    typeQueueRef.current = '';
    typingIdRef.current = null;
    setSuggestions([]);
    setBusyPendingActionId(null);
    setMessages([]);

    if (conversationId != null) {
      onNavigate(null);
    }
  }, [abort, conversationId, onNavigate]);

  const handleSelectConversation = useCallback(
    (conversation: ConversationDto) => onNavigate(conversation.id),
    [onNavigate],
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      const result = await deleteConversation.mutateAsync(id);
      if (!result.ok) return;

      if (id === draftConversationIdRef.current) {
        draftConversationIdRef.current = null;
        setSuggestions([]);
        setMessages([]);
      }
      if (id === conversationId) {
        onNavigate(null);
      }
    },
    [conversationId, deleteConversation, onNavigate],
  );

  const handleConversationConfigChange = useCallback(
    async (config: ChatSearchConfigState) => {
      const targetConversationId = conversationId ?? draftConversationIdRef.current;
      if (!targetConversationId) return;

      await new ChatbotService(ctxRef.current)
        .updateConversation(targetConversationId, toUpdateConversationConfig(config))
        .then(() =>
          qc.invalidateQueries({
            queryKey: chatbotKeys.conversations(ctx.tenantId),
          }),
        )
        .catch(() => null);
    },
    [conversationId, ctx.tenantId, qc],
  );

  const updatePendingActionStatus = useCallback(
    (
      actionId: string,
      status: NonNullable<UiMessage['pending_action']>['status'],
    ) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.pending_action?.action_id === actionId
            ? {
                ...message,
                pending_action: {
                  ...message.pending_action,
                  status,
                },
              }
            : message,
        ),
      );
    },
    [],
  );

  const finalizeStreamSuccess = useCallback(
    (
      placeholderId: string,
      done: {
        message_id: string;
        citations: UiMessage['citations'];
        web_sources: UiMessage['web_sources'];
      },
    ) => {
      const remaining = typeQueueRef.current;
      typeQueueRef.current = '';
      typingIdRef.current = null;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId
            ? {
                ...message,
                id: done.message_id,
                content: message.content + remaining,
                citations: done.citations,
                web_sources: done.web_sources,
                isStreaming: false,
              }
            : message,
        ),
      );
    },
    [],
  );

  const finalizeStreamError = useCallback(
    (placeholderId: string, err: string) => {
      const remaining = typeQueueRef.current;
      typeQueueRef.current = '';
      typingIdRef.current = null;
      if (err === '__aborted__') {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === placeholderId
              ? {
                  ...message,
                  content: message.content + remaining,
                  isStreaming: false,
                }
              : message,
          ),
        );
        return;
      }

      toast.danger(t('errors.responseFailedTitle'), err);
      setMessages((prev) =>
        prev.map((message) =>
          message.id === placeholderId
            ? {
                ...message,
                content: `⚠ ${err}`,
                isStreaming: false,
                citations: [],
                web_sources: [],
              }
            : message,
        ),
      );
    },
    [t],
  );

  const handleStream = useCallback(
    async (
      targetConversationId: string,
      body: SendMessageBody,
      placeholderId: string,
      {
        onDone,
        onConfirmRequired,
        onError,
      }: {
        onDone?: (messageId: string) => void;
        onConfirmRequired?: (actionId: string) => void;
        onError?: (err: string) => void;
      } = {},
    ) => {
      await stream(targetConversationId, body, {
        onChunk: (chunk) => {
          typeQueueRef.current += chunk;
        },
        onDone: (done) => {
          finalizeStreamSuccess(placeholderId, done);
          onDone?.(done.message_id);
        },
        onConfirmRequired: (event) => {
          typeQueueRef.current = '';
          typingIdRef.current = null;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === placeholderId
                ? {
                    ...message,
                    id: `pending-${event.action_id}`,
                    content: t('messageList.pendingAction.requiresConfirmation'),
                    citations: [],
                    web_sources: [],
                    isStreaming: false,
                    pending_action: {
                      action_id: event.action_id,
                      preview: event.preview,
                      tool_name: event.tool_name,
                      status: 'pending',
                    },
                  }
                : message,
            ),
          );
          onConfirmRequired?.(event.action_id);
        },
        onToolCall: (event) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === placeholderId
                ? {
                    ...message,
                    content: `${message.content}${message.content ? '\n' : ''}${event.content}`,
                  }
                : message,
            ),
          );
        },
        onToolResult: (event) => {
          const status = event.data?.success === false ? 'failed' : 'completed';
          const tool = event.data?.tool ?? 'tool';
          setMessages((prev) =>
            prev.map((message) =>
              message.id === placeholderId
                ? {
                    ...message,
                    content: `${message.content}${message.content ? '\n' : ''}${tool}: ${status}`,
                  }
                : message,
            ),
          );
        },
        onError: (err) => {
          finalizeStreamError(placeholderId, err);
          onError?.(err);
        },
        onSuggestions: (questions) => setSuggestions(questions),
      });
    },
    [
      finalizeStreamError,
      finalizeStreamSuccess,
      stream,
      t,
    ],
  );

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const trimmedContent = content.trim();
      const userMsg = buildUserMessage(trimmedContent);
      const placeholderId = `streaming-${Date.now()}`;
      const shouldPromoteDraftConversation = conversationId == null;
      let shouldNavigateAfterStream = false;
      let targetConversationId = conversationId ?? draftConversationIdRef.current;

      typeQueueRef.current = '';
      typingIdRef.current = placeholderId;
      setSuggestions([]);
      setMessages((prev) => [...prev, userMsg, buildStreamingMessage(placeholderId)]);

      if (!targetConversationId) {
        const createResult = await createConversation.mutateAsync({
          ...toConversationRequestConfig(currentSearchConfig),
          title: trimmedContent.slice(0, 80),
        });

        if (!createResult.ok) {
          typeQueueRef.current = '';
          typingIdRef.current = null;
          setMessages((prev) =>
            prev.filter(
              (message) =>
                message.id !== userMsg.id && message.id !== placeholderId,
            ),
          );
          toast.danger(
            t('errors.responseFailedTitle'),
            createResult.error.message || t('errors.unknownServer'),
          );
          return;
        }

        targetConversationId = createResult.data.id;
        draftConversationIdRef.current = createResult.data.id;
      }

      // For GENERAL mode, send bounded history inline to skip DB round-trip on BE
      const isPlainGeneral =
        !currentSearchConfig.internalEnabled && !currentSearchConfig.externalEnabled;
      const inlineHistory =
        isPlainGeneral
          ? messages
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .slice(-10) // last 5 turns (10 messages)
              .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
          : undefined;

      await handleStream(
        targetConversationId,
        {
          content: trimmedContent,
          ...toSendMessageConfig(currentSearchConfig),
          ...(selectedModelId ? { model_config_id: selectedModelId } : {}),
          ...(inlineHistory !== undefined ? { inline_history: inlineHistory } : {}),
        },
        placeholderId,
        {
          onDone: () => {
            if (shouldPromoteDraftConversation) {
              shouldNavigateAfterStream = true;
            }
            void qc.invalidateQueries({ queryKey: chatbotKeys.quota(ctx.tenantId) });
            void qc.invalidateQueries({
              queryKey: chatbotKeys.conversations(ctx.tenantId),
            });
          },
          onConfirmRequired: () => {
            if (shouldPromoteDraftConversation) {
              shouldNavigateAfterStream = true;
            }
          },
        },
      );

      if (
        shouldPromoteDraftConversation &&
        shouldNavigateAfterStream &&
        draftConversationIdRef.current
      ) {
        onNavigate(draftConversationIdRef.current);
      }
    },
    [
      conversationId,
      createConversation,
      handleStream,
      isStreaming,
      messages,
      qc,
      selectedModelId,
      ctx.tenantId,
      currentSearchConfig,
      onNavigate,
      t,
    ],
  );

  const handleConfirmPendingAction = useCallback(
    async (actionId: string) => {
      if (isStreaming || busyPendingActionId) return;

      const targetConversationId = conversationId ?? draftConversationIdRef.current;
      if (!targetConversationId) return;

      const confirmationText = t('messageList.pendingAction.confirmationMessage');
      const placeholderId = `streaming-${Date.now()}`;
      const userMsg = buildUserMessage(confirmationText);

      typeQueueRef.current = '';
      typingIdRef.current = placeholderId;
      setSuggestions([]);
      setBusyPendingActionId(actionId);
      updatePendingActionStatus(actionId, 'confirmed');
      setMessages((prev) => [...prev, userMsg, buildStreamingMessage(placeholderId)]);

      try {
        await handleStream(
          targetConversationId,
          {
            content: confirmationText,
            confirmed_action_id: actionId,
            ...toSendMessageConfig(currentSearchConfig),
            ...(selectedModelId ? { model_config_id: selectedModelId } : {}),
          },
          placeholderId,
          {
            onDone: () => {
              updatePendingActionStatus(actionId, 'executed');
              void qc.invalidateQueries({
                queryKey: chatbotKeys.conversations(ctx.tenantId),
              });
              void qc.invalidateQueries({ queryKey: chatbotKeys.quota(ctx.tenantId) });
            },
            onError: (error) => {
              if (error !== '__aborted__') {
                updatePendingActionStatus(actionId, 'failed');
              }
            },
          },
        );
      } finally {
        setBusyPendingActionId(null);
      }
    },
    [
      busyPendingActionId,
      conversationId,
      ctx.tenantId,
      currentSearchConfig,
      handleStream,
      isStreaming,
      qc,
      selectedModelId,
      t,
      updatePendingActionStatus,
    ],
  );

  const handleCancelPendingAction = useCallback(
    async (actionId: string) => {
      if (isStreaming || busyPendingActionId) return;

      const targetConversationId = conversationId ?? draftConversationIdRef.current;
      if (!targetConversationId) return;

      setBusyPendingActionId(actionId);
      try {
        await new ChatbotService(ctxRef.current).cancelPendingAction(
          targetConversationId,
          actionId,
        );
        updatePendingActionStatus(actionId, 'cancelled');
        toast.success(
          t('messageList.pendingAction.cancelledTitle'),
          t('messageList.pendingAction.cancelledDescription'),
        );
      } catch (error) {
        const description =
          error instanceof Error ? error.message : t('errors.unknownServer');
        toast.danger(t('messageList.pendingAction.cancelFailedTitle'), description);
      } finally {
        setBusyPendingActionId(null);
      }
    },
    [
      busyPendingActionId,
      conversationId,
      isStreaming,
      t,
      updatePendingActionStatus,
    ],
  );

  return {
    conversations,
    activeConversation,
    currentSearchConfig,
    handleConversationConfigChange,
    handleSelectConversation,
    handleNewChat,
    handleDeleteConversation,
    messages,
    historyLoading,
    handleSend,
    handleConfirmPendingAction,
    handleCancelPendingAction,
    busyPendingActionId,
    isStreaming,
    streamError,
    abort,
    quota: quotaQuery.data ?? null,
    modelOptions,
    selectedModelId,
    setSelectedModelId,
    suggestions,
  };
}
