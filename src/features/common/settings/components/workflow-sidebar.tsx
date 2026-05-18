import { Filter, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { WorkflowItem } from './workflow-data';

interface WorkflowSidebarProps {
  workflows: WorkflowItem[];
  selectedWorkflowId: number;
  filterText: string;
  onFilterTextChange: (value: string) => void;
  onSelectWorkflow: (id: number) => void;
}

export function WorkflowSidebar({
  workflows,
  selectedWorkflowId,
  filterText,
  onFilterTextChange,
  onSelectWorkflow,
}: WorkflowSidebarProps) {
  return (
    <aside className="bg-background flex w-80 shrink-0 flex-col border-r">
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Workflows</h3>
          <Button variant="ghost" size="icon" className="text-primary h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Filter className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Filter list..."
            value={filterText}
            onChange={(event) => onFilterTextChange(event.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {workflows
          .filter((workflow) =>
            workflow.name.toLowerCase().includes(filterText.toLowerCase()),
          )
          .map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => onSelectWorkflow(workflow.id)}
              className={`group relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all ${
                selectedWorkflowId === workflow.id
                  ? 'border-primary/20 bg-primary/5'
                  : 'hover:border-border hover:bg-muted border-transparent'
              }`}
            >
              {selectedWorkflowId === workflow.id && (
                <div className="bg-primary absolute top-0 right-0 bottom-0 w-1 rounded-r-lg" />
              )}
              <div className="mt-0.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${workflow.iconBg} ${workflow.iconColor}`}
                >
                  <workflow.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <p
                    className={`truncate text-sm font-medium ${
                      selectedWorkflowId === workflow.id
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {workflow.name}
                  </p>
                  <Badge
                    variant={workflow.status === 'active' ? 'default' : 'secondary'}
                    className={`text-[10px] ${
                      workflow.status === 'active'
                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                        : 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400'
                    }`}
                  >
                    {workflow.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  Last edited {workflow.lastEdited}
                </p>
                {workflow.tags && selectedWorkflowId === workflow.id && (
                  <div className="mt-2 flex items-center gap-2">
                    {workflow.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </aside>
  );
}
