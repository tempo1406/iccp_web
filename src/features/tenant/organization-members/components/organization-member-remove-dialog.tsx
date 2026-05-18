import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { MemberDto } from '@/services/organizations/types';

interface OrganizationMemberRemoveDialogProps {
  open: boolean;
  target: MemberDto | null;
  isSaving: boolean;
  isRemoving: boolean;
  canRemoveMembers: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationMemberRemoveDialog({
  open,
  target,
  isSaving,
  isRemoving,
  canRemoveMembers,
  onConfirm,
  onOpenChange,
}: Readonly<OrganizationMemberRemoveDialogProps>) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove <span className="font-medium">{target?.email ?? 'this user'}</span>{' '}
            from the organization and revoke organization-scoped roles.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSaving || !canRemoveMembers}>
            {isRemoving ? 'Removing...' : 'Remove Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
