'use client';

import { useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileText, Hash, Loader2, Lock, Paperclip, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { focusRingClass, initials, presenceDotClass } from '../lib/team-chat-screen.shared';
import type { TeamChatGlobalSearchSort } from '../services/types/team-chat-global-search.types';
import { TeamChatConversationIcon } from './team-chat-conversation-icon';
import type {
  TeamChatGlobalSearchCounts,
  TeamChatGlobalSearchFileResult,
  TeamChatGlobalSearchMessageResult,
  TeamChatGlobalSearchPersonResult,
  TeamChatGlobalSearchRoomResult,
  TeamChatGlobalSearchScope,
  TeamChatGlobalSearchSections,
  TeamChatGlobalSearchTab,
} from './team-chat-global-search.shared';
import {
  createFileTypeOptions,
  createSortOptions,
  SearchPreviewRow,
  SearchSection,
  SearchSkeletonList,
  countForTab,
  formatTimestampLabel,
  highlightText,
} from './team-chat-global-search.shared';

interface TeamChatGlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shouldPreventCloseAutoFocus?: () => boolean;
  query: string;
  deferredQuery: string;
  tab: TeamChatGlobalSearchTab;
  onTabChange: (value: TeamChatGlobalSearchTab) => void;
  scope: TeamChatGlobalSearchScope;
  onScopeChange: (value: TeamChatGlobalSearchScope) => void;
  canUseConversationScope: boolean;
  currentRoomLabel: string;
  counts: TeamChatGlobalSearchCounts;
  allSections: TeamChatGlobalSearchSections;
  peopleResults: TeamChatGlobalSearchPersonResult[];
  roomResults: TeamChatGlobalSearchRoomResult[];
  messageResults: TeamChatGlobalSearchMessageResult[];
  fileResults: TeamChatGlobalSearchFileResult[];
  pendingPersonUserId: string | null;
  isResultsLoading: boolean;
  resultsErrorMessage?: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  sort: TeamChatGlobalSearchSort;
  onSortChange: (value: TeamChatGlobalSearchSort) => void;
  fileType: string;
  onFileTypeChange: (value: string) => void;
  onLoadMore: () => void;
  onQueryChange: (value: string) => void;
  onRememberQuery: (value: string) => void;
  onOpenPerson: (person: TeamChatGlobalSearchPersonResult) => Promise<void> | void;
  onOpenRoom: (roomId: string) => void;
  onOpenConversationResult: (roomId: string, messageId?: string) => void;
}

function SearchInfoCard({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'danger';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm',
        tone === 'accent' &&
          'border-primary/20 bg-primary/5 text-muted-foreground',
        tone === 'danger' &&
          'border-destructive/30 bg-destructive/5 text-destructive',
        tone === 'neutral' &&
          'border-dashed border-border/70 bg-muted/20 text-muted-foreground',
      )}
    >
      {children}
    </div>
  );
}

