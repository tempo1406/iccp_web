'use client';

import { Loader2, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import type {
  TicketRequestDetail,
  TicketRequestUserSummary,
} from '../../../../services/ticket/types/ticket-request.types';
import type { TicketRequestMemberOption } from '../hooks/use-ticket-requests';
import { EmptyPanelState } from './ticket-request-detail-shared';
import { formatTicketUser } from './ticket-request-utils';

interface ResolvedCcMemberEntry {
  raw: TicketRequestDetail['ccMembers'][number];
  member: TicketRequestUserSummary;
}

interface TicketRequestCcTabProps {
  ticketId: string;
  resolvedCcMembers: ResolvedCcMemberEntry[];
  memberOptionMap: Map<string, TicketRequestMemberOption>;
  actionCanManageCc: boolean;
  isUpdatingCc: boolean;
  ccCandidates: TicketRequestMemberOption[];
  selectedCcCandidateIds: string[];
  onToggleCcCandidate: (memberId: string, checked: boolean) => void;
  onAddCcMembers: () => void;
  onRemoveCcMember: (ticketId: string, memberId: string) => Promise<{ ok: boolean }>;
}

export function TicketRequestCcTab({
  ticketId,
  resolvedCcMembers,
  memberOptionMap,
  actionCanManageCc,
  isUpdatingCc,
  ccCandidates,
  selectedCcCandidateIds,
  onToggleCcCandidate,
  onAddCcMembers,
  onRemoveCcMember,
}: TicketRequestCcTabProps) {
  const t = useTranslations('ticket');

  return (
    <TabsContent value="cc" className="mt-5">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        {/* Current CC Members */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {t('ccTab.members', { count: resolvedCcMembers.length })}
          </p>
          {resolvedCcMembers.length === 0 ? (
            <EmptyPanelState
              icon={Users}
              title={t('ccTab.emptyTitle')}
              description={t('ccTab.emptyDescription')}
            />
          ) : (
            <ScrollArea className="max-h-[44vh]">
              <div className="divide-y divide-border/60">
                {resolvedCcMembers.map((entry) => {
                  const isOrgAdminCc =
                    memberOptionMap.get(entry.member.id)?.isOrganizationAdmin === true ||
                    entry.raw.isDefault === true;

                  return (
                    <div
                      key={entry.member.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {formatTicketUser(entry.member)}
                          </span>
                          {isOrgAdminCc ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700 dark:border-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                              <ShieldCheck className="h-3 w-3" />
                              {t('ccTab.orgAdmin')}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.member.email}</p>
                      </div>

                      {actionCanManageCc && !isOrgAdminCc ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={isUpdatingCc}
                          onClick={() => void onRemoveCcMember(ticketId, entry.member.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Add Members */}
        {actionCanManageCc && ccCandidates.length > 0 ? (
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">{t('ccTab.addToCc')}</p>
            <ScrollArea className="max-h-[32vh]">
              <div className="divide-y divide-border/60">
                {ccCandidates.map((member) => (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center gap-3 py-2.5"
                  >
                    <Checkbox
                      checked={selectedCcCandidateIds.includes(member.id)}
                      onCheckedChange={(value) => onToggleCcCandidate(member.id, value === true)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{member.label}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>

            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              disabled={selectedCcCandidateIds.length === 0 || isUpdatingCc}
              onClick={onAddCcMembers}
            >
              {isUpdatingCc ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t('ccTab.addSelected')}
            </Button>
          </div>
        ) : null}
      </div>
    </TabsContent>
  );
}
