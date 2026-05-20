import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BellRing, Eye, MoreVertical, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
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

function InvitationStatusBadge({ invitation }: { invitation: OrganizationInvitation }) {
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

interface InviteMembersTableProps {
  invitations: OrganizationInvitation[];
  canResend: boolean;
  canCancel: boolean;
  getOrganizationName: (organizationId: string) => string;
  getInviterName: (invitedBy: string) => string;
  onViewDetails: (invitation: OrganizationInvitation) => void;
  onResend: (invitationId: string) => void;
  onCancel: (invitationId: string) => void;
}

export function InviteMembersTable({
  invitations,
  canResend,
  canCancel,
  getOrganizationName,
  getInviterName,
  onViewDetails,
  onResend,
  onCancel,
}: InviteMembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Expires At</TableHead>
          <TableHead>Accepted At</TableHead>
          <TableHead className="w-[56px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
              No invitations found with current filters.
            </TableCell>
          </TableRow>
        )}

        {invitations.map((invitation) => {
          const canOperatePending =
            invitation.status === 'pending' && !invitation.isExpired;

          return (
            <TableRow key={invitation.id} className="hover:bg-muted/40">
              <TableCell className="align-top">
                <button
                  type="button"
                  className="max-w-[260px] text-left"
                  onClick={() => onViewDetails(invitation)}
                >
                  <p className="truncate font-medium">{invitation.email}</p>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {getOrganizationName(invitation.organizationId)}
                  </p>
                </button>
              </TableCell>
              <TableCell className="align-top">
                <InvitationStatusBadge invitation={invitation} />
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[200px] truncate align-top">
                {getInviterName(invitation.invitedBy)}
              </TableCell>
              <TableCell className="text-muted-foreground align-top">
                {formatDateTime(invitation.createdAt)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-muted-foreground align-top',
                  invitation.isExpired && invitation.status === 'pending' && 'text-orange-600',
                )}
              >
                {formatDateTime(invitation.expiresAt)}
              </TableCell>
              <TableCell className="text-muted-foreground align-top">
                {formatDateTime(invitation.acceptedAt)}
              </TableCell>
              <TableCell className="align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(invitation)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canResend || !canOperatePending}
                      onClick={() => onResend(invitation.id)}
                    >
                      <BellRing className="mr-2 h-4 w-4" />
                      Resend Invitation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canCancel || !canOperatePending}
                      onClick={() => onCancel(invitation.id)}
                      className="text-destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Invitation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
