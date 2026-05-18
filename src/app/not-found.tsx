import { getTranslations } from 'next-intl/server';
import { LogIn, MapPinned } from 'lucide-react';

import { ROUTES } from '@/common/constant/routes';
import { HttpStatusPage } from '@/components/shared/http-status-page';

export default async function NotFound() {
  const t = await getTranslations('common.httpStatus');

  return (
    <HttpStatusPage
      statusCode={404}
      tone="primary"
      badgeLabel={t('notFound.badge')}
      icon={MapPinned}
      title={t('notFound.title')}
      description={t('notFound.description')}
      hint={t('notFound.hint')}
      actions={[
        {
          label: t('notFound.backHome'),
          href: ROUTES.home,
        },
        {
          label: t('notFound.goToLogin'),
          href: ROUTES.login,
          icon: LogIn,
          variant: 'outline',
        },
      ]}
    />
  );
}

