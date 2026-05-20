'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Megaphone, Mail, Users, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatDateTime';
import { CAMPAIGN_STATUS_STYLES } from '@/utils/campaign-status.utils';
import type { CampaignDto } from '@/services/notifications/types';

interface CampaignDetailPanelProps {
  campaign: CampaignDto | null;
}

export function CampaignDetailPanel({ campaign }: CampaignDetailPanelProps) {
  const t = useTranslations('notifications');
  const locale = useLocale();

  if (!campaign) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Megaphone className="h-12 w-12 opacity-30" />
        <p className="text-sm">{t('campaignDetail.empty')}</p>
      </div>
    );
  }

  const progress =
    campaign.totalRecipients > 0
      ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
      : 0;

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {t('campaignDetail.createdAt', {
                date: formatDateTime(campaign.createdAt, locale),
              })}
            </p>
          </div>
        </div>
        <span className={cn('rounded border px-2 py-0.5 text-xs font-medium', CAMPAIGN_STATUS_STYLES[campaign.status])}>
          {t(`status.${campaign.status.toLowerCase()}`)}
        </span>
      </div>

      {/* Title */}
      <h2 className="mb-2 text-base font-semibold">{campaign.title}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{campaign.message}</p>

      {/* Meta chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="gap-1 text-xs">
          <Target className="h-3 w-3" />
          {campaign.targetType === 'ORG_ALL'
            ? t('campaignDetail.allMembers')
            : t('campaignDetail.specificRoles')}
        </Badge>
        {campaign.sendEmail && (
          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary gap-1 text-xs">
            <Mail className="h-3 w-3" />
            {t('campaignDetail.emailEnabled')}
          </Badge>
        )}
        {campaign.targetRoleIds && campaign.targetRoleIds.length > 0 && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Users className="h-3 w-3" />
            {t('campaignDetail.roleCount', { count: campaign.targetRoleIds.length })}
          </Badge>
        )}
      </div>

      {/* Progress */}
      {campaign.status !== 'PENDING' && campaign.totalRecipients > 0 && (
        <div className="mb-4 rounded-md border bg-muted/20 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {t('campaignDetail.deliveryProgress')}
            </span>
            <span className="text-xs font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm font-semibold">{campaign.totalRecipients}</p>
              <p className="text-[10px] text-muted-foreground">{t('campaignDetail.total')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-600">{campaign.sentCount}</p>
              <p className="text-[10px] text-muted-foreground">{t('campaignDetail.sent')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-600">{campaign.failedCount}</p>
              <p className="text-[10px] text-muted-foreground">{t('campaignDetail.failed')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rich content preview */}
      {campaign.content && (
        <div
          className={cn(
            'prose prose-sm max-w-none rounded-md border bg-muted/20 p-4',
            'prose-headings:mt-2 prose-headings:mb-1',
          )}
          dangerouslySetInnerHTML={{ __html: campaign.content }}
        />
      )}
    </div>
  );
}
