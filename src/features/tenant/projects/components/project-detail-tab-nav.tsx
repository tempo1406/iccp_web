'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  value: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  hidden?: boolean;
}

interface ProjectDetailTabNavProps {
  basePath: string;
  canViewMembersTab?: boolean;
  canViewRolesTab?: boolean;
  canViewDocumentsTab?: boolean;
  canViewKpiTab?: boolean;
  canViewReportsTab?: boolean;
  viewModeControls?: React.ReactNode;
  filterControls?: React.ReactNode;
}

export function ProjectDetailTabNav({
  basePath,
  canViewMembersTab,
  canViewRolesTab,
  canViewDocumentsTab,
  canViewKpiTab,
  canViewReportsTab,
  viewModeControls,
  filterControls,
}: ProjectDetailTabNavProps) {
  const pathname = usePathname();
  const t = useTranslations('project.tabs');

  const tabs: Tab[] = [
    {
      value: 'dashboard',
      label: t('dashboard'),
      href: `${basePath}/dashboard`,
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      value: 'board',
      label: t('board'),
      href: `${basePath}/board`,
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      value: 'team',
      label: t('teamProgress'),
      href: `${basePath}/team`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      value: 'members',
      label: t('members'),
      href: `${basePath}/members`,
      icon: <Users className="h-4 w-4" />,
      hidden: !canViewMembersTab,
    },
    {
      value: 'roles',
      label: t('roles'),
      href: `${basePath}/roles`,
      icon: <ShieldCheck className="h-4 w-4" />,
      hidden: !canViewRolesTab,
    },
    {
      value: 'documents',
      label: t('documents'),
      href: `${basePath}/documents`,
      icon: <FileText className="h-4 w-4" />,
      hidden: !canViewDocumentsTab,
    },
    {
      value: 'kpi',
      label: t('kpi'),
      href: `${basePath}/kpi`,
      icon: <TrendingUp className="h-4 w-4" />,
      hidden: !canViewKpiTab,
    },
    {
      value: 'reports',
      label: t('reports'),
      href: `${basePath}/reports`,
      icon: <ClipboardCheck className="h-4 w-4" />,
      hidden: !canViewReportsTab,
    },
  ];

  const activeTabs = tabs.filter((tab) => !tab.hidden);

  return (
    <div className="flex items-center justify-between border-b">
      <nav className="flex items-center gap-1 px-1">
        {activeTabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.value}
              href={tab.href}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'hover:text-foreground text-muted-foreground border-transparent hover:border-border',
              )}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {(viewModeControls || filterControls) && (
        <div className="flex items-center gap-2 px-2 pb-1">
          {viewModeControls}
          {filterControls}
        </div>
      )}
    </div>
  );
}
