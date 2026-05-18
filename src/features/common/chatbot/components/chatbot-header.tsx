'use client';
import { PanelLeft, PanelLeftClose, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AIModelOptionDto } from '../types';

const AUTO_MODEL_VALUE = '__auto__';

interface ChatbotHeaderProps {
  conversationTitle?: string | null;
  modelOptions: AIModelOptionDto[];
  selectedModelId: string | null;
  onModelChange: (modelId: string | null) => void;
  isStreaming?: boolean;
  disabled?: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatbotHeader({
  conversationTitle,
  modelOptions,
  selectedModelId,
  onModelChange,
  isStreaming,
  disabled,
  isSidebarOpen,
  onToggleSidebar,
}: ChatbotHeaderProps) {
  const t = useTranslations('chatbot');

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-foreground mr-3 h-8 w-8 shrink-0"
          title={isSidebarOpen ? t('header.closeSidebar') : t('header.openSidebar')}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>

        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
            <Sparkles className="text-primary h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {conversationTitle ?? t('header.defaultTitle')}
            </h1>
            <p className="text-muted-foreground truncate text-xs">
              {t('header.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[50vw] min-w-55 shrink-0">
        <Select
          value={selectedModelId ?? AUTO_MODEL_VALUE}
          onValueChange={(value) =>
            onModelChange(value === AUTO_MODEL_VALUE ? null : value)
          }
          disabled={disabled || isStreaming}
        >
          <SelectTrigger className="h-9 w-full rounded-full">
            <SelectValue placeholder={t('header.selectModelPlaceholder')} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value={AUTO_MODEL_VALUE}>{t('header.autoModel')}</SelectItem>
            {modelOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
