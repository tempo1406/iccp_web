'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { NotificationDto } from '@/services/notifications/types';
import { readString, toRecord } from '../utils/notification-detail.utils';

interface NotificationLandingPageLeadCardProps {
  notification: NotificationDto;
}

type LeadContactMeta = {
  name: string;
  email: string;
  phone: string;
  message: string;
  organizationName: string | null;
};

function normalizeLeadValue(value: string | null | undefined): string {
  const normalized = readString(value);
  return normalized ?? '-';
}

function parseLeadContent(content: string | null): Partial<LeadContactMeta> {
  const normalizedContent = readString(content);
  if (!normalizedContent) {
    return {};
  }

  const rows = normalizedContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const leadMeta: Partial<LeadContactMeta> = {};

  for (const row of rows) {
    const separatorIndex = row.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const label = row.slice(0, separatorIndex).trim().toLowerCase();
    const value = row.slice(separatorIndex + 1).trim();
    if (!value) {
      continue;
    }

    if (label === 'name') {
      leadMeta.name = value;
      continue;
    }

    if (label === 'email') {
      leadMeta.email = value;
      continue;
    }

    if (label === 'phone') {
      leadMeta.phone = value;
      continue;
    }

    if (label === 'message') {
      leadMeta.message = value;
    }
  }

  return leadMeta;
}

function extractLeadMeta(notification: NotificationDto): LeadContactMeta {
  const data = toRecord(notification.data);
  const lead = toRecord(data?.lead);
  const contentLead = parseLeadContent(notification.content);

  return {
    name: normalizeLeadValue(readString(lead?.name) ?? contentLead.name),
    email: normalizeLeadValue(readString(lead?.email) ?? contentLead.email),
    phone: normalizeLeadValue(readString(lead?.phone) ?? contentLead.phone),
    message: normalizeLeadValue(readString(lead?.message) ?? contentLead.message),
    organizationName: readString(data?.organizationName),
  };
}

function ContactField({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const isEmpty = value === '-';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 text-[11px] font-medium tracking-[0.14em] text-slate-500 uppercase">
        {label}
      </div>

      {href && !isEmpty ? (
        <a
          href={href}
          className="block text-sm font-medium break-words text-slate-900 underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p
          className={cn(
            'text-sm font-medium break-words text-slate-900',
            isEmpty && 'text-slate-400',
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}

export function NotificationLandingPageLeadCard({
  notification,
}: NotificationLandingPageLeadCardProps) {
  const t = useTranslations('notifications.landingLead');
  const lead = extractLeadMeta(notification);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <ContactField label={t('fullName')} value={lead.name} />
          <ContactField
            label={t('email')}
            value={lead.email}
            href={lead.email === '-' ? undefined : `mailto:${lead.email}`}
          />
          <ContactField
            label={t('phone')}
            value={lead.phone}
            href={lead.phone === '-' ? undefined : `tel:${lead.phone}`}
          />
          <ContactField label={t('status')} value={t('pendingConsultation')} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-[11px] font-medium tracking-[0.14em] text-slate-500 uppercase">
            {t('content')}
          </div>
          <p
            className={cn(
              'text-sm leading-7 break-words whitespace-pre-line text-slate-800',
              lead.message === '-' && 'text-slate-400',
            )}
          >
            {lead.message}
          </p>
        </div>
      </div>
    </div>
  );
}
