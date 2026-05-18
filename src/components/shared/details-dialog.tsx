import type { ReactNode } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface DetailsDialogItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
}

export interface DetailsDialogSection {
  key: string;
  title?: ReactNode;
  description?: ReactNode;
  items: DetailsDialogItem[];
}

export interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  /** Keep typo alias for compatibility when callers pass `tiltle`. */
  tiltle?: ReactNode;
  description?: ReactNode;
  sections: DetailsDialogSection[];
  footer?: ReactNode;
  emptyMessage?: ReactNode;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  sectionClassName?: string;
  columns?: 1 | 2;
  compact?: boolean;
}

export function DetailsDialog({
  open,
  onOpenChange,
  title,
  tiltle,
  description,
  sections,
  footer,
  emptyMessage = 'No details available.',
  contentClassName,
  titleClassName,
  descriptionClassName,
  sectionClassName,
  columns = 1,
  compact = false,
}: DetailsDialogProps) {
  const resolvedTitle = title ?? tiltle ?? 'Details';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[85vh] overflow-y-auto border border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-sm sm:max-w-3xl',
          contentClassName,
        )}
      >
        <DialogHeader className="border-b-2 border-border/80 bg-gradient-to-r from-muted/60 via-muted/35 to-muted/10 px-6 py-5">
          <DialogTitle className={cn('text-xl tracking-tight', titleClassName)}>
            {resolvedTitle}
          </DialogTitle>
          {description ? (
            <DialogDescription className={cn('text-sm', descriptionClassName)}>
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div
          className={cn(
            'bg-muted/10 px-6 py-5',
            columns === 2 ? 'grid gap-5 lg:grid-cols-2' : 'space-y-5',
          )}
        >
          {sections.length === 0 ? (
            <p className="text-muted-foreground text-sm">{emptyMessage}</p>
          ) : (
            sections.map((section) => (
              <section
                key={section.key}
                className={cn(
                  'space-y-3 rounded-xl border border-border/70 bg-card/60 p-4',
                  sectionClassName,
                )}
              >
                {section.title ? (
                  <div className="space-y-1 border-b border-border/60 pb-3">
                    <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
                    {section.description ? (
                      <p className="text-muted-foreground text-xs">{section.description}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="overflow-hidden rounded-lg border border-border/70 bg-background/80">
                  {section.items.map((item, index) => (
                    <div
                      key={item.key}
                      className={cn(
                        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3',
                        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-3 text-sm',
                        index < section.items.length - 1 && 'border-b border-border/70',
                      )}
                    >
                      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {item.label}
                      </p>
                      <div className="text-left sm:text-right">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {footer ? <DialogFooter className="border-t border-border/70 px-6 py-4">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
