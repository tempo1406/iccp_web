import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  LayoutGrid,
  Loader2,
  List,
  MoreHorizontal,
  Search,
  Settings,
  SquarePen,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  type ProjectHeaderTaskFilterOption,
  useProjectDetailHeaderFilters,
} from '../hooks/use-project-detail-header-filters';

type TaskFilterOption = ProjectHeaderTaskFilterOption;

interface ProjectDetailSummary {
  id: string;
  name: string;
  description: string;
  progress: number;
  startDate: string;
  dueDate: string;
}

interface ProjectDetailHeaderControlsProps {
  project: ProjectDetailSummary;
  dashboardHref: string;
  projectsHref: string;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  activeTab: string;
  viewMode: 'board' | 'list';
  searchQuery: string;
  assigneeFilterOptions: TaskFilterOption[];
  tagFilterOptions: TaskFilterOption[];
  statusFilterOptions: TaskFilterOption[];
  priorityFilterOptions: TaskFilterOption[];
  selectedAssigneeFilters: string[];
  selectedTagFilters: string[];
  selectedStatusFilters: string[];
  selectedPriorityFilters: string[];
  canUpdateProject?: boolean;
  canDeleteProject?: boolean;
  isUpdatingProject?: boolean;
  isDeletingProject?: boolean;
  canInviteMember?: boolean;
  canViewMembersTab?: boolean;
  canViewRolesTab?: boolean;
  canViewDocumentsTab?: boolean;
  canViewKpiTab?: boolean;
  canViewReportsTab?: boolean;
  canViewSettingsTab?: boolean;
  onActiveTabChange: (value: string) => void;
  onSettingsClick?: () => void;
  onViewModeChange: (value: 'board' | 'list') => void;
  onSearchQueryChange: (value: string) => void;
  onToggleAssigneeFilter: (value: string) => void;
  onToggleTagFilter: (value: string) => void;
  onToggleStatusFilter: (value: string) => void;
  onTogglePriorityFilter: (value: string) => void;
  onClearAssigneeFilters: () => void;
  onClearTagFilters: () => void;
  onClearStatusFilters: () => void;
  onClearPriorityFilters: () => void;
  onEditProjectClick?: () => void;
  onDeleteProjectClick?: () => void;
  onInviteMemberClick?: () => void;
  onOpenRolesClick?: () => void;
}

