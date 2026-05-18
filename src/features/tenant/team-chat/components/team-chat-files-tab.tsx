import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { appConfig } from '@/common/constant/app';
import { type SharedFile } from '../data/team-chat-ui-data';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import { TeamChatFileTypeIcon } from './team-chat-file-type-icon';
import {
  TeamChatMediaViewerDialog,
  type TeamChatMediaViewerItem,
} from './team-chat-media-viewer-dialog';

interface TeamChatFilesTabProps {
  conversationTitle: string;
  filesSearch: string;
  isLoading?: boolean;
  filteredFiles: SharedFile[];
  onFilesSearchChange: (value: string) => void;
}

function isPreviewableSharedFile(file: SharedFile) {
  return (
    (file.attachmentType === 'image' || file.attachmentType === 'video') &&
    Boolean(file.viewerSrc)
  );
}

function isAbsoluteUrl(url: string) {
  return /^[a-z][a-z0-9+\-.]*:/i.test(url);
}

function resolveAssetBaseUrl() {
  const configuredBaseUrl = appConfig.apiBaseUrl?.trim();
  if (configuredBaseUrl) return configuredBaseUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return undefined;
}

function resolveSharedFileAssetUrl(url?: string) {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) return undefined;

  if (
    normalizedUrl.startsWith('data:') ||
    normalizedUrl.startsWith('blob:') ||
    isAbsoluteUrl(normalizedUrl)
  ) {
    return normalizedUrl;
  }

  if (normalizedUrl.startsWith('//')) {
    if (typeof window !== 'undefined') return `${window.location.protocol}${normalizedUrl}`;
    return `https:${normalizedUrl}`;
  }

  const baseUrl = resolveAssetBaseUrl();
  if (!baseUrl) return normalizedUrl;

  try {
    return new URL(normalizedUrl, baseUrl).toString();
  } catch {
    return normalizedUrl;
  }
}

export function TeamChatFilesTab({
  conversationTitle,
  filesSearch,
  isLoading = false,
  filteredFiles,
  onFilesSearchChange,
}: TeamChatFilesTabProps) {
  const t = useTranslations('teamChat');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const getFileKindLabel = (kind: SharedFile['kind']) => {
    if (kind === 'spreadsheet') return t('files.kinds.spreadsheet');
    if (kind === 'presentation') return t('files.kinds.presentation');
    if (kind === 'archive') return t('files.kinds.archive');
    if (kind === 'image') return t('files.kinds.image');
    if (kind === 'video') return t('files.kinds.video');
    return t('files.kinds.document');
  };

  const mediaItems = useMemo<TeamChatMediaViewerItem[]>(
    () =>
      filteredFiles
        .filter(isPreviewableSharedFile)
        .map((file) => ({
          id: file.id,
          type: file.attachmentType === 'video' ? 'video' : 'image',
          src: resolveSharedFileAssetUrl(file.viewerSrc) ?? file.viewerSrc!,
          alt: file.name,
          fileName: file.name,
          sizeLabel: file.sizeLabel,
        })),
    [filteredFiles],
  );

  const handleOpenFile = (file: SharedFile) => {
    const mediaIndex = mediaItems.findIndex((item) => item.id === file.id);
    if (mediaIndex >= 0) {
      setViewerIndex(mediaIndex);
      setViewerOpen(true);
      return;
    }

    const fileHref = resolveSharedFileAssetUrl(file.openUrl ?? file.viewerSrc ?? file.fileUrl);
    if (!fileHref || typeof window === 'undefined') return;
    window.open(fileHref, '_blank', 'noopener,noreferrer');
  };

  return (
    <TabsContent value="files" forceMount className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 px-4 py-5 sm:px-6">
          <div className="max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filesSearch}
                onChange={(event) => onFilesSearchChange(event.target.value)}
                placeholder={t('files.searchPlaceholder', { title: conversationTitle })}
                className="h-11 rounded-2xl pl-9"
              />
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">{t('files.title')}</h3>
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                {t('files.loading')}
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                {t('files.empty')}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {filteredFiles.map((file, index) => {
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => handleOpenFile(file)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/30',
                        index !== filteredFiles.length - 1 && 'border-b border-border',
                        focusRingClass,
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <TeamChatFileTypeIcon
                          attachmentType={file.attachmentType}
                          className="h-[62%] w-[62%]"
                          documentType={file.documentType}
                          fileName={file.name}
                          fileUrl={file.fileUrl}
                          kind={file.kind}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold">{file.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t('files.sharedByOn', { user: file.sharedBy, date: file.uploadedAt })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground">
                          {getFileKindLabel(file.kind)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {file.sizeLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>

      <TeamChatMediaViewerDialog
        activeIndex={viewerIndex}
        items={mediaItems}
        open={viewerOpen}
        onActiveIndexChange={setViewerIndex}
        onOpenChange={setViewerOpen}
      />
    </TabsContent>
  );
}

