'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  MessageCircleMore,
  Bell,
  Ticket,
  FileText,
  FolderKanban,
  BarChart3,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Building2,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
  ClipboardList,
  Globe,
  TrendingUp,
  Target,
  Settings2,
  Clock,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type MouseEvent, useEffect, useRef, useState } from 'react';
import { ROUTES } from '@/common/constant/routes';
import {
  PERMISSIONS,
  type Permission,
} from '@/features/tenant/access-control/permissions';
import { usePermissionChecker } from '@/features/tenant/access-control/hooks/use-can';
import { useMyOrgs } from '@/features/tenant/organization-members/query/members.queries';
import { useMyQuota } from '@/features/common/chatbot/query/use-chatbot';
import {
  getUserDailyTokenUsedPercentage,
  resolveUserDailyTokenBudget,
} from '@/features/common/chatbot/utils/org-token-pool';
import { useAppSelector } from '@/store';
import {
  selectNotificationUnreadCount,
  selectNotificationUnreadTotalCount,
} from '@/store/slices/notification/notification.slice';
import { Loading } from '@/components/shared/loading';

interface NavItemDef {
  path: string;
  icon: React.ElementType;
  labelKey: string;
  badge?: number;
  exactMatch?: boolean;
  requiredPermission?: Permission;
  anyPermissions?: Permission[];
  requireSystemRole?: boolean;
  hideForSystemRole?: boolean;
  children?: NavItemDef[];
}

const mainNavDefs: NavItemDef[] = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { path: '/notifications', icon: Bell, labelKey: 'notifications' },
  { path: '/chatbot', icon: MessageSquare, labelKey: 'chatbot' },
  { path: '/team-chat', icon: MessageCircleMore, labelKey: 'teamChat' },
  {
    path: '/ticket',
    icon: Ticket,
    labelKey: 'ticket',
    children: [
      {
        path: '/ticket/list',
        icon: ClipboardList,
        labelKey: 'ticketList',
      },
      {
        path: '/ticket/create',
        icon: FileText,
        labelKey: 'createRequest',
        requiredPermission: PERMISSIONS.TICKET_REQUESTS_CREATE,
        hideForSystemRole: true,
      },
    ],
  },
  {
    path: '/organization-management',
    icon: Building2,
    labelKey: 'organizationManagement',
    requireSystemRole: true,
    children: [
      {
        path: '/organization-management/invite-members',
        icon: UserPlus,
        labelKey: 'inviteMembers',
        requiredPermission: PERMISSIONS.TENANT_INVITATIONS_LIST,
      },
      {
        path: '/organization-management/members',
        icon: Users,
        labelKey: 'members',
        requiredPermission: PERMISSIONS.TENANT_MEMBERS_LIST,
      },
      {
        path: '/organization-management/roles-permissions',
        icon: ShieldCheck,
        labelKey: 'rolesPermissions',
        requiredPermission: PERMISSIONS.RBAC_ROLES_LIST,
      },
    ],
  },
  {
    path: '/organization-management/landing-page',
    icon: Globe,
    labelKey: 'siteStudio',
    requiredPermission: PERMISSIONS.TENANT_ORGANIZATIONS_MANAGE_LANDING_PAGE,
  },

  { path: '/documents', icon: FileText, labelKey: 'documents' },
  { path: '/projects', icon: FolderKanban, labelKey: 'projects' },
  {
    path: '/analytics',
    icon: BarChart3,
    labelKey: 'analytics',
    children: [
      // {
      //   path: '/analytics',
      //   icon: BarChart3,
      //   labelKey: 'aiAnalytics',
      //   exactMatch: true,
      //   requiredPermission: PERMISSIONS.ANALYTICS_DASHBOARD_VIEW,
      // },
      {
        path: '/analytics/kpi',
        icon: TrendingUp,
        labelKey: 'kpi',
        anyPermissions: [
          PERMISSIONS.ANALYTICS_KPI_ORG_VIEW,
          PERMISSIONS.ANALYTICS_KPI_TARGET_VIEW,
          PERMISSIONS.ANALYTICS_KPI_TARGET_MANAGE,
        ],
      },
      {
        path: '/analytics/periodic-reports',
        icon: FileSpreadsheet,
        labelKey: 'periodicReports',
        exactMatch: true,
        requiredPermission: PERMISSIONS.ANALYTICS_REPORTS_VIEW,
      },
      {
        path: '/my-kpi',
        icon: Target,
        labelKey: 'myKpi',
        exactMatch: true,
      },
    ],
  },
  {
    path: '/billing',
    icon: CreditCard,
    labelKey: 'billing',
    requiredPermission: PERMISSIONS.BILLING_SUBSCRIPTIONS_VIEW,
  },
  {
    path: '/settings',
    icon: Settings2,
    labelKey: 'settings',
    requireSystemRole: true,
    children: [
      {
        path: '/organization-management/profile',
        icon: SlidersHorizontal,
        labelKey: 'general',
      },
      {
        path: '/organization-management/settings',
        icon: TrendingUp,
        labelKey: 'organizationSettings',
        requiredPermission: PERMISSIONS.ORG_CONFIG_SETTINGS_VIEW,
      },
      {
        path: '/organization-management/working-time',
        icon: Clock,
        labelKey: 'workingTime',
        requiredPermission: PERMISSIONS.ORG_CONFIG_WORKING_TIME_VIEW,
      },
    ],
  },
];

