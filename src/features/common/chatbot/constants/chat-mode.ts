import type { ChatMode } from '../types';

export const CHATBOT_MODE_STORAGE_KEY = 'iccp.chatbot.mode';
export const CHAT_MODE_QUERY_PARAM = 'mode';

const VALID: ChatMode[] = ['general', 'auto', 'rag', 'web'];

export function parseChatMode(value: string | null | undefined): ChatMode | null {
  if (!value) return null;
  if (value === 'hybrid') return 'auto';
  return VALID.includes(value as ChatMode) ? (value as ChatMode) : null;
}

export function readStoredChatMode(): ChatMode | null {
  if (typeof window === 'undefined') return null;
  return parseChatMode(sessionStorage.getItem(CHATBOT_MODE_STORAGE_KEY));
}

export function writeStoredChatMode(mode: ChatMode): void {
  sessionStorage.setItem(CHATBOT_MODE_STORAGE_KEY, mode);
}

type ChatbotTranslator = (key: string) => string;

export function getChatModeLabels(
  t: ChatbotTranslator,
): Record<ChatMode, { label: string; desc: string }> {
  return {
    general: {
      label: t('modes.general.label'),
      desc: t('modes.general.description'),
    },
    auto: {
      label: t('modes.auto.label'),
      desc: t('modes.auto.description'),
    },
    rag: {
      label: t('modes.rag.label'),
      desc: t('modes.rag.description'),
    },
    web: {
      label: t('modes.web.label'),
      desc: t('modes.web.description'),
    },
  };
}
