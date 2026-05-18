import { Globe, Layers, Library, MessageSquarePlus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getChatModeLabels } from '../constants/chat-mode';
import type { ChatMode } from '../types';

const MODE_ICONS: Record<ChatMode, React.ReactNode> = {
  general: <Sparkles className="h-5 w-5" />,
  auto: <Layers className="h-5 w-5" />,
  rag: <Library className="h-5 w-5" />,
  web: <Globe className="h-5 w-5" />,
};

interface ChatbotEmptyStateProps {
  mode: ChatMode;
  onSuggestion: (text: string) => void;
  onNewChat: () => void;
}

export function ChatbotEmptyState({ mode, onSuggestion, onNewChat }: ChatbotEmptyStateProps) {
  const t = useTranslations('chatbot');
  const modeLabels = getChatModeLabels(t);
  const modeSuffix = t('emptyState.modeSuffix');
  const suggestions: Record<ChatMode, string[]> = {
    general: [
      t('emptyState.suggestions.auto1'),
      t('emptyState.suggestions.auto2'),
      t('emptyState.suggestions.auto3'),
    ],
    auto: [
      t('emptyState.suggestions.auto1'),
      t('emptyState.suggestions.auto2'),
      t('emptyState.suggestions.auto3'),
    ],
    rag: [
      t('emptyState.suggestions.rag1'),
      t('emptyState.suggestions.rag2'),
      t('emptyState.suggestions.rag3'),
    ],
    web: [
      t('emptyState.suggestions.web1'),
      t('emptyState.suggestions.web2'),
      t('emptyState.suggestions.web3'),
    ],
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-auto px-4 py-12 text-center">
      <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-2xl">
        <Sparkles className="text-primary h-8 w-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t('emptyState.title')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('emptyState.currentlyIn')}{' '}
          <span className="text-foreground inline-flex items-center gap-1 font-medium">
            {MODE_ICONS[mode]}
            {modeLabels[mode].label}
            {modeSuffix ? ` ${modeSuffix}` : null}
          </span>
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        {suggestions[mode].map((text) => (
          <button
            key={text}
            onClick={() => onSuggestion(text)}
            className="hover:bg-muted w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors"
          >
            {text}
          </button>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={onNewChat} className="gap-2">
        <MessageSquarePlus className="h-4 w-4" />
        {t('emptyState.startConversation')}
      </Button>
    </div>
  );
}
