import type { AbstractIntlMessages } from 'next-intl';
import { DEFAULT_LOCALE, type AppLocale } from '../config';
import commonEn from './en/common.json';
import authEn from './en/auth.json';
import landingEn from './en/landing.json';
import profileEn from './en/profile.json';
import dashboardEn from './en/dashboard.json';
import notificationsEn from './en/notifications.json';
import billingEn from './en/billing.json';
import chatbotEn from './en/chatbot.json';
import documentsEn from './en/documents.json';
import navigationEn from './en/navigation.json';
import orgConfigEn from './en/org-config.json';
import organizationManagementEn from './en/organization-management.json';
import ticketEn from './en/ticket.json';
import analyticsEn from './en/analytics.json';
import projectEn from './en/project.json';
import siteStudioEn from './en/site-studio.json';
import teamChatEn from './en/team-chat.json';
import commonVi from './vi/common.json';
import authVi from './vi/auth.json';
import landingVi from './vi/landing.json';
import profileVi from './vi/profile.json';
import dashboardVi from './vi/dashboard.json';
import notificationsVi from './vi/notifications.json';
import billingVi from './vi/billing.json';
import chatbotVi from './vi/chatbot.json';
import documentsVi from './vi/documents.json';
import navigationVi from './vi/navigation.json';
import orgConfigVi from './vi/org-config.json';
import organizationManagementVi from './vi/organization-management.json';
import ticketVi from './vi/ticket.json';
import analyticsVi from './vi/analytics.json';
import projectVi from './vi/project.json';
import siteStudioVi from './vi/site-studio.json';
import teamChatVi from './vi/team-chat.json';

export const messagesByLocale: Record<AppLocale, AbstractIntlMessages> = {
  en: {
    common: commonEn,
    auth: authEn,
    landing: landingEn,
    profile: profileEn,
    dashboard: dashboardEn,
    notifications: notificationsEn,
    billing: billingEn,
    chatbot: chatbotEn,
    documents: documentsEn,
    navigation: navigationEn,
    orgConfig: orgConfigEn,
    organizationManagement: organizationManagementEn,
    ticket: ticketEn,
    analytics: analyticsEn,
    project: projectEn,
    siteStudio: siteStudioEn,
    teamChat: teamChatEn,
  },
  vi: {
    common: commonVi,
    auth: authVi,
    landing: landingVi,
    profile: profileVi,
    dashboard: dashboardVi,
    notifications: notificationsVi,
    billing: billingVi,
    chatbot: chatbotVi,
    documents: documentsVi,
    navigation: navigationVi,
    orgConfig: orgConfigVi,
    organizationManagement: organizationManagementVi,
    ticket: ticketVi,
    analytics: analyticsVi,
    project: projectVi,
    siteStudio: siteStudioVi,
    teamChat: teamChatVi,
  },
};

export function getMessagesForLocale(locale: AppLocale): AbstractIntlMessages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}