function getInitials(label: string): string {
  return label
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getPriorityAccent(priority: string): string {
  const normalized = priority.trim().toLowerCase();
  if (normalized === 'low') return 'bg-cyan-400';
  if (normalized === 'medium') return 'bg-amber-400';
  if (normalized === 'high') return 'bg-orange-500';
  if (normalized === 'urgent') return 'bg-rose-500';
  return 'bg-gray-400';
}

export function ProjectDetailHeaderControls({
  project,
  dashboardHref,
  projectsHref,
  todoCount,
  inProgressCount,
  doneCount,
  activeTab,
  viewMode,
  searchQuery,
  assigneeFilterOptions,
  tagFilterOptions,
  statusFilterOptions,
  priorityFilterOptions,
  selectedAssigneeFilters,
  selectedTagFilters,
  selectedStatusFilters,
  selectedPriorityFilters,
  canUpdateProject = false,
  canDeleteProject = false,
  isUpdatingProject = false,
  isDeletingProject = false,
  canInviteMember = true,
  canViewMembersTab = true,
  canViewRolesTab = true,
  canViewDocumentsTab = true,
  canViewKpiTab = false,
  canViewReportsTab = true,
  canViewSettingsTab = false,
  onActiveTabChange,
  onViewModeChange,
  onSearchQueryChange,
  onToggleAssigneeFilter,
  onToggleTagFilter,
  onToggleStatusFilter,
  onTogglePriorityFilter,
  onClearAssigneeFilters,
  onClearTagFilters,
  onClearStatusFilters,
  onClearPriorityFilters,
  onEditProjectClick,
  onDeleteProjectClick,
  onInviteMemberClick,
  onOpenRolesClick,
  onSettingsClick,
}: ProjectDetailHeaderControlsProps) {
  const t = useTranslations('project.detailHeader');
  const commonT = useTranslations('project.common');
  const tabsT = useTranslations('project.tabs');
  const {
    isFilterOpen,
    activeFilterGroup,
    filterSearch,
    selectedCount,
    activeGroupConfig,
    activeOptions,
    activeSelected,
    filteredOptions,
    filterGroups,
    setFilterSearch,
    handleToggleOption,
    handleClearActiveGroup,
    handleFilterOpenChange,
    handleSelectFilterGroup,
  } = useProjectDetailHeaderFilters({
    assigneeFilterOptions,
    tagFilterOptions,
    statusFilterOptions,
    priorityFilterOptions,
    selectedAssigneeFilters,
    selectedTagFilters,
    selectedStatusFilters,
    selectedPriorityFilters,
    onToggleAssigneeFilter,
    onToggleTagFilter,
    onToggleStatusFilter,
    onTogglePriorityFilter,
    onClearAssigneeFilters,
    onClearTagFilters,
    onClearStatusFilters,
    onClearPriorityFilters,
  });

  return (
    <div className="shrink-0 space-y-6">
      <PageHeader
        title={project.name}
        description={project.description}
        descriptionCollapsible
        descriptionShowMoreLabel={commonT('showMore')}
        descriptionShowLessLabel={commonT('showLess')}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard'), href: dashboardHref },
          { label: t('breadcrumbs.projects'), href: projectsHref },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {(canUpdateProject || canDeleteProject || canViewRolesTab || canViewSettingsTab) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={isUpdatingProject || isDeletingProject}
                    aria-label={t('aria.projectActions')}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canViewRolesTab && (
                    <DropdownMenuItem onClick={onOpenRolesClick}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {t('actions.roleManagement')}
                    </DropdownMenuItem>
                  )}
                  {canViewSettingsTab && (
                    <DropdownMenuItem onClick={onSettingsClick}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t('actions.projectSettings')}
                    </DropdownMenuItem>
                  )}
                  {canUpdateProject && (
                    <DropdownMenuItem
                      onClick={onEditProjectClick}
                      disabled={isUpdatingProject || isDeletingProject}
                    >
                      {isUpdatingProject ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <SquarePen className="mr-2 h-4 w-4" />
                      )}
                      {t('actions.editProject')}
                    </DropdownMenuItem>
                  )}
                  {canDeleteProject && (
                    <DropdownMenuItem
                      onClick={onDeleteProjectClick}
                      disabled={isDeletingProject || isUpdatingProject}
                      className="text-destructive focus:text-destructive"
                    >
                      {isDeletingProject ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {t('actions.deleteProject')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canInviteMember && (
              <Button onClick={onInviteMemberClick}>
                <UserPlus className="mr-2 h-4 w-4" />
                {t('actions.inviteMember')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{t('summary.overallProgress')}</span>
              <span className="text-lg font-bold">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
            <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
              <span>{t('summary.started')}: {project.startDate}</span>
              <span>{t('summary.due')}: {project.dueDate}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-500/10">
              <Clock className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todoCount}</p>
              <p className="text-muted-foreground text-xs">{t('summary.todo')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <BarChart3 className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-muted-foreground text-xs">{t('summary.inProgress')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{doneCount}</p>
              <p className="text-muted-foreground text-xs">{t('summary.completed')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={onActiveTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="board">
              <BarChart3 className="mr-2 h-4 w-4" />
              {tabsT('board')}
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="mr-2 h-4 w-4" />
              {tabsT('teamProgress')}
            </TabsTrigger>
            {canViewMembersTab && (
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" />
                {tabsT('members')}
              </TabsTrigger>
            )}
            {canViewDocumentsTab && (
              <TabsTrigger value="documents">
                <FileText className="mr-2 h-4 w-4" />
                {tabsT('documents')}
              </TabsTrigger>
            )}
            {canViewKpiTab && (
              <TabsTrigger value="kpi">
                <TrendingUp className="mr-2 h-4 w-4" />
                {tabsT('kpi')}
              </TabsTrigger>
            )}
            {canViewReportsTab && (
              <TabsTrigger value="reports">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {tabsT('reports')}
              </TabsTrigger>
            )}
          </TabsList>
          <div className="flex items-center gap-2">
            {activeTab === 'board' && (
              <div className="flex items-center rounded-lg border p-1">
                <Button
                  variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => onViewModeChange('board')}
                >
                  <LayoutGrid className="mr-1 h-4 w-4" />
                  {t('viewMode.board')}
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => onViewModeChange('list')}
                >
                  <List className="mr-1 h-4 w-4" />
                  {t('viewMode.list')}
                </Button>
              </div>
            )}
            {activeTab === 'board' && (
              <>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder={t('filters.searchTasks')}
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange(event.target.value)}
                    className="w-55 pl-9"
                  />
                </div>

                <Popover
                  open={isFilterOpen}
                  onOpenChange={handleFilterOpenChange}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 gap-2 px-3">
                      <Filter className="h-4 w-4" />
                      {t('filters.button')}
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                          {selectedCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-190 p-0">
                <div className="grid grid-cols-[220px_1fr]">
                  <div className="border-r p-3">
                    <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
                      {t('filters.title')}
                    </p>
                    <div className="space-y-1">
                      {filterGroups.map((group) => (
                        <button
                          key={group.key}
                          type="button"
                          className={cn(
                            'hover:bg-muted flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm',
                            activeFilterGroup === group.key && 'bg-muted',
                          )}
                          onClick={() => handleSelectFilterGroup(group.key)}
                        >
                          {group.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 border-t pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-start px-2"
                        onClick={handleClearActiveGroup}
                      >
                        {t('filters.clearGroup', { label: activeGroupConfig.label })}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3">
                    <div className="relative">
                      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        value={filterSearch}
                        onChange={(event) => setFilterSearch(event.target.value)}
                        placeholder={activeGroupConfig.searchPlaceholder}
                        className="pl-9"
                      />
                    </div>

                    <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => {
                          const isChecked = activeSelected.has(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={cn(
                                'hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left',
                                isChecked && 'bg-muted',
                              )}
                              onClick={() => handleToggleOption(option.value)}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleOption(option.value)}
                                onClick={(event) => event.stopPropagation()}
                              />

	                              {activeFilterGroup === 'assignee' ? (
	                                <div className="flex min-w-0 items-center gap-2">
	                                  <Avatar className="h-6 w-6">
                                      {option.avatarUrl ? <AvatarImage src={option.avatarUrl} alt={option.label} /> : null}
	                                    <AvatarFallback className="text-[10px]">
                                      {option.label.toLowerCase() === 'unassigned' ? (
                                        <UserRound className="h-3.5 w-3.5" />
                                      ) : (
                                        getInitials(option.label)
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{option.label}</span>
                                </div>
                              ) : activeFilterGroup === 'status' ? (
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-semibold uppercase"
                                >
                                  {option.label}
                                </Badge>
                              ) : activeFilterGroup === 'priority' ? (
                                <span className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'inline-block h-0.5 w-5 rounded-full',
                                      getPriorityAccent(option.value),
                                    )}
                                  />
                                  <span>{option.label}</span>
                                </span>
                              ) : (
                                <span className="truncate">{option.label}</span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground px-2 py-2 text-sm">
                          {t('filters.empty')}
                        </p>
                      )}
                    </div>

                    <p className="text-muted-foreground text-right text-xs">
                      {filteredOptions.length} of {activeOptions.length}
                    </p>
                  </div>
                </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
