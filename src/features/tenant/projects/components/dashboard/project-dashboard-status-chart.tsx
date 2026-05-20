'use client';

import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskByStatus } from '../../types/project-dashboard.types';

interface ProjectDashboardStatusChartProps {
  data: TaskByStatus[] | undefined;
  isLoading: boolean;
}

const PIE_COLORS = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
];

export function ProjectDashboardStatusChart({
  data,
  isLoading,
}: ProjectDashboardStatusChartProps) {
  const t = useTranslations('project.dashboard.statusChart');

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const sorted = [...(data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  const total = sorted.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={sorted}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="count"
              nameKey="statusName"
            >
              {sorted.map((entry, index) => (
                <Cell key={entry.statusId} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const count = Number(value);
                return [
                  `${count} (${total > 0 ? Math.round((count / total) * 100) : 0}%)`,
                  name,
                ];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
