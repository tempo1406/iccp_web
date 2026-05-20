'use client';

import { useState } from 'react';
import { FolderKanban } from 'lucide-react';
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

type ProjectStatus = 'active' | 'completed' | 'cancelled' | 'on_hold';

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    description?: string;
    status?: ProjectStatus;
  }) => Promise<boolean> | boolean;
}

function createInitialForm() {
  return {
    name: '',
    description: '',
    status: 'active' as ProjectStatus,
  };
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onSubmit,
}: ProjectCreateDialogProps) {
  const t = useTranslations('project.quickCreateDialog');
  const commonT = useTranslations('project.common');
  const statusT = useTranslations('project.detail.status');
  const [form, setForm] = useState(createInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) return;
    setForm(createInitialForm());
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    const normalizedName = form.name.trim();
    if (!normalizedName) return;

    setIsSubmitting(true);
    const created = await onSubmit({
      name: normalizedName,
      description: form.description.trim() || undefined,
      status: form.status,
    });
    setIsSubmitting(false);

    if (created) {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-create-name">{t('fields.name')}</Label>
            <Input
              id="project-create-name"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder={t('placeholders.name')}
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <div className="space-y-2">
              <Label htmlFor="project-create-description">{t('fields.description')}</Label>
              <Textarea
                id="project-create-description"
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder={t('placeholders.description')}
                rows={4}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-create-status">{t('fields.status')}</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    status: value as ProjectStatus,
                  }))
                }
              >
                <SelectTrigger id="project-create-status" className="h-11 cursor-pointer rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="cursor-pointer rounded-lg">
                    {statusT('active')}
                  </SelectItem>
                  <SelectItem value="on_hold" className="cursor-pointer rounded-lg">
                    {statusT('on_hold')}
                  </SelectItem>
                  <SelectItem value="completed" className="cursor-pointer rounded-lg">
                    {statusT('completed')}
                  </SelectItem>
                  <SelectItem value="cancelled" className="cursor-pointer rounded-lg">
                    {statusT('cancelled')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl"
          >
            {commonT('cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!form.name.trim() || isSubmitting}
            className="cursor-pointer rounded-xl"
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
