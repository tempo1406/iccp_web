import { useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  projectPriorityColors,
  type ProjectColumn,
  type ProjectTask,
} from './project-detail-data';

export interface ProjectListTask extends ProjectTask {
  columnId: string;
  columnTitle: string;
}

interface ProjectTaskListTableProps {
  tasks: ProjectListTask[];
  columns: ProjectColumn[];
  searchQuery: string;
  page: number;
  limit: number;
  pageItemCount: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canUpdateTask?: boolean;
  canDeleteTask?: boolean;
  isPending?: boolean;
  isUpdatingTask?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onChangeTaskStatus: (
    taskId: string,
    currentColumnId: string,
    newColumnId: string,
  ) => void;
  onTaskClick?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => Promise<boolean>;
}

export function ProjectTaskListTable({
  tasks,
  columns,
  searchQuery,
  page,
  limit,
  pageItemCount,
  canGoPrevious,
  canGoNext,
  canUpdateTask = true,
  canDeleteTask = true,
  isPending = false,
  isUpdatingTask = false,
  onPageChange,
  onLimitChange,
  onChangeTaskStatus,
  onTaskClick,
  onDeleteTask,
}: ProjectTaskListTableProps) {
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, tasks],
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-75">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => {
              const currentColumn = columns.find((column) => column.id === task.columnId);

              return (
                <TableRow
                  key={task.id}
                  className={onTaskClick ? 'cursor-pointer' : ''}
                  onClick={() => onTaskClick?.(task.id)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-muted-foreground line-clamp-1 text-sm">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 gap-1.5">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              currentColumn?.color ?? 'bg-gray-400',
                            )}
                          />
                          {task.columnTitle}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {columns.map((column) => (
                          <DropdownMenuItem
                            key={column.id}
                            onClick={() =>
                              onChangeTaskStatus(task.id, task.columnId, column.id)
                            }
                            className={cn(task.columnId === column.id && 'bg-muted')}
                          >
                            <div
                              className={cn('mr-2 h-2 w-2 rounded-full', column.color)}
                            />
                            {column.title}
                            {task.columnId === column.id && (
                              <CheckCircle2 className="text-primary ml-auto h-4 w-4" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', projectPriorityColors[task.priority])}
                    >
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {task.assignees.slice(0, 3).map((assignee, index) => (
                        <Avatar
                          key={index}
                          className="border-background h-7 w-7 border-2"
                        >
                          {assignee.avatar ? (
                            <AvatarImage src={assignee.avatar} alt={assignee.name} />
                          ) : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {assignee.name
                              .split(' ')
                              .map((namePart) => namePart[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees.length > 3 && (
                        <Avatar className="border-background h-7 w-7 border-2">
                          <AvatarFallback className="text-[10px]">
                            +{task.assignees.length - 3}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          disabled={!canUpdateTask || !onTaskClick}
                          onClick={() => onTaskClick?.(task.id)}
                        >
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={!canDeleteTask || !onDeleteTask || isUpdatingTask}
                          onClick={() => onDeleteTask && void onDeleteTask(task.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isPending && filteredTasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  No task found.
                </TableCell>
              </TableRow>
            )}
            {isPending && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Loading tasks...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {filteredTasks.length} of {pageItemCount} tasks on this page • Page{' '}
            {page}
          </p>

          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(value) => {
                onLimitChange(Number(value));
              }}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              disabled={!canGoPrevious || isPending}
              onClick={() => onPageChange(Math.max(page - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!canGoNext || isPending}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
