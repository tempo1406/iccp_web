'use client';

import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { TaskByType } from '../../types/project-dashboard.types';

interface ProjectDashboardTypeChartProps {
  data: TaskByType[] | undefined;
  isLoading: boolean;
}

const TYPE_CONFIG: Record<string, { color: string }> = {
  task: { color: '#6366f1' },
  subtask: { color: '#22c55e' },
};

export function ProjectDashboardTypeChart({
  data,
  isLoading,
}: ProjectDashboardTypeChartProps) {
  const t = useTranslations('project.dashboard.typeChart');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-44 w-44 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data ?? []).map((item) => ({
    ...item,
    label:
      item.type === 'task'
        ? item.count === 1
          ? t('taskSingular')
          : t('taskPlural')
        : item.type === 'subtask'
          ? item.count === 1
            ? t('subtaskSingular')
            : t('subtaskPlural')
          : item.type,
    color: TYPE_CONFIG[item.type]?.color ?? '#6366f1',
  }));

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
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="label"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
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
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-6">
              {chartData.map((item) => (
                <div key={item.type} className="text-center">
                  <p className="text-lg font-bold">{item.count}</p>
                  <p className="text-muted-foreground text-xs">{item.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
