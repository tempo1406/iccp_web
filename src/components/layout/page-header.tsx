import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  descriptionCollapsible?: boolean;
  descriptionCollapseThreshold?: number;
  descriptionShowMoreLabel?: string;
  descriptionShowLessLabel?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  descriptionCollapsible = false,
  descriptionCollapseThreshold = 160,
  descriptionShowMoreLabel = 'Show more',
  descriptionShowLessLabel = 'Show less',
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  const normalizedDescription = description ?? '';
  const shouldCollapseDescription =
    descriptionCollapsible &&
    normalizedDescription.length > descriptionCollapseThreshold;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="text-muted-foreground flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {(() => {
                const isDashboardCrumb = crumb.href?.includes('/dashboard') ?? false;

                if (crumb.href) {
                  return (
                    <Link
                      href={crumb.href}
                      className={cn(
                        'transition-colors',
                        isDashboardCrumb
                          ? 'text-primary font-semibold hover:text-primary/90'
                          : 'hover:text-accent-foreground',
                      )}
                    >
                      {crumb.label}
                    </Link>
                  );
                }

                return (
                  <span
                    className={cn(
                      'font-medium',
                      isDashboardCrumb ? 'text-primary font-semibold' : 'text-foreground',
                    )}
                  >
                    {crumb.label}
                  </span>
                );
              })()}
            </div>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-primary text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {normalizedDescription && !shouldCollapseDescription && (
            <p className="text-muted-foreground max-w-2xl break-words whitespace-pre-line">
              {normalizedDescription}
            </p>
          )}
          {normalizedDescription && shouldCollapseDescription && (
            <details className="group max-w-3xl">
              <summary className="cursor-pointer list-none">
                <p className="text-muted-foreground line-clamp-2 break-words whitespace-pre-line group-open:hidden">
                  {normalizedDescription}
                </p>
                <p className="text-muted-foreground hidden break-words whitespace-pre-line group-open:block">
                  {normalizedDescription}
                </p>
                <span className="text-primary mt-1 inline-flex text-sm font-medium group-open:hidden">
                  {descriptionShowMoreLabel}
                </span>
                <span className="text-primary mt-1 hidden text-sm font-medium group-open:inline-flex">
                  {descriptionShowLessLabel}
                </span>
              </summary>
            </details>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
