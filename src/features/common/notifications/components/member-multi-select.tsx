'use client';

import { useMemo, useState, type WheelEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronsUpDown } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { MemberDto } from '@/services/organizations/types';

interface MemberMultiSelectProps {
  members: MemberDto[];
  selectedUserIds: string[];
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  onChange: (userIds: string[]) => void;
}

function getDisplayName(m: MemberDto) {
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ');
  return full || m.email;
}

function getMemberInitials(m: MemberDto) {
  const name = [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email;
  return getInitials(name);
}

function handleScrollableListWheel(event: WheelEvent<HTMLDivElement>) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.scrollTop += event.deltaY;
}

export function MemberMultiSelect({
  members,
  selectedUserIds,
  search,
  onSearchChange,
  isLoading,
  disabled,
  onChange,
}: MemberMultiSelectProps) {
  const t = useTranslations('notifications.memberMultiSelect');
  const [open, setOpen] = useState(false);

  const selectedCount = selectedUserIds.length;
  const selectedLabel = useMemo(() => {
    const selected = members.filter((m) => selectedUserIds.includes(m.userId));
    if (selected.length === 0) {
      return selectedCount > 0 ? t('selectedCount', { count: selectedCount }) : t('selectMembers');
    }
    const names = selected.map(getDisplayName);
    return names.length <= 2
      ? names.join(', ')
      : `${names.slice(0, 2).join(', ')} ${t('more', { count: names.length - 2 })}`;
  }, [members, selectedUserIds, selectedCount, t]);

  function toggle(userId: string) {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="h-auto min-h-9 w-full justify-between font-normal"
        >
          <span className="truncate text-left text-sm">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-2"
        align="start"
      >
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mb-2 h-8 text-sm"
          autoFocus
        />
        <div
          className="max-h-56 overflow-y-auto overscroll-contain pr-1"
          onWheelCapture={handleScrollableListWheel}
        >
          {isLoading ? (
            <div className="space-y-1.5 px-1 py-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              {search.trim() ? t('noMembersFound') : t('typeToSearch')}
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.userId}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
                onClick={() => toggle(m.userId)}
              >
                <Checkbox
                  checked={selectedUserIds.includes(m.userId)}
                  onCheckedChange={() => toggle(m.userId)}
                />
                <Avatar className="h-6 w-6">
                  {m.avatarUrl && <AvatarImage src={m.avatarUrl} />}
                  <AvatarFallback className="text-[10px]">{getMemberInitials(m)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{getDisplayName(m)}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{m.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
        {selectedCount > 0 && (
          <div className="mt-1 border-t pt-1">
            <button
              type="button"
              className="w-full rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
              onClick={() => onChange([])}
            >
              {t('clearAll', { count: selectedCount })}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
