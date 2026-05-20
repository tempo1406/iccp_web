import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Hash, Lock } from 'lucide-react';
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
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { type TeamChatProjectOption } from '../lib/team-chat-scope.shared';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import { TeamChatRoomScopeFilter } from './team-chat-room-scope-filter';

type ChannelVisibility = 'public' | 'private';
type RoomScope = 'organization' | 'project';

interface CreateChannelForm {
  name: string;
  topic: string;
  description: string;
  visibility: ChannelVisibility;
  contextScope: RoomScope;
  contextId: string;
}

interface TeamChatCreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    topic?: string;
    description?: string;
    visibility: ChannelVisibility;
    contextScope: RoomScope;
    contextId?: string;
  }) => Promise<boolean> | boolean;
  defaultScope: RoomScope;
  defaultProjectId: string;
  projects: TeamChatProjectOption[];
  loadingProjects: boolean;
  projectErrorMessage?: string | null;
}

function createInitialForm(defaultScope: RoomScope, defaultProjectId: string): CreateChannelForm {
  return {
    name: '',
    topic: '',
    description: '',
    visibility: 'private',
    contextScope: defaultScope,
    contextId: defaultProjectId,
  };
}

export function TeamChatCreateChannelDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultScope,
  defaultProjectId,
  projects,
  loadingProjects,
  projectErrorMessage,
}: TeamChatCreateChannelDialogProps) {
  const t = useTranslations('teamChat');
  const [form, setForm] = useState<CreateChannelForm>(() =>
    createInitialForm(defaultScope, defaultProjectId),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleDialogOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) return;
    setForm(createInitialForm(defaultScope, defaultProjectId));
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    const normalizedName = form.name.trim();
    if (!normalizedName) return;

    if (form.contextScope === 'project' && !form.contextId.trim()) {
      toast.warning(t('createChannel.projectRequired'));
      return;
    }

    setIsSubmitting(true);
    const created = await onSubmit({
      name: normalizedName,
      visibility: form.visibility,
      topic: form.topic.trim() || undefined,
      description: form.description.trim() || undefined,
      contextScope: form.contextScope,
      contextId: form.contextScope === 'project' ? form.contextId.trim() || undefined : undefined,
    });
    setIsSubmitting(false);

    if (created) {
      handleDialogOpenChange(false);
    }
  };

  const submitDisabled =
    !form.name.trim() ||
    isSubmitting ||
    (form.contextScope === 'project' && !form.contextId.trim());

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{t('createChannel.title')}</DialogTitle>
          <DialogDescription>
            {t('createChannel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-channel-name">{t('createChannel.name')}</Label>
            <Input
              id="create-channel-name"
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, name: event.target.value }))
              }
              placeholder={t('createChannel.namePlaceholder')}
              className="h-11 rounded-xl"
              autoFocus
            />
          </div>

          <TeamChatRoomScopeFilter
            mode="dialog"
            scope={form.contextScope}
            projectId={form.contextId}
            projects={projects}
            loadingProjects={loadingProjects}
            projectErrorMessage={projectErrorMessage}
            onScopeChange={(contextScope) =>
              setForm((previous) => ({
                ...previous,
                contextScope,
                contextId: contextScope === 'project' ? previous.contextId || defaultProjectId : '',
              }))
            }
            onProjectChange={(contextId) =>
              setForm((previous) => ({
                ...previous,
                contextId,
              }))
            }
            hint={
              form.contextScope === 'project'
                ? t('createChannel.projectHint')
                : t('createChannel.organizationHint')
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-channel-visibility">{t('createChannel.visibility')}</Label>
              <Select
                value={form.visibility}
                onValueChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    visibility: value as ChannelVisibility,
                  }))
                }
              >
                <SelectTrigger id="create-channel-visibility" className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <span className="inline-flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('createChannel.private')}
                    </span>
                  </SelectItem>
                  <SelectItem value="public">
                    <span className="inline-flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      {t('createChannel.public')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-channel-topic">{t('createChannel.topic')}</Label>
              <Input
                id="create-channel-topic"
                value={form.topic}
                onChange={(event) =>
                  setForm((previous) => ({ ...previous, topic: event.target.value }))
                }
                placeholder={t('createChannel.topicPlaceholder')}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-channel-description">{t('createChannel.descriptionLabel')}</Label>
            <textarea
              id="create-channel-description"
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              rows={4}
              placeholder={t('createChannel.descriptionPlaceholder')}
              className={cn(
                'border-input bg-background ring-offset-background flex min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm outline-none',
                focusRingClass,
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={submitDisabled}
            className="cursor-pointer rounded-xl"
          >
            {isSubmitting ? t('createChannel.creating') : t('createChannel.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

