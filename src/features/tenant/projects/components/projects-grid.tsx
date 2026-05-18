import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  projectPriorityConfig,
  projectStatusConfig,
  type ProjectItem,
} from './projects-data';

interface ProjectsGridProps {
  projects: ProjectItem[];
  getProjectHref?: (projectSlug: string) => string;
}

export function ProjectsGrid({ projects, getProjectHref }: ProjectsGridProps) {
  const statusT = useTranslations('project.statusBadge');
  const priorityT = useTranslations('project.priorityBadge');
  const t = useTranslations('project.grid');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const projectRouteSegment = project.slug ?? project.id;

        return (
          <Link
            key={project.id}
            href={
              getProjectHref
                ? getProjectHref(projectRouteSegment)
                : `/projects/${projectRouteSegment}`
            }
          >
            <Card className="group hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className={projectStatusConfig[project.status].color}>
                        {statusT(project.status)}
                      </Badge>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          projectPriorityConfig[project.priority].color,
                        )}
                      >
                        {priorityT(project.priority)}
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-primary text-lg transition-colors">
                      {project.name}
                    </CardTitle>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                  {project.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('progress')}</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t('tasksCompleted', {
                      completed: project.tasksCompleted,
                      total: project.tasksTotal,
                    })}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-muted-foreground text-xs">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {project.dueDate}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
