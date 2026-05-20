import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { DueState } from '../../types/kpi.types';

interface DueStateBadgeProps {
  state: DueState;
}

const DUE_STATE_CONFIG: Record<DueState, { key: DueState; className: string }> = {
  on_time: { key: 'on_time', className: 'bg-emerald-500 text-white hover:bg-emerald-500' },
  late: { key: 'late', className: 'bg-red-500 text-white hover:bg-red-500' },
  overdue: { key: 'overdue', className: 'bg-red-600 text-white hover:bg-red-600' },
  upcoming: { key: 'upcoming', className: 'bg-yellow-500 text-white hover:bg-yellow-500' },
  no_due_date: { key: 'no_due_date', className: '' },
};

export function DueStateBadge({ state }: DueStateBadgeProps) {
  const t = useTranslations('project.dashboard.dueState');
  const config = DUE_STATE_CONFIG[state];
  return (
    <Badge
      variant={state === 'no_due_date' ? 'secondary' : 'default'}
      className={config.className}
    >
      {t(config.key)}
    </Badge>
  );
}
