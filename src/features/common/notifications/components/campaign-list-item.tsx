'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Progress } from '@/components/ui/progress';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { CAMPAIGN_STATUS_STYLES } from '@/utils/campaign-status.utils';
import type { CampaignDto } from '@/services/notifications/types';

interface CampaignListItemProps {
  campaign: CampaignDto;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export function CampaignListItem({ campaign, isSelected, onSelect }: CampaignListItemProps) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const progress =
    campaign.totalRecipients > 0
      ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
      : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(campaign.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(campaign.id)}
      className={cn(
        'flex cursor-pointer gap-3 border-b px-3 py-3 transition-colors hover:bg-muted/50',
        isSelected && 'border-l-2 border-l-primary bg-primary/5',
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Megaphone className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="truncate text-sm font-medium">{campaign.title}</p>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(campaign.createdAt, locale)}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{campaign.message}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-medium', CAMPAIGN_STATUS_STYLES[campaign.status])}>
            {t(`status.${campaign.status.toLowerCase()}`)}
          </span>
          {campaign.status !== 'PENDING' && campaign.totalRecipients > 0 && (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Progress value={progress} className="h-1 flex-1" />
              <span className="shrink-0 text-[10px] text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
