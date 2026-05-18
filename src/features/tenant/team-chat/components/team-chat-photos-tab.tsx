import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { appConfig } from '@/common/constant/app';
import { type SharedPhoto } from '../data/team-chat-ui-data';
import { focusRingClass } from '../lib/team-chat-screen.shared';
import {
  TeamChatMediaViewerDialog,
  type TeamChatMediaViewerItem,
} from './team-chat-media-viewer-dialog';

interface TeamChatPhotosTabProps {
  groupedPhotos: Record<string, SharedPhoto[]>;
  isLoading?: boolean;
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

function resolveSharedPhotoAssetUrl(url?: string) {
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

export function TeamChatPhotosTab({
  groupedPhotos,
  isLoading = false,
}: TeamChatPhotosTabProps) {
  const t = useTranslations('teamChat');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const orderedPhotos = useMemo(() => Object.values(groupedPhotos).flat(), [groupedPhotos]);
  const mediaItems = useMemo<TeamChatMediaViewerItem[]>(
    () =>
      orderedPhotos.map((photo) => ({
        id: photo.id,
        type: 'image',
        src: resolveSharedPhotoAssetUrl(photo.viewerSrc ?? photo.src) ?? (photo.viewerSrc ?? photo.src),
        alt: photo.alt,
        fileName: photo.alt,
      })),
    [orderedPhotos],
  );

  const handleOpenPhoto = (photo: SharedPhoto) => {
    const nextIndex = mediaItems.findIndex((item) => item.id === photo.id);
    if (nextIndex < 0) return;
    setViewerIndex(nextIndex);
    setViewerOpen(true);
  };

  return (
    <TabsContent value="photos" forceMount className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-8 px-4 py-5 sm:px-6">
          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t('photosTab.loading')}
            </div>
          ) : Object.keys(groupedPhotos).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t('photosTab.empty')}
            </div>
          ) : (
            Object.entries(groupedPhotos).map(([monthLabel, photos]) => (
              <section key={monthLabel} className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">{monthLabel}</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handleOpenPhoto(photo)}
                      className={cn(
                        'group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card text-left transition-colors hover:bg-muted/20',
                        focusRingClass,
                      )}
                    >
                      <div className="relative aspect-[4/3]">
                        <img
                          src={resolveSharedPhotoAssetUrl(photo.src) ?? photo.src}
                          alt={photo.alt}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                        />
                      </div>
                      <div className="border-t border-border px-4 py-3">
                        <p className="truncate text-sm font-medium">{photo.alt}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {photo.sharedBy
                            ? t('photosTab.sharedBy', {
                                uploadedAt: photo.uploadedAt,
                                sharedBy: photo.sharedBy,
                              })
                            : t('photosTab.sharedAt', { uploadedAt: photo.uploadedAt })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
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
