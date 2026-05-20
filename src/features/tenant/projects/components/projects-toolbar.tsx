import { Filter, LayoutGrid, List, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface ProjectsToolbarProps {
  searchQuery: string;
  statusFilter: string;
  statusOptions: Array<{
    value: string;
    label: string;
  }>;
  viewMode: 'grid' | 'list';
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onViewModeChange: (value: 'grid' | 'list') => void;
}

export function ProjectsToolbar({
  searchQuery,
  statusFilter,
  statusOptions,
  viewMode,
  onSearchQueryChange,
  onStatusFilterChange,
  onViewModeChange,
}: ProjectsToolbarProps) {
  const t = useTranslations('project.toolbar');

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer">
              <Filter className="mr-2 h-4 w-4" />
              {statusOptions.find((option) => option.value === statusFilter)?.label ?? t('allStatus')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {statusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onStatusFilterChange(option.value)}
                className="cursor-pointer"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="icon"
          className="cursor-pointer"
          onClick={() => onViewModeChange('grid')}
          aria-label={t('gridView')}
          title={t('gridView')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="icon"
          className="cursor-pointer"
          onClick={() => onViewModeChange('list')}
          aria-label={t('listView')}
          title={t('listView')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
