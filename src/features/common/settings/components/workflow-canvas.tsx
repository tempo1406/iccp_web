import Link from 'next/link';
import { ChevronRight, Edit, GripVertical, Play, Plus, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { WorkflowStep } from './workflow-data';

interface WorkflowCanvasProps {
  currentWorkflowName?: string;
  steps: WorkflowStep[];
  selectedStepId: number | null;
  onSelectStep: (id: number) => void;
}

export function WorkflowCanvas({
  currentWorkflowName,
  steps,
  selectedStepId,
  onSelectStep,
}: WorkflowCanvasProps) {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col overflow-hidden">
      <div className="bg-background/50 flex shrink-0 flex-wrap items-center justify-between gap-4 border-b px-8 py-5 backdrop-blur-sm">
        <div>
          <nav className="text-muted-foreground mb-1 flex items-center text-sm">
            <Link href="/settings" className="hover:text-primary">
              Settings
            </Link>
            <ChevronRight className="mx-2 h-3 w-3" />
            <Link href="/settings/workflow" className="hover:text-primary">
              Workflows
            </Link>
            <ChevronRight className="mx-2 h-3 w-3" />
            <span className="text-foreground font-medium">{currentWorkflowName}</span>
          </nav>
          <h1 className="text-2xl font-bold">IT Security Approval Chain</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure approval steps for documents tagged as High Security.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Test Workflow
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto p-10">
        <div className="flex w-full max-w-3xl flex-col items-center pb-20">
          {steps.map((step, index) => (
            <div key={step.id} className="group relative w-full">
              {index > 0 && (
                <div className="bg-border absolute -top-4 left-1/2 mx-auto h-4 w-0.5 -translate-x-1/2" />
              )}

              <Card
                className={`relative z-10 w-full cursor-pointer transition-all ${
                  selectedStepId === step.id
                    ? 'ring-primary shadow-lg ring-2'
                    : 'hover:shadow-md'
                } ${
                  step.type === 'rule'
                    ? 'border-primary/20 bg-primary/5 dark:border-primary/25 dark:bg-primary/10'
                    : ''
                }`}
                onClick={() => onSelectStep(step.id)}
              >
                <div className="text-muted-foreground hover:text-foreground absolute top-1/2 -left-8 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100">
                  <GripVertical className="h-5 w-5" />
                </div>

                <CardContent className="flex items-start gap-4 p-5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${step.iconBg} ${step.iconColor}`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{step.name}</h4>
                        {step.badge && (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${
                              step.type === 'rule'
                                ? 'bg-primary/10 text-primary dark:bg-primary/15'
                                : ''
                            }`}
                          >
                            {step.badge}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-primary h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>

                    {step.condition && (
                      <div className="bg-muted text-muted-foreground mt-2 inline-block rounded border p-2 text-sm">
                        {step.condition}
                      </div>
                    )}

                    {step.assignee && (
                      <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
                        <span>
                          Assignee:{' '}
                          <span className="text-foreground font-medium">
                            {step.assignee}
                          </span>
                        </span>
                        <span>
                          SLA:{' '}
                          <span className="text-foreground font-medium">{step.sla}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {index < steps.length - 1 && (
                <div className="bg-border mx-auto h-8 w-0.5" />
              )}

              {index < steps.length - 1 && (
                <button className="group border-muted-foreground/30 bg-background text-muted-foreground hover:border-primary hover:text-primary relative z-20 mx-auto -my-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed shadow-sm transition-all hover:scale-110">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          <div className="mt-4">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Final Step
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
