import { getRequestConfig } from 'next-intl/server';
import { DEFAULT_TIME_ZONE } from './config';
import { getRequestLocale } from './get-request-locale';
import { getMessagesForLocale } from './messages';

export default getRequestConfig(async () => {
  const locale = await getRequestLocale();

  return {
    locale,
    messages: getMessagesForLocale(locale),
    timeZone: DEFAULT_TIME_ZONE,
  };
});
