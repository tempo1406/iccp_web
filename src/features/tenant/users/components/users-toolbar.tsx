import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UsersToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export function UsersToolbar({ searchQuery, onSearchQueryChange }: UsersToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 md:max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          className="pl-9"
        />
      </div>
      <Button variant="outline" size="icon">
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  );
}
