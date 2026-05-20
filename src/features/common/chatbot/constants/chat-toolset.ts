import type { ChatToolset } from '../types';

export const CHATBOT_TOOLSET_STORAGE_KEY = 'iccp.chatbot.toolset';
export const CHAT_TOOLSET_QUERY_PARAM = 'toolset';

const VALID: ChatToolset[] = [
  'auto',
  'none',
  'projects',
  'tasks',
  'tickets',
  'documents',
  'organization',
  'daily_reports',
];

export function parseChatToolset(value: string | null | undefined): ChatToolset | null {
  if (!value) return null;
  return VALID.includes(value as ChatToolset) ? (value as ChatToolset) : null;
}

export function readStoredChatToolset(): ChatToolset | null {
  if (typeof window === 'undefined') return null;
  return parseChatToolset(sessionStorage.getItem(CHATBOT_TOOLSET_STORAGE_KEY));
}

export function writeStoredChatToolset(toolset: ChatToolset): void {
  sessionStorage.setItem(CHATBOT_TOOLSET_STORAGE_KEY, toolset);
}

type ChatbotTranslator = (key: string) => string;

export function getChatToolsetLabels(
  t: ChatbotTranslator,
): Record<ChatToolset, { label: string; desc: string }> {
  return {
    auto: {
      label: t('toolsets.auto.label'),
      desc: t('toolsets.auto.description'),
    },
    none: {
      label: t('toolsets.none.label'),
      desc: t('toolsets.none.description'),
    },
    projects: {
      label: t('toolsets.projects.label'),
      desc: t('toolsets.projects.description'),
    },
    tasks: {
      label: t('toolsets.tasks.label'),
      desc: t('toolsets.tasks.description'),
    },
    tickets: {
      label: t('toolsets.tickets.label'),
      desc: t('toolsets.tickets.description'),
    },
    documents: {
      label: t('toolsets.documents.label'),
      desc: t('toolsets.documents.description'),
    },
    organization: {
      label: t('toolsets.organization.label'),
      desc: t('toolsets.organization.description'),
    },
    daily_reports: {
      label: t('toolsets.dailyReports.label'),
      desc: t('toolsets.dailyReports.description'),
    },
  };
}
