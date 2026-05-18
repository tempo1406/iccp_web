'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  className?: string;
  text?: string;
  fullScreen?: boolean;
  showProgressBar?: boolean;
}

export function Loading({
  className,
  text,
  fullScreen = false,
  showProgressBar = true,
}: LoadingProps) {
  const t = useTranslations('common.loading');
  const displayText = text ?? t('data');

  return (
    <>
      <style>{`
        @keyframes iccp-loading-progress-crawl {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 90%;
          }
        }

        @keyframes iccp-loading-logo-glow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
            filter: drop-shadow(0 0 8px color-mix(in srgb, var(--brand) 20%, transparent));
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
            filter: drop-shadow(0 0 16px color-mix(in srgb, var(--brand) 40%, transparent));
          }
        }

        .iccp-loading-progress-bar {
          animation: iccp-loading-progress-crawl 2s ease-out forwards;
        }

        .iccp-loading-logo {
          animation: iccp-loading-logo-glow 3s ease-in-out infinite;
        }

        .iccp-loading-material-icon::before {
          content: 'token';
        }
      `}</style>

      {showProgressBar && (
        <div
          className={cn(
            'bg-primary/10 right-0 left-0 z-50 h-[2px]',
            fullScreen ? 'fixed top-0' : 'absolute top-0',
          )}
        >
          <div
            className="bg-primary iccp-loading-progress-bar h-full"
            style={{
              boxShadow: '0 0 10px color-mix(in srgb, var(--brand) 50%, transparent)',
            }}
          />
        </div>
      )}

      <div
        className={cn(
          'z-10 flex items-center justify-center',
          fullScreen
            ? 'bg-background/50 fixed inset-0 backdrop-blur-sm'
            : 'absolute inset-0',
          'pointer-events-none',
          className,
        )}
      >
        <div
          className="bg-background/80 border-border/50 iccp-loading-logo flex flex-col items-center gap-4 rounded-2xl border p-8 shadow-2xl backdrop-blur-sm"
        >
          <div className="text-primary flex items-center justify-center">
            <span
              aria-hidden="true"
              className="material-symbols-outlined iccp-loading-material-icon !text-[48px]"
            />
          </div>
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {displayText}
          </p>
        </div>
      </div>
    </>
  );
}
