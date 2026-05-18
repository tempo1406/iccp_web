import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Search } from 'lucide-react';

export type MemberStatusFilter = 'all' | 'active' | 'inactive';

interface OrganizationMembersFiltersProps {
  searchQuery: string;
  statusFilter: MemberStatusFilter;
  onSearchQueryChange: (value: string) => void;
  onStatusFilterChange: (value: MemberStatusFilter) => void;
}

export function OrganizationMembersFilters({
  searchQuery,
  statusFilter,
  onSearchQueryChange,
  onStatusFilterChange,
}: Readonly<OrganizationMembersFiltersProps>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full md:max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search by name, email, user ID..."
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="text-muted-foreground h-4 w-4" />
        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as MemberStatusFilter)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
