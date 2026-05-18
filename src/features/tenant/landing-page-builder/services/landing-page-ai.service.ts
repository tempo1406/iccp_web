import { appConfig } from '@/common/constant/app';
import { HEADER_KEY } from '@/common/constant/header';
import { authTokens } from '@/services/local-storage/auth.storage';
import type { ServiceContext } from '@/services/base-service';

export interface OrgContext {
  name: string;
  slug: string;
  description?: string | null;
  industry?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
}

export interface LandingPageConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateRequest {
  org_context: OrgContext;
  conversation?: LandingPageConversationMessage[];
  mode?: 'generate' | 'modify';
  user_prompt: string;
  /** undefined = generate new page; string = modify existing page */
  current_html?: string;
  /** Optional user-supplied Gemini API key — never sent to iccp_backend_core */
  custom_api_key?: string;
}

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error' | 'replace' | 'status';
  content?: string;
  message?: string;
  tokens_used?: number;
}

function parseEventBlock(block: string): StreamChunk | null {
  const dataLines = block
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart());

  if (dataLines.length === 0) return null;

  try {
    return JSON.parse(dataLines.join('\n')) as StreamChunk;
  } catch {
    return null;
  }
}

export class LandingPageAiService {
  private readonly baseUrl = appConfig.aiBaseUrl;
  private readonly ctx: ServiceContext;

  constructor(ctx: ServiceContext = {}) {
    this.ctx = ctx;
  }

  /**
   * Stream an AI-generated or AI-modified landing page.
   *
   * Reads the access token automatically from localStorage (same pattern as BaseService).
   * Calls `onChunk` for each HTML token, `onDone` when complete, `onError` on failure.
   * Pass an `AbortSignal` to cancel mid-stream.
   */
  streamGenerate(
    body: GenerateRequest,
    onChunk: (html: string) => void,
    onDone: (result?: { tokensUsed?: number }) => void,
    onError: (msg: string) => void,
    signal?: AbortSignal,
    onStatus?: (message: string) => void,
    /** Called when the backend sends a sanitized replacement for the full HTML */
    onReplace?: (fullHtml: string) => void,
  ): void {
    const token = this.ctx.accessToken ?? authTokens.getAccess();
    const url = `${this.baseUrl}/api/v1/landing-pages/generate`;

    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        ...(this.ctx.tenantId
          ? { [HEADER_KEY.X_ORGANIZATION_ID]: this.ctx.tenantId }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
        }

        if (!res.body) {
          throw new Error('AI service did not return a readable stream.');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let sawTerminalEvent = false;
        let sawChunks = false;

        const handleChunk = (chunk: StreamChunk | null) => {
          if (!chunk || sawTerminalEvent) return;

          if (chunk.type === 'chunk' && chunk.content) {
            sawChunks = true;
            onChunk(chunk.content);
            return;
          }

          if (chunk.type === 'replace' && chunk.content) {
            // Backend sanitized the full HTML — replace accumulated content
            onReplace?.(chunk.content);
            return;
          }

          if (chunk.type === 'status' && (chunk.message || chunk.content)) {
            onStatus?.(chunk.message ?? chunk.content ?? '');
            return;
          }

          if (chunk.type === 'done') {
            sawTerminalEvent = true;
            onDone({ tokensUsed: chunk.tokens_used });
            return;
          }

          if (chunk.type === 'error') {
            sawTerminalEvent = true;
            onError(chunk.message ?? 'Unknown error from AI service');
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

          // SSE messages are separated by double newline
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';

          for (const part of parts) {
            handleChunk(parseEventBlock(part.trim()));
          }
        }

        buffer += decoder.decode().replace(/\r\n/g, '\n');
        const trailingChunk = parseEventBlock(buffer.trim());
        handleChunk(trailingChunk);

        if (!sawTerminalEvent) {
          if (sawChunks) {
            onDone();
          } else {
            onError('No response received. The server may have restarted — please try again.');
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        onError(err instanceof Error ? err.message : String(err));
      });
  }
}
