import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MemberDto, RoleDto } from '@/services/organizations/types';

function RoleList({ roles }: { roles: RoleDto[] }) {
  if (roles.length === 0) return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <Badge key={role.id} variant="secondary" className="capitalize">
          {role.name}
        </Badge>
      ))}
    </div>
  );
}

function formatDateTime(value?: string): string {
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

interface OrganizationMemberDetailsSheetProps {
  member: MemberDto | null;
  open: boolean;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationMemberDetailsSheet({
  member,
  open,
  isPending,
  isError,
  errorMessage,
  onOpenChange,
}: Readonly<OrganizationMemberDetailsSheetProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {isPending && (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        )}

        {isError && (
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTitle>Failed to load member details</AlertTitle>
              <AlertDescription>{errorMessage ?? 'Unknown error.'}</AlertDescription>
            </Alert>
          </div>
        )}

        {!isPending && !isError && member && (
          <>
            <DialogHeader>
              <DialogTitle>{member.email}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              {/* User Profile section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">User Profile</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="font-medium">
                      {[member.firstName, member.lastName].filter(Boolean).join(' ') || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{member.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{member.phone ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-medium">{formatDateTime(member.dateOfBirth ?? undefined)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">User Active</span>
                    <Badge variant={member.userIsActive ? 'default' : 'secondary'}>
                      {member.userIsActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">User Verified</span>
                    <Badge variant={member.userIsVerified ? 'default' : 'secondary'}>
                      {member.userIsVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Organization Membership section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Organization Membership</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Organization ID</span>
                    <span className="max-w-[60%] truncate text-right font-mono text-xs">
                      {member.organizationId || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="max-w-[60%] truncate text-right font-mono text-xs">
                      {member.userId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Invited By</span>
                    <span className="max-w-[60%] truncate text-right font-mono text-xs">
                      {member.invitedBy ?? '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Membership Active</span>
                    <Badge variant={member.isActive ? 'default' : 'secondary'}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Joined At</span>
                    <span className="font-medium">{formatDateTime(member.joinedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Invitation Accepted At</span>
                    <span className="font-medium">
                      {formatDateTime(member.invitationAcceptedAt ?? undefined)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Left At</span>
                    <span className="font-medium">{formatDateTime(member.leftAt ?? undefined)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Created At</span>
                    <span className="font-medium">{formatDateTime(member.createdAt)}</span>
                  </div>
                </div>
              </div>

              {member.roles && member.roles.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Roles</h3>
                    <RoleList roles={member.roles} />
                  </div>
                </>
              )}
            </div>

            <DialogFooter showCloseButton />
          </>
        )}

        {!isPending && !isError && !member && (
          <div className="py-4">
            <Alert>
              <AlertTitle>No member selected</AlertTitle>
              <AlertDescription>Select a member to view details.</AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
