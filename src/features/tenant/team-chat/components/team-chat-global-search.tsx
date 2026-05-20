'use client';

import {
  useDeferredValue,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Clock3,
  FileText,
  Hash,
  Loader2,
  Lock,
  MessageSquare,
  Search,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { useServiceContext } from '@/lib/use-service-context';
import { useTeamChatGlobalSearchPopover } from '../hooks/use-team-chat-global-search-popover';
import { resolveTeamChatScopeRequest } from '../lib/team-chat-scope.shared';
import { initials, presenceDotClass } from '../lib/team-chat-screen.shared';
import { useCreateTeamChatRoom } from '../query/use-team-chat';
import { TeamChatService } from '../services/team-chat.service';
import type {
  TeamChatGlobalSearchFileItemResponse,
  TeamChatGlobalSearchCountsResponse,
  TeamChatGlobalSearchMessageItemResponse,
  TeamChatGlobalSearchPersonItemResponse,
  TeamChatGlobalSearchResponseItem,
  TeamChatGlobalSearchResultsResponse,
  TeamChatGlobalSearchRoomItemResponse,
  TeamChatGlobalSearchSort,
} from '../services/types/team-chat-global-search.types';
import type { CreateTeamChatRoomBody } from '../services/types/team-chat.types';
import { useTeamChatSearchContext } from '../store';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';
import { TeamChatGlobalSearchDialog } from './team-chat-global-search-dialog';
import type {
  TeamChatGlobalSearchAction,
  TeamChatGlobalSearchPersonResult,
  TeamChatGlobalSearchScope,
  TeamChatGlobalSearchTab,
} from './team-chat-global-search.shared';
import {
  FULL_RESULTS_LIMIT,
  GLOBAL_RESULTS_ALL_LIMIT,
  MAX_RECENT_QUERIES,
  PREVIEW_LIMIT,
  SearchPreviewRow,
  SearchSection,
  SearchSkeletonList,
  buildConversationHref,
  createEmptyCounts,
  createEmptySections,
  formatTimestampLabel,
  highlightText,
  mapFileSearchItem,
  mapMessageSearchItem,
  mapPersonSearchItem,
  mapRoomSearchItem,
  mapSectionsResponse,
  persistRecentQueries,
  readRecentQueries,
  tabToApiTab,
} from './team-chat-global-search.shared';

interface TeamChatGlobalSearchProps {
  tenant: string;
  className?: string;
}

function resolveSearchErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function filterResultsByEntity<TItem extends TeamChatGlobalSearchResponseItem>(
  items: TeamChatGlobalSearchResponseItem[] | undefined,
  entityType: TItem['entityType'],
) {
  return (items ?? []).filter((item): item is TItem => item.entityType === entityType);
}

function buildPreviewHint(totalCount: number, visibleCount: number) {
  if (totalCount <= visibleCount || visibleCount <= 0) {
    return undefined;
  }

  return `${visibleCount}/${totalCount}`;
}

export function TeamChatGlobalSearch({ tenant, className }: TeamChatGlobalSearchProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const router = useRouter();
  const serviceContext = useServiceContext();
  const service = new TeamChatService(serviceContext);
  const searchContext = useTeamChatSearchContext();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isInputComposingRef = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<TeamChatGlobalSearchScope>('workspace');
  const [tab, setTab] = useState<TeamChatGlobalSearchTab>('all');
  const [sort, setSort] = useState<TeamChatGlobalSearchSort>('best_match');
  const [fileType, setFileType] = useState('all');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>(() => readRecentQueries(tenant));
  const [pendingPersonUserId, setPendingPersonUserId] = useState<string | null>(null);
  const {
    open,
    setOpen,
    suppressReopen: suppressQuickSearchReopen,
    releaseReopenBlock: releaseQuickSearchReopenBlock,
    requestOpen: requestQuickSearchOpen,
    handleOpenChange: handleQuickSearchOpenChange,
    shouldPreventCloseAutoFocus,
  } = useTeamChatGlobalSearchPopover({ inputRef });

  const deferredQuery = useDeferredValue(query.trim());
  const debouncedQuery = useDebounce(deferredQuery, 180);
  const hasSearchQuery = debouncedQuery.length >= 2;
  const canUseConversationScope = searchContext.activeRoomId.length > 0;
  const currentRoomLabel = searchContext.activeRoomName || t('globalSearch.scopeRoom');
  const effectiveScope: TeamChatGlobalSearchScope = canUseConversationScope ? scope : 'workspace';
  const scopeRequest = resolveTeamChatScopeRequest({
    scope: searchContext.scope,
    projectId: searchContext.projectId,
  });
  const apiTab = tabToApiTab(tab);
  const scopedRoomId =
    effectiveScope === 'room' ? searchContext.activeRoomId : undefined;
  const canQueryStandardResults =
    apiTab === 'all' || apiTab === 'people' || (scope === 'workspace' && apiTab === 'rooms');

  const suggestQuery = useQuery({
    queryKey: [
      'team-chat',
      'global-search',
      'suggest',
      serviceContext.tenantId,
      debouncedQuery,
      scopeRequest.contextScope,
      scopeRequest.contextId ?? '',
      searchContext.activeRoomId,
    ],
    queryFn: ({ signal }) =>
      service.searchGlobalSuggest(
        {
          q: debouncedQuery,
          limitPerSection: PREVIEW_LIMIT,
          contextScope: scopeRequest.contextScope,
          contextId: scopeRequest.contextId,
          currentRoomId: searchContext.activeRoomId || undefined,
        },
        { signal },
      ),
    enabled: open && hasSearchQuery,
    staleTime: 10_000,
    placeholderData: (previousData) => previousData,
  });

  const standardResultsQuery = useQuery({
    queryKey: [
      'team-chat',
      'global-search',
      'results',
      serviceContext.tenantId,
      apiTab,
      debouncedQuery,
      effectiveScope,
      scopeRequest.contextScope,
      scopeRequest.contextId ?? '',
      scopedRoomId ?? '',
      sort,
      fileType,
    ],
    queryFn: ({ signal }) =>
      service.searchGlobalResults(
        {
          q: debouncedQuery,
          tab: apiTab,
          limit: apiTab === 'all' ? GLOBAL_RESULTS_ALL_LIMIT : FULL_RESULTS_LIMIT,
          contextScope: scopeRequest.contextScope,
          contextId: scopeRequest.contextId,
          roomId: scopedRoomId,
          sort,
          ...(apiTab === 'files' && fileType !== 'all' ? { fileType } : {}),
        },
        { signal },
      ),
    enabled:
      dialogOpen &&
      hasSearchQuery &&
      canQueryStandardResults,
    staleTime: 10_000,
    placeholderData: (previousData) => previousData,
  });

  const pagedResultsQuery = useInfiniteQuery({
    queryKey: [
      'team-chat',
      'global-search',
      'results',
      'paged',
      serviceContext.tenantId,
      apiTab,
      debouncedQuery,
      effectiveScope,
      scopeRequest.contextScope,
      scopeRequest.contextId ?? '',
      scopedRoomId ?? '',
      sort,
      fileType,
    ],
    queryFn: ({ pageParam, signal }) =>
      service.searchGlobalResults(
        {
          q: debouncedQuery,
          tab: apiTab,
          limit: FULL_RESULTS_LIMIT,
          cursor: pageParam,
          contextScope: scopeRequest.contextScope,
          contextId: scopeRequest.contextId,
          roomId: scopedRoomId,
          sort,
          ...(apiTab === 'files' && fileType !== 'all' ? { fileType } : {}),
        },
        { signal },
      ),
    enabled: dialogOpen && hasSearchQuery && (apiTab === 'messages' || apiTab === 'files'),
    staleTime: 10_000,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });

  const createRoomMutation = useCreateTeamChatRoom();
  const emptyCounts = createEmptyCounts();
  const emptySections = createEmptySections();
  const previewSections = mapSectionsResponse(suggestQuery.data?.sections, t);
  const previewHasAnyResult =
    previewSections.people.items.length > 0 ||
    previewSections.rooms.items.length > 0 ||
    previewSections.messages.items.length > 0 ||
    previewSections.files.items.length > 0;

  const activeResultsPayload: TeamChatGlobalSearchResultsResponse | undefined =
    hasSearchQuery
      ? apiTab === 'messages' || apiTab === 'files'
      ? pagedResultsQuery.data?.pages[0]
      : standardResultsQuery.data
      : undefined;

  const counts: TeamChatGlobalSearchCountsResponse =
    hasSearchQuery ? activeResultsPayload?.counts ?? emptyCounts : emptyCounts;
  const allSections =
    hasSearchQuery && apiTab === 'all'
      ? mapSectionsResponse(standardResultsQuery.data?.sections, t)
      : emptySections;
  const peopleResults =
    hasSearchQuery && apiTab === 'people'
      ? filterResultsByEntity<TeamChatGlobalSearchPersonItemResponse>(
          standardResultsQuery.data?.items,
          'person',
        ).map((item) => mapPersonSearchItem(item, t))
      : emptySections.people.items;
  const roomResults =
    hasSearchQuery && apiTab === 'rooms'
      ? filterResultsByEntity<TeamChatGlobalSearchRoomItemResponse>(
          standardResultsQuery.data?.items,
          'room',
        ).map((item) => mapRoomSearchItem(item, t))
      : emptySections.rooms.items;
  const messageResults =
    hasSearchQuery && apiTab === 'messages'
      ? (pagedResultsQuery.data?.pages ?? []).flatMap((page) =>
          filterResultsByEntity<TeamChatGlobalSearchMessageItemResponse>(
            page.items,
            'message',
          ).map((item) => mapMessageSearchItem(item, t)),
        )
      : emptySections.messages.items;
  const fileResults =
    hasSearchQuery && apiTab === 'files'
      ? (pagedResultsQuery.data?.pages ?? []).flatMap((page) =>
          filterResultsByEntity<TeamChatGlobalSearchFileItemResponse>(
            page.items,
            'file',
          ).map((item) => mapFileSearchItem(item, t)),
        )
      : emptySections.files.items;

  const currentResultsError =
    apiTab === 'messages' || apiTab === 'files'
      ? pagedResultsQuery.error
      : standardResultsQuery.error;
  const resultsErrorMessage = hasSearchQuery && currentResultsError
    ? resolveSearchErrorMessage(currentResultsError, t('globalSearch.errorFallback'))
    : null;
  const isResultsLoading =
    hasSearchQuery
      ? apiTab === 'messages' || apiTab === 'files'
      ? pagedResultsQuery.isPending
      : standardResultsQuery.isPending
      : false;
  const hasMore =
    hasSearchQuery
      ? apiTab === 'messages' || apiTab === 'files'
      ? Boolean(pagedResultsQuery.hasNextPage)
      : Boolean(standardResultsQuery.data?.hasMore)
      : false;
  const isLoadingMore =
    hasSearchQuery
      ? apiTab === 'messages' || apiTab === 'files'
      ? pagedResultsQuery.isFetchingNextPage
      : standardResultsQuery.isFetching
      : false;

  const interactiveActions: TeamChatGlobalSearchAction[] = [];
  if (hasSearchQuery) {
    interactiveActions.push({
      id: 'action:all-results',
      kind: 'all-results',
      label: t('globalSearch.searchAllQuery', { query: debouncedQuery }),
    });
  }
  if (canUseConversationScope) {
    interactiveActions.push({
      id: 'action:room-scope',
      kind: 'room-scope',
      label: hasSearchQuery
        ? t('globalSearch.searchRoomOnly', { label: currentRoomLabel })
        : t('globalSearch.searchRoom', { label: currentRoomLabel }),
    });
  }

  if (!hasSearchQuery) {
    recentQueries.forEach((recentQuery) => {
      interactiveActions.push({
        id: `recent:${recentQuery}`,
        kind: 'recent-query',
        label: recentQuery,
        query: recentQuery,
      });
    });
  } else {
    previewSections.people.items.forEach((person) => {
      interactiveActions.push({
        id: `person:${person.id}`,
        kind: 'person',
        label: person.displayName,
        person,
      });
    });
    previewSections.rooms.items.forEach((room) => {
      interactiveActions.push({
        id: `room:${room.id}`,
        kind: 'room',
        label: room.name,
        room,
      });
    });
    previewSections.messages.items.forEach((message) => {
      interactiveActions.push({
        id: `message:${message.id}`,
        kind: 'message',
        label: message.snippet,
        message,
      });
    });
    previewSections.files.items.forEach((file) => {
      interactiveActions.push({
        id: `file:${file.id}`,
        kind: 'file',
        label: file.fileName,
        file,
      });
    });
  }

  const availableActionIds = interactiveActions.map((action) => action.id);
  const effectiveActiveActionId =
    activeActionId !== null && availableActionIds.includes(activeActionId)
      ? activeActionId
      : availableActionIds[0] ?? null;

  const rememberRecentQuery = (value: string) => {
    const normalizedValue = value.trim();
    if (normalizedValue.length < 2) return;

    setRecentQueries((previous) => {
      const nextValues = [
        normalizedValue,
        ...previous.filter((item) => item.toLowerCase() !== normalizedValue.toLowerCase()),
      ].slice(0, MAX_RECENT_QUERIES);
      persistRecentQueries(tenant, nextValues);
      return nextValues;
    });
  };

  const closeSearchSurfaces = (
    {
      suppressQuickReopen = false,
      blurInput = false,
    }: {
      suppressQuickReopen?: boolean;
      blurInput?: boolean;
    } = {},
  ) => {
    if (suppressQuickReopen) {
      suppressQuickSearchReopen();
    }
    if (blurInput) {
      inputRef.current?.blur();
    }
    setOpen(false);
    setDialogOpen(false);
  };

  const openConversation = (roomId: string, messageId?: string) => {
    const href = buildConversationHref({ tenant, roomId, messageId });
    closeSearchSurfaces({
      suppressQuickReopen: true,
      blurInput: true,
    });
    router.push(href, { scroll: false });
  };
  const handleScopeChange = (value: TeamChatGlobalSearchScope) => {
    setScope(value);
    setFileType('all');
  };
  const openFullResults = (nextTab: TeamChatGlobalSearchTab = 'all') => {
    if (deferredQuery.length >= 2) {
      rememberRecentQuery(deferredQuery);
    }
    setTab(nextTab);
    setDialogOpen(true);
    setOpen(false);
  };

  const handleOpenPerson = async (person: TeamChatGlobalSearchPersonResult) => {
    if (person.dmRoomId) {
      if (deferredQuery.length >= 2) rememberRecentQuery(deferredQuery);
      openConversation(person.dmRoomId);
      return;
    }

    const createScopeRequest = resolveTeamChatScopeRequest({
      scope: searchContext.scope,
      projectId: searchContext.projectId,
    });

    setPendingPersonUserId(person.userId);
    try {
      const createRoomBody: CreateTeamChatRoomBody = person.isSelf
        ? {
            roomType: 'dm',
            memberIds: [],
          }
        : {
            roomType: 'dm',
            visibility: 'private',
            name: person.displayName,
            contextScope: createScopeRequest.contextScope,
            contextId: createScopeRequest.contextId,
            memberIds: [person.userId],
          };
      const createRoomResult = await createRoomMutation.mutateAsync(createRoomBody);

      if (!createRoomResult.ok) {
        toast.danger(createRoomResult.error.message);
        return;
      }

      if (deferredQuery.length >= 2) rememberRecentQuery(deferredQuery);
      openConversation(createRoomResult.data.id);
    } finally {
      setPendingPersonUserId(null);
    }
  };

  const handleAction = async (action: TeamChatGlobalSearchAction) => {
    if (action.kind === 'all-results') {
      openFullResults('all');
      return;
    }

    if (action.kind === 'room-scope') {
      handleScopeChange('room');
      openFullResults('all');
      return;
    }

    if (action.kind === 'recent-query') {
      setQuery(action.query);
      setTab('all');
      setDialogOpen(true);
      setOpen(false);
      return;
    }

    if (action.kind === 'person') {
      await handleOpenPerson(action.person);
      return;
    }

    if (deferredQuery.length >= 2) rememberRecentQuery(deferredQuery);

    if (action.kind === 'room') {
      openConversation(action.room.roomId);
      return;
    }

    if (action.kind === 'message') {
      openConversation(action.message.roomId, action.message.messageId);
      return;
    }

    openConversation(action.file.roomId, action.file.messageId);
  };

  const handleMoveSelection = (direction: -1 | 1) => {
    if (!interactiveActions.length) return;

    const currentIndex = interactiveActions.findIndex(
      (action) => action.id === effectiveActiveActionId,
    );
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + interactiveActions.length) % interactiveActions.length;
    setActiveActionId(interactiveActions[nextIndex]?.id ?? null);
  };

  const handleInputKeyDown = async (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || isInputComposingRef.current) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      requestQuickSearchOpen();
      handleMoveSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      requestQuickSearchOpen();
      handleMoveSelection(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const activeAction = interactiveActions.find(
        (action) => action.id === effectiveActiveActionId,
      );
      if (open && activeAction) {
        await handleAction(activeAction);
        return;
      }

      openFullResults(tab);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      if (dialogOpen) {
        setDialogOpen(false);
        return;
      }
      setOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={handleQuickSearchOpenChange}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className={cn('relative w-full', className)}>
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              placeholder={t('globalSearch.searchPlaceholder')}
              className="h-11 cursor-text rounded-2xl border-border/60 bg-background/70 pr-4 pl-10 shadow-sm"
              onPointerDown={() => {
                releaseQuickSearchReopenBlock();
              }}
              onFocus={() => {
                if (dialogOpen) return;
                requestQuickSearchOpen();
              }}
              onCompositionStart={() => {
                isInputComposingRef.current = true;
              }}
              onCompositionEnd={() => {
                isInputComposingRef.current = false;
              }}
              onChange={(event) => {
                const nextValue = event.target.value;
                setQuery(nextValue);
                if (!open && !dialogOpen) requestQuickSearchOpen();
                if (!dialogOpen) {
                  setTab('all');
                }
              }}
              onKeyDown={handleInputKeyDown}
            />
          </div>
        </PopoverAnchor>

        {open ? (
          <PopoverContent
            align="start"
            sideOffset={10}
            collisionPadding={16}
            className="w-[min(92vw,760px)] rounded-3xl border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur-md"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
            }}
            onCloseAutoFocus={(event) => {
              const prevented = shouldPreventCloseAutoFocus();
              if (prevented) {
                event.preventDefault();
                if (!dialogOpen) {
                  releaseQuickSearchReopenBlock();
                }
              }
            }}
            onInteractOutside={(event) => {
              const target = event.target;
              if (target instanceof Node && anchorRef.current?.contains(target)) {
                event.preventDefault();
              }
            }}
          >
            <div className="border-border/60 flex items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('globalSearch.quickTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('globalSearch.quickDescription')}
                </p>
              </div>
              {canUseConversationScope ? (
                <Badge variant="outline" className="bg-background/80">
                  {t('globalSearch.inRoom', { label: currentRoomLabel })}
                </Badge>
              ) : null}
            </div>

            <ScrollArea className="h-[min(68vh,620px)]" id="team-chat-global-search-listbox">
              <div className="space-y-5 p-4">
                {hasSearchQuery ? (
                  <>
                    <SearchPreviewRow
                      active={effectiveActiveActionId === 'action:all-results'}
                      icon={
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background/80">
                          <Search className="h-4 w-4 text-primary" />
                        </div>
                      }
                      title={t('globalSearch.searchAllQuery', { query: debouncedQuery })}
                      subtitle={t('globalSearch.searchAllSubtitle')}
                      meta={<ArrowUpRight className="h-4 w-4" />}
                      onClick={() => openFullResults('all')}
                      onPointerEnter={() => setActiveActionId('action:all-results')}
                    />

                    {canUseConversationScope ? (
                      <SearchPreviewRow
                        active={effectiveActiveActionId === 'action:room-scope'}
                        icon={
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background/80">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          </div>
                        }
                        title={t('globalSearch.searchRoomOnly', { label: currentRoomLabel })}
                        subtitle={t('globalSearch.searchRoomSubtitle')}
                        onClick={() => {
                          handleScopeChange('room');
                          openFullResults('all');
                        }}
                        onPointerEnter={() => setActiveActionId('action:room-scope')}
                      />
                    ) : null}

                    {suggestQuery.isPending && !previewHasAnyResult ? (
                      <SearchSection title={t('globalSearch.searching')}>
                        <SearchSkeletonList count={4} />
                      </SearchSection>
                    ) : null}

                    {suggestQuery.error ? (
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
                        {resolveSearchErrorMessage(
                          suggestQuery.error,
                          t('globalSearch.errorFallback'),
                        )}
                      </div>
                    ) : null}

                    {!previewHasAnyResult && !suggestQuery.isPending && !suggestQuery.error ? (
                      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
                        <p className="text-sm font-semibold text-foreground">
                          {t('globalSearch.noQuickResults', { query: debouncedQuery })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('globalSearch.openFullSearchHint')}
                        </p>
                      </div>
                    ) : null}

                  {previewSections.people.items.length > 0 ? (
                    <SearchSection
                      title={t('globalSearch.tabs.people')}
                      badge={<Badge variant="outline">{previewSections.people.count}</Badge>}
                      hintLabel={buildPreviewHint(
                        previewSections.people.count,
                        previewSections.people.items.length,
                      )}
                      actionLabel={
                        previewSections.people.hasMore ||
                        previewSections.people.count > previewSections.people.items.length
                          ? t('globalSearch.viewAll')
                          : undefined
                      }
                      onAction={() => openFullResults('people')}
                    >
                      {previewSections.people.items.map((person) => (
                        <SearchPreviewRow
                          key={person.id}
                          active={effectiveActiveActionId === `person:${person.id}`}
                          icon={
                            <div className="relative">
                              <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={person.avatarUrl ?? undefined} alt={person.displayName} />
                                <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                  {initials(person.displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={cn(
                                  'absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border border-card',
                                  presenceDotClass(person.presenceStatus),
                                )}
                              />
                            </div>
                          }
                          title={highlightText(person.displayName, debouncedQuery, `${person.id}-preview-title`)}
                          subtitle={person.email || t('globalSearch.directoryContact')}
                          meta={
                            pendingPersonUserId === person.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : person.presenceStatus === 'online' ? (
                              <Badge variant="outline">{t('globalSearch.online')}</Badge>
                            ) : null
                          }
                          onClick={() => {
                            void handleOpenPerson(person);
                          }}
                          onPointerEnter={() => setActiveActionId(`person:${person.id}`)}
                        />
                      ))}
                    </SearchSection>
                  ) : null}

                  {previewSections.rooms.items.length > 0 ? (
                    <SearchSection
                      title={t('globalSearch.tabs.channels')}
                      badge={<Badge variant="outline">{previewSections.rooms.count}</Badge>}
                      hintLabel={buildPreviewHint(
                        previewSections.rooms.count,
                        previewSections.rooms.items.length,
                      )}
                      actionLabel={
                        previewSections.rooms.hasMore ||
                        previewSections.rooms.count > previewSections.rooms.items.length
                          ? t('globalSearch.viewAll')
                          : undefined
                      }
                      onAction={() => openFullResults('channels')}
                    >
                      {previewSections.rooms.items.map((room) => (
                        <SearchPreviewRow
                          key={room.id}
                          active={effectiveActiveActionId === `room:${room.id}`}
                          icon={
                            <TeamChatConversationIcon
                              kind={room.roomType}
                              title={room.name}
                              visibility={room.visibility}
                              size="sm"
                            />
                          }
                          title={highlightText(room.name, debouncedQuery, `${room.id}-preview-title`)}
                          subtitle={
                            room.topic ||
                            room.roomKey ||
                            t('globalSearch.membersCount', { count: room.memberCount })
                          }
                          meta={
                            room.roomType === 'channel' ? (
                              room.visibility === 'private' ? (
                                <Lock className="h-3.5 w-3.5" />
                              ) : (
                                <Hash className="h-3.5 w-3.5" />
                              )
                            ) : null
                          }
                          onClick={() => {
                            openConversation(room.roomId);
                          }}
                          onPointerEnter={() => setActiveActionId(`room:${room.id}`)}
                        />
                      ))}
                    </SearchSection>
                  ) : null}

                  {previewSections.messages.items.length > 0 ? (
                    <SearchSection
                      title={t('globalSearch.tabs.messages')}
                      badge={<Badge variant="outline">{previewSections.messages.count}</Badge>}
                      hintLabel={buildPreviewHint(
                        previewSections.messages.count,
                        previewSections.messages.items.length,
                      )}
                      actionLabel={
                        previewSections.messages.hasMore ||
                        previewSections.messages.count > previewSections.messages.items.length
                          ? t('globalSearch.viewAll')
                          : undefined
                      }
                      onAction={() => openFullResults('messages')}
                    >
                      {previewSections.messages.items.map((message) => (
                        <SearchPreviewRow
                          key={message.id}
                          active={effectiveActiveActionId === `message:${message.id}`}
                          icon={
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarImage
                                src={message.senderAvatarUrl ?? undefined}
                                alt={message.senderDisplayName}
                              />
                              <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                {initials(message.senderDisplayName)}
                              </AvatarFallback>
                            </Avatar>
                          }
                          title={message.senderDisplayName}
                          subtitle={highlightText(message.snippet, debouncedQuery, `${message.id}-preview-snippet`)}
                          meta={formatTimestampLabel(message.sentAt, locale, t('globalSearch.recent'))}
                          onClick={() => {
                            openConversation(message.roomId, message.messageId);
                          }}
                          onPointerEnter={() => setActiveActionId(`message:${message.id}`)}
                        />
                      ))}
                    </SearchSection>
                  ) : null}

                  {previewSections.files.items.length > 0 ? (
                    <SearchSection
                      title={t('globalSearch.tabs.files')}
                      badge={<Badge variant="outline">{previewSections.files.count}</Badge>}
                      hintLabel={buildPreviewHint(
                        previewSections.files.count,
                        previewSections.files.items.length,
                      )}
                      actionLabel={
                        previewSections.files.hasMore ||
                        previewSections.files.count > previewSections.files.items.length
                          ? t('globalSearch.viewAll')
                          : undefined
                      }
                      onAction={() => openFullResults('files')}
                    >
                      {previewSections.files.items.map((file) => (
                        <SearchPreviewRow
                          key={file.id}
                          active={effectiveActiveActionId === `file:${file.id}`}
                          icon={
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background/80">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                          }
                          title={highlightText(file.fileName, debouncedQuery, `${file.id}-preview-title`)}
                          subtitle={file.uploaderDisplayName || file.documentType || file.attachmentType}
                          meta={
                            file.sentAt
                              ? formatTimestampLabel(file.sentAt, locale, t('globalSearch.recent'))
                              : t('globalSearch.file')
                          }
                          onClick={() => {
                            openConversation(file.roomId, file.messageId);
                          }}
                          onPointerEnter={() => setActiveActionId(`file:${file.id}`)}
                        />
                      ))}
                    </SearchSection>
                  ) : null}
                </>
              ) : (
                <>
                  {canUseConversationScope ? (
                    <SearchPreviewRow
                      active={effectiveActiveActionId === 'action:room-scope'}
                      icon={
                        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background/80">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                      }
                      title={t('globalSearch.searchRoom', { label: currentRoomLabel })}
                      subtitle={t('globalSearch.searchRoomSubtitle')}
                      onClick={() => {
                        handleScopeChange('room');
                        setTab('all');
                        setDialogOpen(true);
                        setOpen(false);
                      }}
                      onPointerEnter={() => setActiveActionId('action:room-scope')}
                    />
                  ) : null}

                  {recentQueries.length > 0 ? (
                    <SearchSection title={t('globalSearch.recentSearches')}>
                      {recentQueries.map((recentQuery) => (
                        <SearchPreviewRow
                          key={recentQuery}
                          active={effectiveActiveActionId === `recent:${recentQuery}`}
                          icon={
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background/80">
                              <Clock3 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          }
                          title={recentQuery}
                          subtitle={t('globalSearch.openFullResults')}
                          onClick={() => {
                            setQuery(recentQuery);
                            setTab('all');
                            setDialogOpen(true);
                            setOpen(false);
                          }}
                          onPointerEnter={() => setActiveActionId(`recent:${recentQuery}`)}
                        />
                      ))}
                    </SearchSection>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                      {t('globalSearch.quickTypeMore')}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
          </PopoverContent>
        ) : null}
      </Popover>

      {dialogOpen ? (
        <TeamChatGlobalSearchDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          shouldPreventCloseAutoFocus={shouldPreventCloseAutoFocus}
          query={query}
          deferredQuery={debouncedQuery}
          tab={tab}
          onTabChange={setTab}
          scope={effectiveScope}
          onScopeChange={handleScopeChange}
          canUseConversationScope={canUseConversationScope}
          currentRoomLabel={currentRoomLabel}
          counts={counts}
          allSections={allSections}
          peopleResults={peopleResults}
          roomResults={roomResults}
          messageResults={messageResults}
          fileResults={fileResults}
          pendingPersonUserId={pendingPersonUserId}
          isResultsLoading={isResultsLoading}
          resultsErrorMessage={resultsErrorMessage}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          sort={sort}
          onSortChange={setSort}
          fileType={fileType}
          onFileTypeChange={setFileType}
          onLoadMore={() => {
            if (apiTab === 'messages' || apiTab === 'files') {
              void pagedResultsQuery.fetchNextPage();
            }
          }}
          onQueryChange={(value) => {
            setQuery(value);
          }}
          onRememberQuery={rememberRecentQuery}
          onOpenPerson={handleOpenPerson}
          onOpenRoom={(roomId) => openConversation(roomId)}
          onOpenConversationResult={(roomId, messageId) => openConversation(roomId, messageId)}
        />
      ) : null}
    </>
  );
}
