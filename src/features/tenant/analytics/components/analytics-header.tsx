import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Download } from 'lucide-react';

export function AnalyticsPageHeader() {
  const t = useTranslations('analytics');

  return (
    <PageHeader
      title={t('header.title')}
      description={t('header.description')}
      breadcrumbs={[{ label: t('common.dashboard'), href: '/dashboard' }, { label: t('common.analytics') }]}
      actions={
        <div className="flex items-center gap-2">
          <Select defaultValue="7d">
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{t('header.ranges.last24Hours')}</SelectItem>
              <SelectItem value="7d">{t('header.ranges.last7Days')}</SelectItem>
              <SelectItem value="30d">{t('header.ranges.last30Days')}</SelectItem>
              <SelectItem value="90d">{t('header.ranges.last90Days')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('header.export')}
          </Button>
        </div>
      }
    />
  );
}
