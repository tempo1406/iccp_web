'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationDto } from '@/services/notifications/types';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

interface NotificationItemProps {
  notification: NotificationDto;
  onOpen: () => void;
  onDelete: () => void;
}

export function NotificationItem({ notification, onOpen, onDelete }: NotificationItemProps) {
  const t = useTranslations('notifications.common');
  const locale = useLocale();
  const { title, message, read, createdAt } = notification;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'hover:bg-accent group relative w-full cursor-pointer rounded-md px-3 py-2.5 pr-10 text-left transition-colors',
        !read && 'bg-primary/5',
      )}
    >
      <div className="flex items-start gap-2">
        {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
        <div className={cn('min-w-0 flex-1', read && 'pl-4')}>
          <p
            className={cn(
              'min-w-0 break-words pr-2 text-sm leading-5',
              'line-clamp-2',
              !read ? 'font-semibold' : 'font-medium',
            )}
          >
            {title}
          </p>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 break-words pr-2 text-xs leading-relaxed">
            {message}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatRelativeTime(createdAt, locale)}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        title={t('delete')}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </button>
  );
}
