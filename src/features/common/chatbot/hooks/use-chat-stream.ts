'use client';
import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useServiceContext } from '@/lib/use-service-context';
import { ChatbotService } from '../services/chatbot.service';
import type {
  CitationDto,
  SendMessageBody,
  SseConfirmRequiredEvent,
  SseDoneEvent,
  SseToolCallEvent,
  SseToolResultEvent,
  UiMessage,
  WebSourceDto,
} from '../types';

interface StreamState {
  isStreaming: boolean;
  error: string | null;
}

interface StreamCallbacks {
  onChunk: (partial: string) => void;
  onDone: (done: SseDoneEvent) => void;
  onError: (err: string) => void;
  onSuggestions?: (questions: string[]) => void;
  onConfirmRequired?: (event: SseConfirmRequiredEvent) => void;
  onToolCall?: (event: SseToolCallEvent) => void;
  onToolResult?: (event: SseToolResultEvent) => void;
}

interface UseChatStreamReturn extends StreamState {
  stream: (
    conversationId: string,
    body: SendMessageBody,
    callbacks: StreamCallbacks,
  ) => Promise<void>;
  abort: () => void;
}

export function useChatStream(): UseChatStreamReturn {
  const ctx = useServiceContext();
  const t = useTranslations('chatbot');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const stream = useCallback(
    async (
      conversationId: string,
      body: SendMessageBody,
      callbacks: StreamCallbacks,
    ) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setError(null);

      const service = new ChatbotService(ctx);

      try {
        for await (const event of service.sendMessageStream(
          conversationId,
          body,
          controller.signal,
        )) {
          if (controller.signal.aborted) break;

          if (event.type === 'token') {
            callbacks.onChunk(event.content);
          } else if (event.type === 'done') {
            callbacks.onDone(event);
          } else if (event.type === 'suggestions') {
            callbacks.onSuggestions?.(event.questions);
          } else if (event.type === 'confirm_required') {
            callbacks.onConfirmRequired?.(event);
          } else if (event.type === 'tool_call') {
            callbacks.onToolCall?.(event);
          } else if (event.type === 'tool_result') {
            callbacks.onToolResult?.(event);
          } else if (event.type === 'error') {
            const msg = event.error ?? t('errors.unknownServer');
            setError(msg);
            callbacks.onError(msg);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          callbacks.onError('__aborted__');
        } else {
          let msg = t('errors.streamError');
          if (err instanceof Error) {
            const streamFailedMatch = err.message.match(
              /^Stream failed \((\d+)\):\s*(.*)$/,
            );
            if (streamFailedMatch) {
              const status = streamFailedMatch[1];
              const detail = streamFailedMatch[2]?.trim();
              msg = detail
                ? t('errors.streamFailedWithDetail', { status, detail })
                : t('errors.streamFailed', { status });
            } else {
              msg = err.message;
            }
          }
          setError(msg);
          callbacks.onError(msg);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [ctx, t],
  );

  return { isStreaming, error, stream, abort };
}

export function buildStreamingMessage(id: string): UiMessage {
  return {
    id,
    role: 'assistant',
    content: '',
    citations: [] as CitationDto[],
    web_sources: [] as WebSourceDto[],
    isStreaming: true,
    created_at: new Date().toISOString(),
  };
}
