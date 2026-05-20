'use client';

import { useLocale, useTranslations } from 'next-intl';
import { UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NotificationDto } from '@/services/notifications/types';
import { formatRelativeTime } from '@/utils/formatRelativeTime';

interface NotificationItemProps {
  notification: NotificationDto;
  onSelect: (notification: NotificationDto) => void;
  isInvitation?: boolean;
  onAcceptInvitation?: (notification: NotificationDto) => void;
  isAccepting?: boolean;
  invitationAccepted?: boolean;
}

export function NotificationItem({
  notification,
  onSelect,
  isInvitation = false,
  onAcceptInvitation,
  isAccepting = false,
  invitationAccepted = false,
}: NotificationItemProps) {
  const tCommon = useTranslations('notifications.common');
  const locale = useLocale();
  const { title, message, read, createdAt } = notification;

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
        'hover:bg-accent w-full cursor-pointer rounded-md px-3 py-2.5 text-left transition-colors',
        !read && 'bg-primary/5',
      )}
    >
      <div className="flex items-start gap-2">
        {!read && <span className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full" />}
        <div className={cn('min-w-0 flex-1', read && 'pl-4')}>
          <p className={cn('truncate text-sm', !read ? 'font-semibold' : 'font-medium')}>
            {title}
          </p>
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
            {message}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {formatRelativeTime(createdAt, locale)}
          </p>
          {isInvitation ? (
            <div className="mt-2">
              {invitationAccepted ? (
                <Badge variant="secondary" className="rounded-md px-2.5 py-1 text-[11px] font-medium">
                  {tCommon('accepted')}
                </Badge>
              ) : onAcceptInvitation ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1 rounded-lg px-2 text-[11px]"
                  disabled={isAccepting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onAcceptInvitation(notification);
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {isAccepting ? tCommon('accepting') : tCommon('accept')}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
