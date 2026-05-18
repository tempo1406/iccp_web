'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

export type ProjectHeaderFilterGroupKey = 'assignee' | 'tags' | 'status' | 'priority';

export interface ProjectHeaderTaskFilterOption {
  value: string;
  label: string;
  avatarUrl?: string;
}

interface UseProjectDetailHeaderFiltersParams {
  assigneeFilterOptions: ProjectHeaderTaskFilterOption[];
  tagFilterOptions: ProjectHeaderTaskFilterOption[];
  statusFilterOptions: ProjectHeaderTaskFilterOption[];
  priorityFilterOptions: ProjectHeaderTaskFilterOption[];
  selectedAssigneeFilters: string[];
  selectedTagFilters: string[];
  selectedStatusFilters: string[];
  selectedPriorityFilters: string[];
  onToggleAssigneeFilter: (value: string) => void;
  onToggleTagFilter: (value: string) => void;
  onToggleStatusFilter: (value: string) => void;
  onTogglePriorityFilter: (value: string) => void;
  onClearAssigneeFilters: () => void;
  onClearTagFilters: () => void;
  onClearStatusFilters: () => void;
  onClearPriorityFilters: () => void;
}

export function useProjectDetailHeaderFilters({
  assigneeFilterOptions,
  tagFilterOptions,
  statusFilterOptions,
  priorityFilterOptions,
  selectedAssigneeFilters,
  selectedTagFilters,
  selectedStatusFilters,
  selectedPriorityFilters,
  onToggleAssigneeFilter,
  onToggleTagFilter,
  onToggleStatusFilter,
  onTogglePriorityFilter,
  onClearAssigneeFilters,
  onClearTagFilters,
  onClearStatusFilters,
  onClearPriorityFilters,
}: UseProjectDetailHeaderFiltersParams) {
  const t = useTranslations('project.detailHeader.filters');
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [activeFilterGroup, setActiveFilterGroup] = useState<ProjectHeaderFilterGroupKey>('assignee');
  const [filterSearch, setFilterSearch] = useState('');
  const filterGroups = useMemo(
    () => [
      { key: 'assignee' as const, label: t('assignee.label'), searchPlaceholder: t('assignee.searchPlaceholder') },
      { key: 'tags' as const, label: t('tags.label'), searchPlaceholder: t('tags.searchPlaceholder') },
      { key: 'status' as const, label: t('status.label'), searchPlaceholder: t('status.searchPlaceholder') },
      { key: 'priority' as const, label: t('priority.label'), searchPlaceholder: t('priority.searchPlaceholder') },
    ],
    [t],
  );

  const selectedCount =
    selectedAssigneeFilters.length +
    selectedTagFilters.length +
    selectedStatusFilters.length +
    selectedPriorityFilters.length;

  const activeGroupConfig =
    filterGroups.find((item) => item.key === activeFilterGroup) ??
    filterGroups[0];

  const activeOptions = useMemo(() => {
    if (activeFilterGroup === 'assignee') return assigneeFilterOptions;
    if (activeFilterGroup === 'tags') return tagFilterOptions;
    if (activeFilterGroup === 'status') return statusFilterOptions;
    return priorityFilterOptions;
  }, [
    activeFilterGroup,
    assigneeFilterOptions,
    tagFilterOptions,
    statusFilterOptions,
    priorityFilterOptions,
  ]);

  const activeSelected = useMemo(() => {
    if (activeFilterGroup === 'assignee') return new Set(selectedAssigneeFilters);
    if (activeFilterGroup === 'tags') return new Set(selectedTagFilters);
    if (activeFilterGroup === 'status') return new Set(selectedStatusFilters);
    return new Set(selectedPriorityFilters);
  }, [
    activeFilterGroup,
    selectedAssigneeFilters,
    selectedTagFilters,
    selectedStatusFilters,
    selectedPriorityFilters,
  ]);

  const filteredOptions = useMemo(() => {
    const keyword = filterSearch.trim().toLowerCase();
    if (!keyword) return activeOptions;
    return activeOptions.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [activeOptions, filterSearch]);

  const handleToggleOption = (value: string) => {
    if (activeFilterGroup === 'assignee') {
      onToggleAssigneeFilter(value);
      return;
    }
    if (activeFilterGroup === 'tags') {
      onToggleTagFilter(value);
      return;
    }
    if (activeFilterGroup === 'status') {
      onToggleStatusFilter(value);
      return;
    }
    onTogglePriorityFilter(value);
  };

  const handleClearActiveGroup = () => {
    if (activeFilterGroup === 'assignee') {
      onClearAssigneeFilters();
      return;
    }
    if (activeFilterGroup === 'tags') {
      onClearTagFilters();
      return;
    }
    if (activeFilterGroup === 'status') {
      onClearStatusFilters();
      return;
    }
    onClearPriorityFilters();
  };

  const handleFilterOpenChange = (open: boolean) => {
    setFilterOpen(open);
    if (!open) {
      setFilterSearch('');
    }
  };

  const handleSelectFilterGroup = (group: ProjectHeaderFilterGroupKey) => {
    setActiveFilterGroup(group);
    setFilterSearch('');
  };

  return {
    isFilterOpen,
    activeFilterGroup,
    filterSearch,
    selectedCount,
    activeGroupConfig,
    activeOptions,
    activeSelected,
    filteredOptions,
    filterGroups,
    setFilterSearch,
    handleToggleOption,
    handleClearActiveGroup,
    handleFilterOpenChange,
    handleSelectFilterGroup,
  };
}
