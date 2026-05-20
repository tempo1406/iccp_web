'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamChatProviderIconProps {
  className?: string;
  icon: LucideIcon;
  iconClassName?: string;
  imageClassName?: string;
  label: string;
  providerIconUrl?: string;
}

export function TeamChatProviderIcon({
  className,
  icon: Icon,
  iconClassName,
  imageClassName,
  label,
  providerIconUrl,
}: TeamChatProviderIconProps) {
  const [failedProviderIconUrl, setFailedProviderIconUrl] = useState<string | null>(null);
  const providerIconFailed = Boolean(providerIconUrl) && failedProviderIconUrl === providerIconUrl;

  return (
    <span
      className={cn(
        'bg-background inline-flex items-center justify-center overflow-hidden rounded-2xl border border-border shadow-sm',
        className,
      )}
      aria-hidden="true"
      title={label}
    >
      {providerIconUrl && !providerIconFailed ? (
        <img
          src={providerIconUrl}
          alt=""
          className={cn('h-full w-full object-contain p-1', imageClassName)}
          loading="lazy"
          decoding="async"
          onError={() => setFailedProviderIconUrl(providerIconUrl ?? '')}
        />
      ) : (
        <Icon className={cn('h-[55%] w-[55%]', iconClassName)} />
      )}
    </span>
  );
}
