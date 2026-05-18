import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { BellRing, XCircle } from 'lucide-react';
import type { OrganizationInvitation } from '../hooks/use-organization-invitations';

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function InvitationStatusBadge({ invitation }: Readonly<{ invitation: OrganizationInvitation }>) {
  if (invitation.status === 'pending' && invitation.isExpired) {
    return <Badge className="bg-orange-500/10 text-orange-600">Expired</Badge>;
  }

  if (invitation.status === 'pending') {
    return <Badge className="bg-amber-500/10 text-amber-600">Pending</Badge>;
  }

  if (invitation.status === 'accepted') {
    return <Badge className="bg-emerald-500/10 text-emerald-600">Accepted</Badge>;
  }

  if (invitation.status === 'expired') {
    return <Badge className="bg-orange-500/10 text-orange-600">Expired</Badge>;
  }

  return <Badge className="bg-rose-500/10 text-rose-600">Cancelled</Badge>;
}

function hasRichTextContent(value?: string | null): boolean {
  if (!value) return false;
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length > 0;
}

interface InviteMemberDetailsSheetProps {
  invitation: OrganizationInvitation | null;
  open: boolean;
  isLoading: boolean;
  canResend: boolean;
  canCancel: boolean;
  getOrganizationName: (organizationId: string) => string;
  getInviterName: (invitedBy: string) => string;
  onOpenChange: (open: boolean) => void;
  onResend: (invitationId: string) => void;
  onCancel: (invitationId: string) => void;
}

export function InviteMemberDetailsSheet({
  invitation,
  open,
  isLoading,
  canResend,
  canCancel,
  getOrganizationName,
  getInviterName,
  onOpenChange,
  onResend,
  onCancel,
}: Readonly<InviteMemberDetailsSheetProps>) {
  const canOperatePending = Boolean(
    invitation?.status === 'pending' && !invitation?.isExpired,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Invitation Details</DialogTitle>
          <DialogDescription>
            Review invitation metadata and run supported actions.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-2">
            {['email', 'org', 'inviter', 'created', 'expires', 'accepted'].map((key) => (
              <Skeleton key={key} className="h-6 w-full" />
            ))}
          </div>
        )}

        {!isLoading && !invitation && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Invitation details are not available.
          </p>
        )}

        {!isLoading && invitation && (
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{invitation.email}</span>
              <InvitationStatusBadge invitation={invitation} />
            </div>

            <Separator />

            {/* Details grid */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Organization</span>
                <span className="max-w-[60%] truncate font-medium">
                  {getOrganizationName(invitation.organizationId)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Invited By</span>
                <span className="max-w-[60%] truncate font-medium">
                  {getInviterName(invitation.invitedBy)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Invitation Note</span>
                <div className="max-w-[60%] text-right font-medium">
                  {hasRichTextContent(invitation.message) ? (
                    <div
                      className="prose prose-sm max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1"
                      dangerouslySetInnerHTML={{ __html: invitation.message ?? '' }}
                    />
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-medium">{formatDateTime(invitation.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Expires At</span>
                <span className="font-medium">{formatDateTime(invitation.expiresAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Accepted At</span>
                <span className="font-medium">{formatDateTime(invitation.acceptedAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Is Expired</span>
                <span className="font-medium">{invitation.isExpired ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                disabled={!canResend || !canOperatePending}
                onClick={() => onResend(invitation.id)}
              >
                <BellRing className="mr-2 h-4 w-4" />
                Resend Invitation
              </Button>
              <Button
                variant="destructive"
                disabled={!canCancel || !canOperatePending}
                onClick={() => onCancel(invitation.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Invitation
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
