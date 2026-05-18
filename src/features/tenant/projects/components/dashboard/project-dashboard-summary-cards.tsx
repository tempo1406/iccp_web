'use client';

import { AlertTriangle, CheckCircle2, Clock, Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardCards } from '../../types/project-dashboard.types';

interface ProjectDashboardSummaryCardsProps {
  cards: DashboardCards | undefined;
  totalMembers?: number;
  isLoading: boolean;
}

const CARD_CONFIG = [
  {
    key: 'totalMembers' as const,
    icon: Users,
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-500',
  },
  {
    key: 'completedLast7Days' as const,
    icon: CheckCircle2,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    key: 'updatedLast7Days' as const,
    icon: Clock,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
  },
  {
    key: 'createdLast7Days' as const,
    icon: Plus,
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
  },
  {
    key: 'dueSoonCount' as const,
    icon: AlertTriangle,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
] as const;

export function ProjectDashboardSummaryCards({
  cards,
  totalMembers = 0,
  isLoading,
}: ProjectDashboardSummaryCardsProps) {
  const t = useTranslations('project.dashboard.summary');

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: CARD_CONFIG.length }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {CARD_CONFIG.map(({ key, icon: Icon, iconBg, iconColor }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${iconBg}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {key === 'totalMembers' ? totalMembers : (cards?.[key] ?? 0)}
              </p>
              <p className="text-muted-foreground text-xs">
                {t(`${key}.label`)} - {t(`${key}.sublabel`)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
