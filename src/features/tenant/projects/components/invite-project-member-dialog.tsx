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
import { Label } from '@/components/ui/label';
import { MemberMultiSelect } from '@/features/common/notifications/components/member-multi-select';
import {
  useInviteProjectMemberDialog,
} from '../hooks/use-invite-project-member-dialog';

interface InviteProjectMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectMemberUserIds?: string[];
  isProjectMembersPending?: boolean;
  projectMembersErrorMessage?: string | null;
}

export function InviteProjectMemberDialog({
  open,
  onOpenChange,
  projectId,
  projectMemberUserIds = [],
  isProjectMembersPending = false,
  projectMembersErrorMessage = null,
}: InviteProjectMemberDialogProps) {
  const t = useTranslations('project.inviteMemberDialog');
  const commonT = useTranslations('project.common');
  const {
    selectedUserIds,
    setSelectedUserIds,
    memberSearch,
    setMemberSearch,
    availableMembers,
    error,
    isLoadingMembers,
    membersErrorMessage,
    hasSelectableMembers,
    isSubmitting,
    handleOpenChange,
    handleSubmit,
  } = useInviteProjectMemberDialog({
    onOpenChange,
    projectId,
    projectMemberUserIds,
    isProjectMembersPending,
    projectMembersErrorMessage,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-member-user-ids">{t('fields.organizationMembers')}</Label>
            <div id="invite-member-user-ids" aria-invalid={Boolean(error)}>
              <MemberMultiSelect
                members={availableMembers}
                selectedUserIds={selectedUserIds}
                search={memberSearch}
                onSearchChange={setMemberSearch}
                isLoading={isLoadingMembers}
                disabled={isLoadingMembers || Boolean(membersErrorMessage) || !hasSelectableMembers}
                onChange={setSelectedUserIds}
              />
            </div>
            {isLoadingMembers && (
              <p className="text-muted-foreground text-xs">{t('states.loading')}</p>
            )}
            {membersErrorMessage && (
              <p className="text-destructive text-xs">
                {membersErrorMessage}
              </p>
            )}
            {!isLoadingMembers && !membersErrorMessage && !hasSelectableMembers && (
              <p className="text-muted-foreground text-xs">
                {t('states.allAdded')}
              </p>
            )}
            {!isLoadingMembers && !membersErrorMessage && selectedUserIds.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {t('states.selectedCount', { count: selectedUserIds.length })}
              </p>
            )}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {commonT('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isLoadingMembers ||
                Boolean(membersErrorMessage) ||
                !hasSelectableMembers
              }
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
