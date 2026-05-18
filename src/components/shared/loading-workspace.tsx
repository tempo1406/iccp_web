'use client';

import { RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface WorkspaceLoadingProps {
  workspaceName: string;
  progress: number;
  workspaceLogoUrl?: string | null;
}

function getWorkspaceInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'ORG';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function WorkspaceLoading({
  workspaceName,
  progress,
  workspaceLogoUrl,
}: WorkspaceLoadingProps) {
  const t = useTranslations('dashboard.workspaceLoading');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const initials = getWorkspaceInitials(workspaceName);
  const brandShadow = '0 18px 40px -18px color-mix(in srgb, var(--brand) 45%, transparent)';
  const brandProgressGlow = '0 0 15px color-mix(in srgb, var(--brand) 80%, transparent)';
  const content = (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex h-screen w-screen flex-col items-center justify-center overflow-hidden antialiased',
        isDark ? 'bg-[#101322] text-slate-100' : 'bg-[#f6f8fc] text-slate-900',
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <div
          className={cn(
            'absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full blur-[120px]',
            isDark ? 'bg-primary/30' : 'bg-primary/14',
          )}
        />
        <div
          className={cn(
            'absolute right-[-10%] bottom-[-10%] h-[60%] w-[60%] rounded-full blur-[100px]',
            isDark ? 'bg-primary/20' : 'bg-primary/16',
          )}
        />
        <div
          className={cn(
            'absolute top-[40%] left-[30%] h-[40%] w-[40%] rounded-full blur-[80px]',
            isDark ? 'bg-primary/10' : 'bg-primary/12',
          )}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center justify-center px-6">
        <div className="mb-12 flex flex-col items-center gap-8">
          <div className="relative flex items-center justify-center">
            {workspaceLogoUrl ? (
              <img
                src={workspaceLogoUrl}
                alt={workspaceName}
                className="h-24 w-24 rounded-full object-cover"
                style={{ boxShadow: brandShadow }}
              />
            ) : (
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-full',
                  isDark
                    ? 'bg-gradient-to-br from-[#1e2338] to-[#111422]'
                    : 'border border-slate-200/80 bg-gradient-to-br from-white to-slate-100',
                )}
                style={{ boxShadow: brandShadow }}
              >
                <span
                  className="text-primary text-2xl font-extrabold tracking-wide"
                >
                  {initials}
                </span>
              </div>
            )}
          </div>

          <div className="flex max-w-lg flex-col items-center gap-2 text-center">
            <h1
              className={cn(
                'text-3xl font-bold tracking-tight sm:text-4xl',
                isDark ? 'text-white' : 'text-slate-900',
              )}
            >
              {t('title')}
            </h1>
            <p
              className={cn(
                'text-base font-medium',
                isDark ? 'text-slate-400' : 'text-slate-600',
              )}
            >
              {t('connectingTo')}{' '}
              <span
                className={cn(
                  'font-semibold',
                  isDark ? 'text-slate-200' : 'text-slate-800',
                )}
              >
                {workspaceName}
              </span>
            </p>
          </div>
        </div>

        <div className="flex w-full max-w-lg flex-col gap-4">
          <div className="flex items-end justify-between px-1">
            <div className="flex items-center gap-2">
              <RefreshCcw className="text-primary h-4 w-4 animate-spin" />
              <p
                className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-slate-200' : 'text-slate-700',
                )}
              >
                {t('syncingAssets')}
              </p>
            </div>
            <p className="text-primary font-mono text-sm font-bold">
              {clampedProgress}%
            </p>
          </div>

          <div
            className={cn(
              'relative h-2 w-full overflow-hidden rounded-full border',
              isDark ? 'border-white/5 bg-slate-800/50' : 'border-slate-200 bg-slate-200/80',
            )}
          >
            <div
              className="bg-primary absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${clampedProgress}%`,
                boxShadow: brandProgressGlow,
              }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-10 skew-x-12 bg-gradient-to-r from-transparent to-white/30" />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <p
              className={cn(
                'text-xs font-normal',
                isDark ? 'text-slate-500' : 'text-slate-500',
              )}
            >
              {t('verifyingCredentials')}
            </p>
            <p
              className={cn(
                'text-xs font-normal',
                isDark ? 'text-slate-500' : 'text-slate-500',
              )}
            >
              {t('remainingTime', { seconds: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
}