function PersonRows({
  items,
  deferredQuery,
  pendingPersonUserId,
  onOpenPerson,
  t,
}: {
  items: TeamChatGlobalSearchPersonResult[];
  deferredQuery: string;
  pendingPersonUserId: string | null;
  onOpenPerson: (person: TeamChatGlobalSearchPersonResult) => Promise<void> | void;
  t: ReturnType<typeof useTranslations>;
}) {
  return items.map((person) => (
    <SearchPreviewRow
      key={person.id}
      icon={
        <div className="relative">
          <Avatar className="h-10 w-10 border border-border">
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
      title={highlightText(person.displayName, deferredQuery, `${person.id}-dialog-title`)}
      subtitle={person.email || t('globalSearch.directoryContact')}
      meta={
        pendingPersonUserId === person.userId ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : person.presenceStatus === 'online' ? (
          <Badge variant="outline">{t('globalSearch.online')}</Badge>
        ) : null
      }
      onClick={() => void onOpenPerson(person)}
    />
  ));
}

function RoomRows({
  items,
  deferredQuery,
  onOpenRoom,
  t,
  locale,
}: {
  items: TeamChatGlobalSearchRoomResult[];
  deferredQuery: string;
  onOpenRoom: (roomId: string) => void;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  return items.map((room) => (
    <SearchPreviewRow
      key={room.id}
      icon={
        <TeamChatConversationIcon
          kind={room.roomType}
          title={room.name}
          visibility={room.visibility}
          size="md"
        />
      }
      title={highlightText(room.name, deferredQuery, `${room.id}-dialog-room-title`)}
      subtitle={room.topic || room.roomKey || t('globalSearch.membersCount', { count: room.memberCount })}
      meta={
        <div className="flex items-center gap-1.5">
          {room.roomType === 'channel' ? (
            room.visibility === 'private' ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <Hash className="h-3.5 w-3.5" />
            )
          ) : null}
          <span>{formatTimestampLabel(room.lastMessageAt, locale, t('globalSearch.recent'))}</span>
        </div>
      }
      onClick={() => onOpenRoom(room.roomId)}
    />
  ));
}

function MessageRows({
  items,
  deferredQuery,
  onOpenConversationResult,
  t,
  locale,
}: {
  items: TeamChatGlobalSearchMessageResult[];
  deferredQuery: string;
  onOpenConversationResult: (roomId: string, messageId?: string) => void;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  return items.map((message) => (
    <SearchPreviewRow
      key={message.id}
      icon={
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={message.senderAvatarUrl ?? undefined} alt={message.senderDisplayName} />
          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
            {initials(message.senderDisplayName)}
          </AvatarFallback>
        </Avatar>
      }
      title={
        <div className="flex items-center gap-2">
          <span className="truncate">{message.senderDisplayName}</span>
          {message.hasAttachments ? <Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> : null}
        </div>
      }
      subtitle={highlightText(message.snippet, deferredQuery, `${message.id}-message-snippet`)}
      meta={formatTimestampLabel(message.sentAt, locale, t('globalSearch.recent'))}
      onClick={() => onOpenConversationResult(message.roomId, message.messageId)}
    />
  ));
}

function FileRows({
  items,
  deferredQuery,
  onOpenConversationResult,
  t,
  locale,
}: {
  items: TeamChatGlobalSearchFileResult[];
  deferredQuery: string;
  onOpenConversationResult: (roomId: string, messageId?: string) => void;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  return items.map((file) => (
    <SearchPreviewRow
      key={file.id}
      icon={
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-muted/30">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      }
      title={highlightText(file.fileName, deferredQuery, `${file.id}-file-title`)}
      subtitle={file.uploaderDisplayName || file.documentType || file.attachmentType}
      meta={
        file.sentAt ? formatTimestampLabel(file.sentAt, locale, t('globalSearch.recent')) : t('globalSearch.file')
      }
      onClick={() => onOpenConversationResult(file.roomId, file.messageId)}
    />
  ));
}

function LoadMoreButton({
  visible,
  loading,
  onClick,
  t,
}: {
  visible: boolean;
  loading: boolean;
  onClick: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!visible) return null;

  return (
    <div className="flex justify-center pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={loading}
        className="cursor-pointer rounded-full"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {t('globalSearch.loadMore')}
      </Button>
    </div>
  );
}

export function TeamChatGlobalSearchDialog({
  open,
  onOpenChange,
  shouldPreventCloseAutoFocus,
  query,
  deferredQuery,
  tab,
  onTabChange,
  scope,
  onScopeChange,
  canUseConversationScope,
  currentRoomLabel,
  counts,
  allSections,
  peopleResults,
  roomResults,
  messageResults,
  fileResults,
  pendingPersonUserId,
  isResultsLoading,
  resultsErrorMessage,
  hasMore,
  isLoadingMore,
  sort,
  onSortChange,
  fileType,
  onFileTypeChange,
  onLoadMore,
  onQueryChange,
  onRememberQuery,
  onOpenPerson,
  onOpenRoom,
  onOpenConversationResult,
}: TeamChatGlobalSearchDialogProps) {
  const t = useTranslations('teamChat');
  const locale = useLocale();
  const queryTooShort = deferredQuery.trim().length < 2;
  const isQueryInputComposingRef = useRef(false);
  const sortOptions = createSortOptions(t);
  const fileTypeOptions = createFileTypeOptions(t);

  const handleQueryInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || isQueryInputComposingRef.current) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      onRememberQuery(query);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-3 flex h-[min(900px,calc(100dvh-1.5rem))] w-[min(97vw,1240px)] max-w-[min(97vw,1240px)] translate-y-0 flex-col gap-0 overflow-hidden rounded-[28px] border-border/60 p-0 sm:top-6 sm:h-[min(900px,calc(100dvh-3rem))] lg:w-[min(95vw,1320px)] lg:max-w-[min(95vw,1320px)]"
        onCloseAutoFocus={(event) => {
          const prevented = shouldPreventCloseAutoFocus?.() ?? false;
          if (!prevented) return;
          event.preventDefault();
        }}
      >
        <div className="border-border/60 flex flex-col items-start gap-3 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-5">
          <div className="min-w-0">
            <DialogTitle className="text-xl">{t('globalSearch.title')}</DialogTitle>
            <DialogDescription className="mt-1">
              {t('globalSearch.description')}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
            <Badge variant="outline" className="shrink-0">
              {t('globalSearch.results', { count: countForTab(counts, tab) })}
            </Badge>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  'cursor-pointer rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground',
                  focusRingClass,
                )}
                aria-label={t('globalSearch.close')}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
          <Input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            placeholder={t('globalSearch.searchPlaceholder')}
            className="h-12 rounded-2xl bg-muted/35"
            onCompositionStart={() => {
              isQueryInputComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isQueryInputComposingRef.current = false;
            }}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleQueryInputKeyDown}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onScopeChange('workspace')}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors',
                scope === 'workspace'
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
                focusRingClass,
              )}
            >
              {t('globalSearch.scopeWorkspace')}
            </button>
            <button
              type="button"
              disabled={!canUseConversationScope}
              onClick={() => onScopeChange('room')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                canUseConversationScope ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                scope === 'room'
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
                focusRingClass,
              )}
            >
              {canUseConversationScope
                ? t('globalSearch.scopeRoomWithLabel', { label: currentRoomLabel })
                : t('globalSearch.scopeRoom')}
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    'cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors',
                    sort === option.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:text-foreground',
                    focusRingClass,
                  )}
                >
                  {option.label}
                </button>
              ))}

              {tab === 'files' ? (
                <Select value={fileType} onValueChange={onFileTypeChange}>
                  <SelectTrigger className="h-9 w-[168px] rounded-full">
                    <SelectValue placeholder={t('globalSearch.filterFileType')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover">
                    {fileTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(value) => onTabChange(value as TeamChatGlobalSearchTab)}
          className="min-h-0 flex-1 gap-0 overflow-hidden"
        >
          <div className="border-border/60 overflow-x-auto border-b px-5 sm:px-6">
            <TabsList variant="line" className="h-auto min-w-max gap-4 p-0">
              <TabsTrigger value="all" className="px-0 py-3">
                {t('globalSearch.tabs.all')} <span className="ml-1 text-xs text-muted-foreground">{countForTab(counts, 'all')}</span>
              </TabsTrigger>
              <TabsTrigger value="people" className="px-0 py-3">
                {t('globalSearch.tabs.people')} <span className="ml-1 text-xs text-muted-foreground">{counts.people}</span>
              </TabsTrigger>
              <TabsTrigger value="channels" className="px-0 py-3">
                {t('globalSearch.tabs.channels')} <span className="ml-1 text-xs text-muted-foreground">{counts.rooms}</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="px-0 py-3">
                {t('globalSearch.tabs.messages')} <span className="ml-1 text-xs text-muted-foreground">{counts.messages}</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="px-0 py-3">
                {t('globalSearch.tabs.files')} <span className="ml-1 text-xs text-muted-foreground">{counts.files}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-0 flex-1">
            <TabsContent value="all" className="m-0 h-full">
              <ScrollArea className="h-full px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-6 pb-5">
                  {queryTooShort ? (
                    <SearchInfoCard>{t('globalSearch.typeMore')}</SearchInfoCard>
                  ) : resultsErrorMessage ? (
                    <SearchInfoCard tone="danger">{resultsErrorMessage}</SearchInfoCard>
                  ) : isResultsLoading && countForTab(counts, 'all') === 0 ? (
                    <SearchSkeletonList count={6} />
                  ) : (
                    <>
                      {scope === 'room' ? (
                        <SearchInfoCard tone="accent">
                          {t.rich('globalSearch.roomScopeFocused', {
                            strong: (chunks) => <strong>{chunks}</strong>,
                            label: currentRoomLabel,
                          })}
                        </SearchInfoCard>
                      ) : null}

                      <SearchSection
                        title={t('globalSearch.tabs.people')}
                        badge={<Badge variant="outline">{allSections.people.count}</Badge>}
                        actionLabel={
                          allSections.people.hasMore || allSections.people.count > allSections.people.items.length
                            ? t('globalSearch.viewAll')
                            : undefined
                        }
                        onAction={() => onTabChange('people')}
                      >
                        {allSections.people.items.length > 0 ? (
                          <PersonRows
                            items={allSections.people.items}
                            deferredQuery={deferredQuery}
                            pendingPersonUserId={pendingPersonUserId}
                            onOpenPerson={onOpenPerson}
                            t={t}
                          />
                        ) : (
                          <SearchInfoCard>{t('globalSearch.emptyPeople')}</SearchInfoCard>
                        )}
                      </SearchSection>

                      {scope === 'workspace' ? (
                        <>
                          <SearchSection
                            title={t('globalSearch.tabs.channels')}
                            badge={<Badge variant="outline">{allSections.rooms.count}</Badge>}
                            actionLabel={
                              allSections.rooms.hasMore || allSections.rooms.count > allSections.rooms.items.length
                                ? t('globalSearch.viewAll')
                                : undefined
                            }
                            onAction={() => onTabChange('channels')}
                          >
                            {allSections.rooms.items.length > 0 ? (
                          <RoomRows
                            items={allSections.rooms.items}
                            deferredQuery={deferredQuery}
                            onOpenRoom={onOpenRoom}
                            t={t}
                            locale={locale}
                          />
                            ) : (
                              <SearchInfoCard>{t('globalSearch.emptyChannels')}</SearchInfoCard>
                            )}
                          </SearchSection>
                        </>
                      ) : null}

                      <SearchSection
                        title={t('globalSearch.tabs.messages')}
                        badge={<Badge variant="outline">{allSections.messages.count}</Badge>}
                        actionLabel={
                          allSections.messages.hasMore ||
                          allSections.messages.count > allSections.messages.items.length
                            ? t('globalSearch.viewAll')
                            : undefined
                        }
                        onAction={() => onTabChange('messages')}
                      >
                        {allSections.messages.items.length > 0 ? (
                          <MessageRows
                            items={allSections.messages.items}
                            deferredQuery={deferredQuery}
                            onOpenConversationResult={onOpenConversationResult}
                            t={t}
                            locale={locale}
                          />
                        ) : (
                          <SearchInfoCard>{t('globalSearch.emptyMessages')}</SearchInfoCard>
                        )}
                      </SearchSection>

                      <SearchSection
                        title={t('globalSearch.tabs.files')}
                        badge={<Badge variant="outline">{allSections.files.count}</Badge>}
                        actionLabel={
                          allSections.files.hasMore || allSections.files.count > allSections.files.items.length
                            ? t('globalSearch.viewAll')
                            : undefined
                        }
                        onAction={() => onTabChange('files')}
                      >
                        {allSections.files.items.length > 0 ? (
                          <FileRows
                            items={allSections.files.items}
                            deferredQuery={deferredQuery}
                            onOpenConversationResult={onOpenConversationResult}
                            t={t}
                            locale={locale}
                          />
                        ) : (
                          <SearchInfoCard>{t('globalSearch.emptyFiles')}</SearchInfoCard>
                        )}
                      </SearchSection>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="people" className="m-0 h-full">
              <ScrollArea className="h-full px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4 pb-5">
                  {queryTooShort ? (
                    <SearchInfoCard>{t('globalSearch.typeMore')}</SearchInfoCard>
                  ) : resultsErrorMessage ? (
                    <SearchInfoCard tone="danger">{resultsErrorMessage}</SearchInfoCard>
                  ) : isResultsLoading && peopleResults.length === 0 ? (
                    <SearchSkeletonList count={5} />
                  ) : (
                    <>
                      {scope === 'room' ? (
                        <SearchInfoCard tone="accent">
                          {t.rich('globalSearch.peopleInRoom', {
                            strong: (chunks) => <strong>{chunks}</strong>,
                            label: currentRoomLabel,
                          })}
                        </SearchInfoCard>
                      ) : null}

                      {peopleResults.length > 0 ? (
                        <PersonRows
                          items={peopleResults}
                          deferredQuery={deferredQuery}
                          pendingPersonUserId={pendingPersonUserId}
                          onOpenPerson={onOpenPerson}
                          t={t}
                        />
                      ) : (
                        <SearchInfoCard>{t('globalSearch.emptyPeople')}</SearchInfoCard>
                      )}
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="channels" className="m-0 h-full">
              <ScrollArea className="h-full px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4 pb-5">
                  {queryTooShort ? (
                    <SearchInfoCard>{t('globalSearch.typeMore')}</SearchInfoCard>
                  ) : scope === 'room' ? (
                    <SearchInfoCard>
                      {t.rich('globalSearch.channelsDisabledInRoom', {
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </SearchInfoCard>
                  ) : resultsErrorMessage ? (
                    <SearchInfoCard tone="danger">{resultsErrorMessage}</SearchInfoCard>
                  ) : isResultsLoading && roomResults.length === 0 ? (
                    <SearchSkeletonList count={5} />
                  ) : roomResults.length > 0 ? (
                        <RoomRows
                          items={roomResults}
                          deferredQuery={deferredQuery}
                          onOpenRoom={onOpenRoom}
                          t={t}
                          locale={locale}
                        />
                  ) : (
                    <SearchInfoCard>{t('globalSearch.emptyChannels')}</SearchInfoCard>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="messages" className="m-0 h-full">
              <ScrollArea className="h-full px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4 pb-5">
                  {queryTooShort ? (
                    <SearchInfoCard>{t('globalSearch.typeMore')}</SearchInfoCard>
                  ) : resultsErrorMessage ? (
                    <SearchInfoCard tone="danger">{resultsErrorMessage}</SearchInfoCard>
                  ) : isResultsLoading && messageResults.length === 0 ? (
                    <SearchSkeletonList count={5} />
                  ) : messageResults.length > 0 ? (
                    <>
                        <MessageRows
                          items={messageResults}
                          deferredQuery={deferredQuery}
                          onOpenConversationResult={onOpenConversationResult}
                          t={t}
                          locale={locale}
                        />
                      <LoadMoreButton visible={hasMore} loading={isLoadingMore} onClick={onLoadMore} t={t} />
                    </>
                  ) : (
                    <SearchInfoCard>{t('globalSearch.emptyMessages')}</SearchInfoCard>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="files" className="m-0 h-full">
              <ScrollArea className="h-full px-5 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4 pb-5">
                  {queryTooShort ? (
                    <SearchInfoCard>{t('globalSearch.typeMore')}</SearchInfoCard>
                  ) : resultsErrorMessage ? (
                    <SearchInfoCard tone="danger">{resultsErrorMessage}</SearchInfoCard>
                  ) : isResultsLoading && fileResults.length === 0 ? (
                    <SearchSkeletonList count={5} />
                  ) : fileResults.length > 0 ? (
                    <>
                        <FileRows
                          items={fileResults}
                          deferredQuery={deferredQuery}
                          onOpenConversationResult={onOpenConversationResult}
                          t={t}
                          locale={locale}
                        />
                      <LoadMoreButton visible={hasMore} loading={isLoadingMore} onClick={onLoadMore} t={t} />
                    </>
                  ) : (
                    <SearchInfoCard>{t('globalSearch.emptyFiles')}</SearchInfoCard>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
