import { cn } from '@/lib/utils';

const sizeClasses = {
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
} as const;

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  contained?: boolean;
  size?: keyof typeof sizeClasses;
}

export function PageContainer({
  children,
  className,
  contained = false,
  size = 'wide',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-5',
        contained && 'mx-auto',
        contained && sizeClasses[size],
        className,
      )}
    >
      {children}
    </div>
  );
}
