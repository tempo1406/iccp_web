'use client';

import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import type { NotificationDto } from '@/services/notifications/types';

interface NotificationListItemProps {
  notification: NotificationDto;
  isSelected: boolean;
  onSelect: (notification: NotificationDto) => void;
  onDelete: (id: string) => void;
}

export function NotificationListItem({
  notification,
  isSelected,
  onSelect,
  onDelete,
}: NotificationListItemProps) {
  const locale = useLocale();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(notification)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(notification);
        }
      }}
      className={cn(
        'group relative flex w-full min-w-0 cursor-pointer items-start gap-3 overflow-hidden border-b px-3 py-3 pr-12 transition-colors hover:bg-muted/50',
        isSelected && 'border-l-2 border-l-primary bg-primary/5',
        !notification.read && 'bg-primary/5 dark:bg-primary/10',
      )}
    >
      {!notification.read && (
        <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="min-w-0 pr-1">
          <p
            className={cn(
              'line-clamp-2 break-words pr-2 text-sm leading-5',
              !notification.read ? 'font-semibold' : 'font-medium',
            )}
          >
            {notification.title}
          </p>
        </div>
        <p className="text-muted-foreground mt-1 line-clamp-2 break-words pr-2 text-xs leading-relaxed">
          {notification.message}
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2.5 pr-1">
          <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
            {formatRelativeTime(notification.createdAt, locale)}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-1 hidden h-6 w-6 text-muted-foreground hover:text-destructive group-hover:flex"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
