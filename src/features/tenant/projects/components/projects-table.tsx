import { BarChart3, Edit, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { projectStatusConfig, type ProjectItem } from './projects-data';

interface ProjectsTableProps {
  projects: ProjectItem[];
  onOpenProject: (projectSlug: string) => void;
}

export function ProjectsTable({ projects, onOpenProject }: ProjectsTableProps) {
  const t = useTranslations('project.table');
  const statusT = useTranslations('project.statusBadge');

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('project')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead>{t('progress')}</TableHead>
            <TableHead>{t('team')}</TableHead>
            <TableHead>{t('dueDate')}</TableHead>
            <TableHead className="w-12.5"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const projectRouteSegment = project.slug ?? project.id;

            return (
              <TableRow
                key={project.id}
                className="cursor-pointer"
                onClick={() => onOpenProject(projectRouteSegment)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-muted-foreground line-clamp-1 text-sm">
                      {project.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={projectStatusConfig[project.status].color}>
                    {statusT(project.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="w-32">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>{project.progress}%</span>
                      <span className="text-muted-foreground">
                        {project.tasksCompleted}/{project.tasksTotal}
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
	                    {project.team.slice(0, 3).map((member) => (
	                      <Avatar
	                        key={member.id}
	                        className="border-background h-7 w-7 border-2"
	                      >
                          {member.avatar ? <AvatarImage src={member.avatar} alt={member.name} /> : null}
	                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {member.name
                            .split(' ')
                            .map((namePart) => namePart[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.team.length > 3 && (
                      <Avatar className="border-background h-7 w-7 border-2">
                        <AvatarFallback className="text-[10px]">
                          +{project.team.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{project.dueDate}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {t('viewBoard')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('editProject')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
