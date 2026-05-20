'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type CreateTaskFormState,
  TASK_PRIORITY_OPTIONS,
  type ProjectTaskStatusOption,
  useCreateProjectTaskDialog,
} from '../hooks/use-create-project-task-dialog';

interface CreateProjectTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  statuses: ProjectTaskStatusOption[];
  defaultStatusId?: string;
}

export function CreateProjectTaskDialog({
  open,
  onOpenChange,
  projectId,
  statuses,
  defaultStatusId,
}: CreateProjectTaskDialogProps) {
  const t = useTranslations('project');
  const {
    formState,
    errors,
    submitError,
    hasStatuses,
    isSubmitting,
    setField,
    resetForm,
    handleOpenChange,
    handleSubmit,
  } = useCreateProjectTaskDialog({
    onOpenChange,
    projectId,
    statuses,
    defaultStatusId,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl" onOpenAutoFocus={resetForm}>
        <DialogHeader>
          <DialogTitle>{t('taskCreateDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('taskCreateDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">{t('taskCreateDialog.fields.title')}</Label>
              <Input
                id="task-title"
                value={formState.title}
                onChange={(event) => setField('title', event.target.value)}
                placeholder={t('taskCreateDialog.placeholders.title')}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-description">{t('taskCreateDialog.fields.description')}</Label>
              <Textarea
                id="task-description"
                value={formState.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder={t('taskCreateDialog.placeholders.description')}
                className="min-h-22.5"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('taskCreateDialog.fields.status')}</Label>
              <Select
                value={formState.statusId}
                onValueChange={(value) => setField('statusId', value)}
              >
                <SelectTrigger aria-invalid={Boolean(errors.statusId)}>
                  <SelectValue placeholder={t('taskCreateDialog.placeholders.status')} />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.statusId && <p className="text-destructive text-xs">{errors.statusId}</p>}
              {!hasStatuses && (
                <p className="text-muted-foreground text-xs">
                  {t('taskCreateDialog.emptyStatus')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('taskCreateDialog.fields.priority')}</Label>
              <Select
                value={formState.priority}
                onValueChange={(value) =>
                  setField('priority', value as CreateTaskFormState['priority'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('taskCreateDialog.placeholders.priority')} />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`dashboard.priority.${option.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-assigned-to">{t('taskCreateDialog.fields.assignedTo')}</Label>
              <Input
                id="task-assigned-to"
                value={formState.assignedTo}
                onChange={(event) => setField('assignedTo', event.target.value)}
                placeholder={t('taskCreateDialog.placeholders.assignedTo')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-parent-id">{t('taskCreateDialog.fields.parentTaskId')}</Label>
              <Input
                id="task-parent-id"
                value={formState.parentTaskId}
                onChange={(event) => setField('parentTaskId', event.target.value)}
                placeholder={t('taskCreateDialog.placeholders.parentTaskId')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-due-date">{t('taskCreateDialog.fields.dueDate')}</Label>
              <DatePicker
                id="task-due-date"
                value={formState.dueDate}
                onChange={(value) => setField('dueDate', value)}
                placeholder={t('taskCreateDialog.placeholders.dueDate')}
              />
              {errors.dueDate && <p className="text-destructive text-xs">{errors.dueDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-estimated-point">{t('taskCreateDialog.fields.storyPoints')}</Label>
              <Input
                id="task-estimated-point"
                type="number"
                min="0"
                step="1"
                value={formState.estimatedPoint}
                onChange={(e) => setField('estimatedPoint', e.target.value)}
                placeholder={t('taskCreateDialog.placeholders.storyPoints')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-estimated-hours">{t('taskCreateDialog.fields.estimatedHours')}</Label>
              <Input
                id="task-estimated-hours"
                type="number"
                min="0"
                step="0.5"
                value={formState.estimatedHours}
                onChange={(e) => setField('estimatedHours', e.target.value)}
                placeholder={t('taskCreateDialog.placeholders.estimatedHours')}
              />
            </div>
          </div>

          {submitError && <p className="text-destructive text-sm">{submitError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !hasStatuses}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('taskCreateDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
