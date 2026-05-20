'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Home, ShieldAlert } from 'lucide-react';

import { ROUTES } from '@/common/constant/routes';
import { Loading } from '@/components/shared/loading';
import { HttpStatusPage } from '@/components/shared/http-status-page';

export default function Forbidden() {
  const [isDelayDone, setIsDelayDone] = useState(false);
  const t = useTranslations('common.httpStatus');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsDelayDone(true);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!isDelayDone) {
    return <Loading fullScreen text={t('checkingAccess')} />;
  }

  return (
    <HttpStatusPage
      statusCode={403}
      tone="danger"
      badgeLabel={t('forbidden.badge')}
      icon={ShieldAlert}
      title={t('forbidden.title')}
      description={t('forbidden.description')}
      hint={t('forbidden.hint')}
      actions={[
        {
          label: t('forbidden.backHome'),
          href: ROUTES.home,
          icon: Home,
        },
        {
          label: t('forbidden.signInAnother'),
          href: ROUTES.login,
          variant: 'outline',
        },
      ]}
    />
  );
}

