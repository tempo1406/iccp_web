'use client';

import { useRef, useState } from 'react';
import { Film, ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { ImageKitService } from '@/services/imagekit/imagekit.service';
import { rememberImageKitFile } from '@/services/imagekit/imagekit-file-map';
import type { MediaAsset } from '../utils/media-library.storage';

export const CANVAS_MEDIA_DRAG_TYPE = 'application/iccp-landing-page-media';

interface Props {
  orgSlug: string;
  assets: MediaAsset[];
  onAssetsChange: (assets: MediaAsset[]) => void;
  onInsert: (asset: MediaAsset) => void;
}

function detectMediaKind(file: File): MediaAsset['kind'] | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return null;
}

function mediaLimitBytes(kind: MediaAsset['kind']): number {
  return kind === 'video'
    ? 100 * 1024 * 1024
    : 10 * 1024 * 1024;
}

export function CanvasMediaLibrary({
  orgSlug,
  assets,
  onAssetsChange,
  onInsert,
}: Props) {
  const t = useTranslations('siteStudio.media');
  const ctx = useServiceContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const svc = new ImageKitService(ctx);
      const uploaded: MediaAsset[] = [];

      for (const file of files) {
        const kind = detectMediaKind(file);
        if (!kind) {
          toast.danger(t('toasts.unsupportedFileType', { name: file.name }));
          continue;
        }

        if (file.size > mediaLimitBytes(kind)) {
          toast.danger(
            kind === 'video'
              ? t('toasts.videoTooLarge', { name: file.name })
              : t('toasts.imageTooLarge', { name: file.name }),
          );
          continue;
        }

        const result = await svc.upload(file, `organizations/landing-pages/${orgSlug}`);
        rememberImageKitFile(result.url, result.fileId);
        uploaded.push({
          url: result.url,
          fileId: result.fileId,
          name: result.name,
          kind,
        });
      }

      if (uploaded.length > 0) {
        onAssetsChange([...assets, ...uploaded]);
        toast.success(
          uploaded.length === 1
            ? t('toasts.uploadedOne')
            : t('toasts.uploadedMany', { count: uploaded.length }),
        );
      }
    } catch {
      toast.danger(t('toasts.uploadFailed'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove(asset: MediaAsset, event: React.MouseEvent) {
    event.stopPropagation();
    onAssetsChange(assets.filter((item) => item.fileId !== asset.fileId));
    const svc = new ImageKitService(ctx);
    void svc.deleteFile(asset.url).catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('title')}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-xs"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          {t('upload')}
        </Button>
      </div>

      {assets.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Film className="h-8 w-8 opacity-30" />
          <span className="text-xs">{t('empty')}</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {assets.map((asset) => (
            <div
              key={asset.fileId}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-md border bg-muted/20 transition-colors hover:border-primary/60"
              onClick={() => onInsert(asset)}
              title={asset.name}
            >
              {asset.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.url}
                  alt={asset.name}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <video
                  src={asset.url}
                  draggable={false}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
              <div className="absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {asset.kind === 'image' ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <Film className="h-3 w-3" />
                )}
                <span className="truncate">{t(`labels.${asset.kind}`)}</span>
              </div>
              <button
                type="button"
                onClick={(event) => handleRemove(asset, event)}
                className="absolute right-1 top-1 hidden rounded bg-black/60 p-0.5 text-white group-hover:flex"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/ogg,video/quicktime"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
