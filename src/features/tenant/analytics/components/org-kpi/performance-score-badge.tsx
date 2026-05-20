import { Badge } from '@/components/ui/badge';

interface PerformanceScoreBadgeProps {
  score: number;
}

export function PerformanceScoreBadge({ score }: PerformanceScoreBadgeProps) {
  const variant =
    score >= 80
      ? 'default'
      : score >= 60
        ? 'secondary'
        : 'destructive';

  const colorClass =
    score >= 80
      ? 'bg-emerald-500 text-white hover:bg-emerald-500'
      : score >= 60
        ? 'bg-yellow-500 text-white hover:bg-yellow-500'
        : '';

  return (
    <Badge variant={variant} className={colorClass}>
      {score.toFixed(0)}/100
    </Badge>
  );
}
