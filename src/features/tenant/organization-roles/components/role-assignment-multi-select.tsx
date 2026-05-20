'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { OrganizationRoleDto } from '@/services/organization-roles';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import React from 'react';

interface RoleAssignmentMultiSelectProps {
  roles: OrganizationRoleDto[];
  selectedRoleIds: string[];
  disabled?: boolean;
  onChange: (roleIds: string[]) => void;
}

export function RoleAssignmentMultiSelect({
  roles,
  selectedRoleIds,
  disabled,
  onChange,
}: Readonly<RoleAssignmentMultiSelectProps>) {
  const anchor = useComboboxAnchor();
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(3);

  const selectedRoles = useMemo(() => {
    return roles.filter((role) => selectedRoleIds.includes(role.id));
  }, [roles, selectedRoleIds]);

  useEffect(() => {
    if (!containerRef.current || !measureRef.current) return;

    const measure = () => {
      if (!containerRef.current || !measureRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const chips = measureRef.current.children;
      let totalWidth = 0;
      let count = 0;

      const INPUT_RESERVE = 110;

      for (let i = 0; i < chips.length; i++) {
        const chipWidth = (chips[i] as HTMLElement).offsetWidth;
        if (totalWidth + chipWidth > containerWidth - INPUT_RESERVE) {
          break;
        }
        totalWidth += chipWidth + 6;
        count++;
      }

      const limit = Math.max(1, count);
      setVisibleLimit(limit >= chips.length ? chips.length : limit);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);

    measure();

    return () => observer.disconnect();
  }, [selectedRoles]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        ref={measureRef}
        className="absolute left-0 top-0 invisible opacity-0 pointer-events-none flex gap-1.5 w-max z-[-1]"
        aria-hidden="true"
      >
        {selectedRoles.map((r) => (
          <div key={r.id} className="flex px-1.5 text-xs font-medium items-center gap-1">
            {r.name}
            <div className="w-4 h-4 ml-1" />
          </div>
        ))}
      </div>

      <Combobox
        multiple
        autoHighlight
        items={roles}
        value={selectedRoles}
        onValueChange={(vals: any) => {
          onChange((vals || []).map((r: any) => r.id));
        }}
        itemToStringLabel={(item: any) => item ? item.name : ''}
        isItemEqualToValue={(item: any, val: any) => item.id === val.id}
      >
        <ComboboxChips ref={anchor} className="w-full flex-nowrap overflow-hidden">
          <ComboboxValue>
            {(values: any) => {
              const arr = values as OrganizationRoleDto[];
              if (!arr || arr.length === 0) {
                return null;
              }
              const toShow = arr.slice(0, visibleLimit);
              const hiddenCount = arr.length - toShow.length;

              return (
                <React.Fragment>
                  {toShow.map((r) => (
                    <ComboboxChip key={r.id}>
                      {r.name}
                    </ComboboxChip>
                  ))}
                  {hiddenCount > 0 && (
                    <ComboboxChip showRemove={false}>
                      +{hiddenCount}
                    </ComboboxChip>
                  )}
                </React.Fragment>
              );
            }}
          </ComboboxValue>
          <ComboboxChipsInput
            disabled={disabled}
            placeholder={selectedRoles.length === 0 ? "Select roles to assign" : ""}
            className="min-w-[80px] w-full flex-1 text-sm bg-transparent outline-none border-none shadow-none focus-visible:ring-0"
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor} align="start" className="w-[var(--anchor-width)]">
          <ComboboxEmpty>No roles found.</ComboboxEmpty>
          <ComboboxList>
            {(item: any) => (
              <ComboboxItem key={item.id} value={item} className="flex items-center gap-2.5 px-2 py-2">
                <Checkbox
                  checked={selectedRoleIds.includes(item.id)}
                  className="pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <span className="truncate">{item.name}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
