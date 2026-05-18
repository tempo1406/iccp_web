'use client';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ConversationDto } from '../types';

interface ChatbotSidebarProps {
  conversations: ConversationDto[];
  activeId: string | null;
  isOpen: boolean;
  onSelect: (conv: ConversationDto) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  isCreating?: boolean;
}

const MAX_CONVERSATION_TITLE_LENGTH = 25;

function truncateConversationTitle(title: string): string {
  const chars = Array.from(title);
  if (chars.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return title;
  }

  return `${chars.slice(0, MAX_CONVERSATION_TITLE_LENGTH).join('')}...`;
}

export function ChatbotSidebar({
  conversations,
  activeId,
  isOpen,
  onSelect,
  onNewChat,
  onDelete,
  isCreating,
}: ChatbotSidebarProps) {
  const t = useTranslations('chatbot');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  return (
    <>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden border-r transition-all duration-300 ease-in-out',
          isOpen ? 'w-64 lg:w-72' : 'w-0',
        )}
      >
        <div className="flex h-full min-h-0 w-64 flex-col lg:w-72">
          <div className="flex items-center justify-between border-b px-3 py-3 sm:px-4">
            <h2 className="text-sm font-semibold">{t('sidebar.title')}</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={onNewChat}
              disabled={isCreating}
              className="h-7 gap-1 px-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('sidebar.new')}
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <p className="text-muted-foreground p-4 text-center text-xs">
                {t('sidebar.empty')}
              </p>
            ) : (
              <div className="space-y-0.5 p-2">
                {conversations.map((conv) =>
                  (() => {
                    const fullTitle = conv.title ?? t('sidebar.newConversation');
                    const displayTitle = truncateConversationTitle(fullTitle);

                    return (
                      <div
                        key={conv.id}
                        className={cn(
                          'group flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                          conv.id === activeId
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted cursor-pointer',
                        )}
                        onClick={() => onSelect(conv)}
                      >
                        <MessageSquare className="text-muted-foreground h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm" title={fullTitle}>
                            {displayTitle}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'text-muted-foreground hover:text-destructive ml-1 h-6 w-6 shrink-0 transition-opacity',
                            conv.id === activeId
                              ? 'opacity-100'
                              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
                          )}
                          aria-label={t('sidebar.delete')}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(conv.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })(),
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sidebar.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sidebar.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('sidebar.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              {t('sidebar.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