// const settingsNavDefs: NavItemDef[] = [
//   { path: '/profile', icon: UserCircle, label: 'Profile' },
//   { path: '/settings/branding', icon: Building, label: 'Branding' },
//   { path: '/notifications', icon: Bell, label: 'Notifications' },
// ];

// const adminNavDefs: NavItemDef[] = [
//   // { path: "/admin", icon: Shield, label: "Admin Center" },
//   // { path: '/admin/audit-logs', icon: ScrollText, label: 'Audit Logs' },
//   // { path: '/documents/approval', icon: ClipboardCheck, label: 'Doc Approval' },
//   // { path: '/settings/integrations', icon: Puzzle, label: 'Integrations' },
//   // { path: '/settings/workflow', icon: Workflow, label: 'Workflows' },
// ];

interface SidebarProps {
  className?: string;
}

const LOADING_SHOW_DELAY_MS = 180;

function getWorkspaceInitials(name?: string): string {
  if (!name) return 'WS';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'WS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function Sidebar({ className }: SidebarProps) {
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const locale = useLocale();
  const intlLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const pathname = usePathname();
  const params = useParams();
  const hasPermission = usePermissionChecker();
  const rbacPermissionsLoaded = useAppSelector(
    (state) => state.user.rbacPermissionsLoaded,
  );
  const hasSystemRole = useAppSelector((state) => state.user.rbacHasSystemRole);
  const activityNotifUnreadCount = useAppSelector(selectNotificationUnreadCount);
  const totalNotifUnreadCount = useAppSelector(selectNotificationUnreadTotalCount);
  const isTeamChatRoute = pathname.includes('/team-chat');
  const notifUnreadCount = isTeamChatRoute ? activityNotifUnreadCount : totalNotifUnreadCount;
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('iccp.sidebar.collapsed') === 'true';
  });

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('iccp.sidebar.collapsed', String(next));
      return next;
    });
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const loadingDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadingDelayTimer = () => {
    if (loadingDelayTimerRef.current) {
      clearTimeout(loadingDelayTimerRef.current);
      loadingDelayTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      clearLoadingDelayTimer();
      setIsRouteLoading(false);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    return () => clearLoadingDelayTimer();
  }, []);

  const tenant = params?.tenant as string | undefined;
  const hasTenantPrefix = !!tenant && pathname.startsWith(`/tenant/${tenant}`);
  const prefix = hasTenantPrefix ? `/tenant/${tenant}` : '';
  const myOrgsQuery = useMyOrgs();
  const canReadAiQuota =
    rbacPermissionsLoaded &&
    (hasPermission(PERMISSIONS.CHATBOT_USE) ||
      hasPermission(PERMISSIONS.TENANT_ORGANIZATIONS_MANAGE_LANDING_PAGE));
  const quotaQuery = useMyQuota(Boolean(tenant) && canReadAiQuota);
  const orgProfile = myOrgsQuery.data?.find((o) => o.id === tenant || o.slug === tenant);
  const workspaceName = orgProfile?.name?.trim() || tenant || '';
  const homeHref = tenant ? ROUTES.tenant.dashboard(tenant) : ROUTES.dashboard;
  const userDailyTokenBudget = resolveUserDailyTokenBudget(quotaQuery.data ?? null);
  const userDailyTokenUsedPercentage = Math.round(
    getUserDailyTokenUsedPercentage(userDailyTokenBudget),
  );

  type ProcessedNavItem = NavItemDef & { href: string; children?: ProcessedNavItem[] };

  const processNavItems = (items: NavItemDef[]): ProcessedNavItem[] =>
    items.map((d) => ({
      ...d,
      href: `${prefix}${d.path}`,
      ...(d.children ? { children: processNavItems(d.children) } : {}),
    })) as ProcessedNavItem[];

  const filterByPermission = (items: ProcessedNavItem[]): ProcessedNavItem[] =>
    items.reduce<ProcessedNavItem[]>((accumulator, item) => {
      const allowedChildren = item.children
        ? filterByPermission(item.children)
        : undefined;
      const allowedBySystemRole = !item.requireSystemRole || hasSystemRole;
      const visibleForSystemRole = !item.hideForSystemRole || !hasSystemRole;
      const allowedByPermission =
        item.anyPermissions
          ? item.anyPermissions.some((permission) => hasPermission(permission))
          : !item.requiredPermission || hasPermission(item.requiredPermission);

      if (
        visibleForSystemRole &&
        allowedBySystemRole &&
        (allowedByPermission || (allowedChildren && allowedChildren.length > 0))
      ) {
        accumulator.push({
          ...item,
          ...(allowedChildren ? { children: allowedChildren } : {}),
        });
      }

      return accumulator;
    }, []);

  const mainNavItems = filterByPermission(processNavItems(mainNavDefs)).map((item) =>
    item.path === '/notifications' ? { ...item, badge: notifUnreadCount } : item,
  );
  // const settingsNavItems = processNavItems(settingsNavDefs);
  // const adminNavItems = filterByPermission(processNavItems(adminNavDefs));

  const handleNavigationStart = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      href === pathname
    ) {
      return;
    }

    clearLoadingDelayTimer();
    setIsRouteLoading(false);
    loadingDelayTimerRef.current = setTimeout(() => {
      setIsRouteLoading(true);
      loadingDelayTimerRef.current = null;
    }, LOADING_SHOW_DELAY_MS);
  };

  const NavItem = ({
    href,
    icon: Icon,
    labelKey,
    badge,
    exactMatch,
    children,
    depth = 0,
  }: {
    href: string;
    icon: React.ElementType;
    labelKey: string;
    badge?: number;
    exactMatch?: boolean;
    children?: ProcessedNavItem[];
    depth?: number;
  }) => {
    const label = tNav(`sidebar.items.${labelKey}`);
    const isExactActive = pathname === href;
    const isPrefixActive = pathname.startsWith(`${href}/`);
    const isExpandable = children && children.length > 0;
    const isChildActive = children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`)) ?? false;
    const isActive = isExpandable
      ? isExactActive
      : exactMatch
        ? isExactActive
        : isExactActive || isPrefixActive;

    const [isOpen, setIsOpen] = useState(isChildActive);

    const content = (
      <div className="flex flex-col">
        <div
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            isActive && !isExpandable
              ? 'bg-[var(--brand-light)] text-[var(--brand)]'
              : isChildActive && isExpandable
                ? collapsed
                  ? 'bg-[var(--brand-light)] text-[var(--brand)]'
                  : 'font-semibold text-[var(--brand)]'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            depth > 0 && 'py-1.5',
          )}
          style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
          onClick={(e) => {
            if (isExpandable) {
              e.preventDefault();
              if (collapsed) {
                toggleCollapsed();
                return;
              }
              setIsOpen(!isOpen);
            }
          }}
        >
          {isExpandable ? (
            <div className="flex w-full items-center">
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isChildActive ? 'text-[var(--brand)]' : '',
                )}
              />
              {!collapsed && (
                <>
                  <span className="ml-3 flex-1">{label}</span>
                  <ChevronRight
                    className={cn(
                      'text-muted-foreground h-4 w-4 transition-transform',
                      isOpen && 'rotate-90',
                    )}
                  />
                </>
              )}
            </div>
          ) : (
            <Link
              href={href}
              className="flex w-full items-center"
              onClick={(event) => handleNavigationStart(event, href)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="ml-3 flex-1">{label}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                      style={{
                        backgroundColor: 'var(--brand)',
                        color: 'var(--brand-fg)',
                      }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )}
        </div>

        {!collapsed && isExpandable && isOpen && (
          <div className="relative mt-1 flex flex-col gap-1">
            {/* Guide line for nested items */}
            <div
              className="bg-border/50 absolute top-0 bottom-2 left-[20px] w-px"
              style={{ left: `${1.1 + depth * 1.25}rem` }}
            />
            {children.map((child) => (
              <NavItem key={child.href} {...child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );

    if (collapsed && !isExpandable) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (collapsed && isExpandable) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
            {label} ({tNav('sidebar.expandToViewMenu')})
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider>
      {/* Spacer for fixed sidebar */}
      <div
        className={cn(
          'hidden flex-shrink-0 transition-all duration-300 md:block',
          collapsed ? 'w-[68px]' : 'w-64',
        )}
      />
      <div
        className={cn(
          'bg-background fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-64',
          className,
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!collapsed && (
            <Link
              href={homeHref}
              className="flex min-w-0 items-center gap-2"
              onClick={(event) => handleNavigationStart(event, homeHref)}
            >
              {tenant ? (
                <>
                  {orgProfile?.logoUrl ? (
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={orgProfile.logoUrl} alt={workspaceName} />
                      <AvatarFallback className="bg-primary/10 text-primary rounded-full text-xs font-bold">
                        {getWorkspaceInitials(workspaceName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                  <span className="truncate text-lg font-bold text-[var(--brand)]">
                    {workspaceName}
                  </span>
                </>
              ) : (
                <>
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-bold">ICCP</span>
                </>
              )}
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="h-8 w-8"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-3 py-4">
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>

            {/* <Separator className="my-2" /> */}

            {/* <div className="space-y-1">
              {!collapsed && (
                <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                  Settings
                </p>
              )}
              {settingsNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div> */}

            {/* <div className="space-y-1">
              {!collapsed && (
                <p className="text-muted-foreground mb-2 px-3 text-xs font-semibold tracking-wider uppercase">
                  Admin
                </p>
              )}
              {adminNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div> */}
          </ScrollArea>
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t p-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-xs font-medium">
                {tNav('sidebar.dailyTokenLimit')}
              </p>
              <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${userDailyTokenUsedPercentage}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {userDailyTokenBudget
                  ? tNav('sidebar.usedToday', {
                    used: userDailyTokenBudget.used.toLocaleString(intlLocale),
                    limit: userDailyTokenBudget.limit.toLocaleString(intlLocale),
                    percentage: userDailyTokenUsedPercentage,
                  })
                  : tNav('sidebar.quotaUnavailable')}
              </p>
            </div>
          </div>
        )}
      </div>
      {isRouteLoading ? (
        <Loading fullScreen text={tCommon('loading.data')} className="z-[60]" />
      ) : null}
    </TooltipProvider>
  );
}
