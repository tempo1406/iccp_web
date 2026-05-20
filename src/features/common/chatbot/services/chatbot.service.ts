import { appConfig } from '@/common/constant/app';
import type { ApiFetchOptions } from '@/config/http/api-client';
import { BaseService, type ServiceContext } from '@/services/base-service';
import { authTokens } from '@/services/local-storage/auth.storage';
import type {
  AIModelOptionDto,
  ConversationDto,
  MessageDto,
  ConversationHistoryDto,
  CreateConversationBody,
  SendMessageBody,
  SseEvent,
  QuotaMeDto,
  PendingActionDto,
  UpdateConversationBody,
} from '../types';

const AI_BASE = appConfig.aiBaseUrl;
const API_V1 = '/api/v1';

export class ChatbotService extends BaseService {
  constructor(ctx: ServiceContext = {}) {
    super(ctx);
  }

  // Route all standard REST calls to be_ai instead of be_core
  protected override call<TResponse, TBody = unknown>(
    endpoint: string,
    options: ApiFetchOptions<TBody> = {},
  ): Promise<TResponse> {
    return super.call<TResponse, TBody>(endpoint, { ...options, baseUrl: AI_BASE });
  }

  listConversations(): Promise<ConversationDto[]> {
    return this.get<ConversationDto[]>(`${API_V1}/conversations?limit=100&offset=0`);
  }

  getConversation(id: string): Promise<ConversationDto> {
    return this.get<ConversationDto>(`${API_V1}/conversations/${id}`);
  }

  createConversation(body: CreateConversationBody): Promise<ConversationDto> {
    return this.post<ConversationDto, CreateConversationBody>(
      `${API_V1}/conversations`,
      body,
    );
  }

  updateConversation(
    id: string,
    body: UpdateConversationBody,
  ): Promise<ConversationDto> {
    return this.put<ConversationDto, UpdateConversationBody>(
      `${API_V1}/conversations/${id}`,
      body,
    );
  }

  deleteConversation(id: string): Promise<void> {
    return this.delete<void>(`${API_V1}/conversations/${id}`);
  }

  cancelPendingAction(conversationId: string, actionId: string): Promise<void> {
    return this.post<void, Record<string, never>>(
      `${API_V1}/conversations/${conversationId}/actions/${actionId}/cancel`,
      {},
    );
  }

  listPendingActions(
    conversationId: string,
    status?: string,
  ): Promise<PendingActionDto[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.get<PendingActionDto[]>(
      `${API_V1}/conversations/${conversationId}/actions${qs}`,
    );
  }

  getMessages(
    conversationId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<ConversationHistoryDto> {
    const qs =
      params && Object.keys(params).length
        ? '?' +
          new URLSearchParams(
            Object.fromEntries(
              Object.entries(params)
                .filter(([, v]) => v != null)
                .map(([k, v]) => [k, String(v)]),
            ),
          )
        : '';
    return this.get<ConversationHistoryDto>(
      `${API_V1}/conversations/${conversationId}/messages${qs}`,
    );
  }

  async getAllMessages(conversationId: string): Promise<MessageDto[]> {
    const history = await this.getMessages(conversationId, { limit: 100, offset: 0 });
    return history.messages;
  }

  getMyQuota(): Promise<QuotaMeDto> {
    return this.get<QuotaMeDto>(`${API_V1}/quotas/me`);
  }

  listModelOptions(purpose = 'chat_completion'): Promise<AIModelOptionDto[]> {
    return this.get<{ items: AIModelOptionDto[] }>(
      `${API_V1}/ai-models/options?purpose=${purpose}`,
    ).then((res) => res.items ?? []);
  }

  /**
   * POST a message and stream the SSE response.
   * Yields SseEvent objects: token | done | error
   */
  async *sendMessageStream(
    conversationId: string,
    body: SendMessageBody,
    signal?: AbortSignal,
  ): AsyncGenerator<SseEvent> {
    const token =
      this.ctx.accessToken ??
      (typeof window !== 'undefined' ? (authTokens.getAccess() ?? undefined) : undefined);

    const orgId = this.ctx.tenantId ?? undefined;

    const response = await fetch(
      `${AI_BASE}${API_V1}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(orgId ? { 'x-organization-id': orgId } : {}),
        },
        body: JSON.stringify(body),
        signal,
      },
    );

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '');
      throw new Error(`Stream failed (${response.status}): ${text}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const parseDataLine = (line: string): SseEvent | null => {
      if (!line.startsWith('data: ')) return null;
      const raw = line.slice(6).trim();
      if (!raw || raw === '[DONE]') return null;
      try {
        return JSON.parse(raw) as SseEvent;
      } catch {
        return null;
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          const tail = buffer.trim();
          if (tail) {
            const event = parseDataLine(tail.replace(/\r$/, ''));
            if (event) {
              yield event;
            }
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const event = parseDataLine(line.replace(/\r$/, ''));
          if (event) {
            yield event;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
