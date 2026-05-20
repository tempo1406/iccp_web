import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, MoreVertical, UserCheck, UserRoundMinus } from 'lucide-react';
import type { MemberDto } from '@/services/organizations/types';

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

interface OrganizationMembersTableProps {
  members: MemberDto[];
  canUpdateMembers: boolean;
  canRemoveMembers: boolean;
  isUpdatingStatus: boolean;
  getMemberDisplayName: (userId?: string | null) => string;
  onViewDetails: (member: MemberDto) => void;
  onToggleMemberStatus: (member: MemberDto, nextIsActive: boolean) => void;
  onRemoveMember: (member: MemberDto) => void;
}

export function OrganizationMembersTable({
  members,
  canUpdateMembers,
  canRemoveMembers,
  isUpdatingStatus,
  getMemberDisplayName,
  onViewDetails,
  onToggleMemberStatus,
  onRemoveMember,
}: OrganizationMembersTableProps) {
  const getInitials = (member: MemberDto) => {
    const fullName = [member.firstName, member.lastName].filter(Boolean).join(' ').trim();
    if (fullName.length === 0) return 'MB';
    const words = fullName.split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined At</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead className="w-[56px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-10 text-center">
                No members found with current filters.
              </TableCell>
            </TableRow>
          )}

          {members.map((member) => (
            <TableRow key={member.userId} className="hover:bg-muted/40">
              <TableCell>
                <button
                  type="button"
                  className="max-w-[320px] text-left"
                  onClick={() => onViewDetails(member)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl ?? undefined} alt={member.email} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(member)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="truncate font-medium">
                        {[member.firstName, member.lastName].filter(Boolean).join(' ') || '-'}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{member.email}</p>
                    </div>
                  </div>
                </button>
              </TableCell>
              <TableCell>
                <Badge variant={member.isActive ? 'default' : 'secondary'}>
                  {member.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(member.joinedAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getMemberDisplayName(member.invitedBy)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(member)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canUpdateMembers || isUpdatingStatus}
                      onClick={() => onToggleMemberStatus(member, !member.isActive)}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      {member.isActive ? 'Set Inactive' : 'Set Active'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!canRemoveMembers}
                      onClick={() => onRemoveMember(member)}
                      className="text-destructive"
                    >
                      <UserRoundMinus className="mr-2 h-4 w-4" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
