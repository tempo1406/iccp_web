import Link from 'next/link';
import type { VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface HttpStatusPageAction {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export interface HttpStatusPageProps {
  statusCode: string | number;
  title: string;
  description: string;
  badgeLabel?: string;
  hint?: string;
  tone?: 'primary' | 'danger';
  icon?: LucideIcon;
  actions?: HttpStatusPageAction[];
  className?: string;
}

const toneClassMap: Record<
  NonNullable<HttpStatusPageProps['tone']>,
  {
    code: string;
    badge: string;
    orb: string;
    icon: string;
  }
> = {
  primary: {
    code: 'text-primary',
    badge: 'border-primary/25 bg-primary/10 text-primary',
    orb: 'bg-primary/25',
    icon: 'border-primary/25 bg-primary/10 text-primary',
  },
  danger: {
    code: 'text-destructive',
    badge: 'border-destructive/25 bg-destructive/10 text-destructive',
    orb: 'bg-destructive/30',
    icon: 'border-destructive/25 bg-destructive/10 text-destructive',
  },
};

export function HttpStatusPage({
  statusCode,
  title,
  description,
  badgeLabel,
  hint,
  tone = 'primary',
  icon,
  actions = [],
  className,
}: HttpStatusPageProps) {
  const Icon = icon ?? AlertTriangle;
  const toneClasses = toneClassMap[tone];

  return (
    <main
      className={cn(
        'relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_10%,rgba(15,23,42,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(15,23,42,0.08),transparent_42%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_42%)]" />
      <div
        className={cn(
          'pointer-events-none absolute -top-16 -right-10 -z-10 h-64 w-64 rounded-full blur-3xl',
          toneClasses.orb,
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute -bottom-20 -left-10 -z-10 h-72 w-72 rounded-full blur-3xl',
          toneClasses.orb,
        )}
      />

      <section className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-8 shadow-2xl backdrop-blur-sm sm:p-12">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          {badgeLabel ? (
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase',
                toneClasses.badge,
              )}
            >
              {badgeLabel}
            </span>
          ) : null}

          <div
            className={cn(
              'mt-6 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm',
              toneClasses.icon,
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          <p className={cn('mt-6 text-6xl font-bold tracking-tight sm:text-7xl', toneClasses.code)}>
            {statusCode}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
            {description}
          </p>

          {actions.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {actions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={`${action.href}-${action.label}`}
                    variant={action.variant ?? (index === 0 ? 'default' : 'outline')}
                    size={action.size ?? 'lg'}
                    asChild
                  >
                    <Link href={action.href}>
                      {ActionIcon ? <ActionIcon className="h-4 w-4" /> : null}
                      {action.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          ) : null}

          {hint ? <p className="text-muted-foreground mt-8 text-xs sm:text-sm">{hint}</p> : null}
        </div>
      </section>
    </main>
  );
}

