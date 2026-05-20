'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskByPriority } from '../../types/project-dashboard.types';

interface ProjectDashboardPriorityChartProps {
  data: TaskByPriority[] | undefined;
  isLoading: boolean;
}

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  urgent: { color: '#ef4444' },
  high: { color: '#f97316' },
  medium: { color: '#eab308' },
  low: { color: '#3b82f6' },
};

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];

export function ProjectDashboardPriorityChart({
  data,
  isLoading,
}: ProjectDashboardPriorityChartProps) {
  const t = useTranslations('project.dashboard.priorityChart');
  const priorityT = useTranslations('project.dashboard.priority');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = PRIORITY_ORDER.map((priority) => {
    const found = data?.find((item) => item.priority === priority);
    return {
      priority,
      label: priorityT(priority),
      count: found?.count ?? 0,
      color: PRIORITY_CONFIG[priority]?.color ?? '#6366f1',
    };
  });

  const total = chartData.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-muted-foreground text-sm">{t('empty')}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.6 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="bg-popover border-border rounded-md border px-3 py-1.5 text-sm shadow-md">
                      <span className="font-medium">{item.payload.label}</span>:{' '}
                      <span>{t('tasksCount', { count: Number(item.value ?? 0) })}</span>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((entry) => (
                  <Cell key={entry.priority} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
