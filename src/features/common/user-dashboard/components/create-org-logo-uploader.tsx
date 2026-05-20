'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Camera, Loader2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { ImageKitService } from '@/services/imagekit/imagekit.service';
import {
  forgetImageKitFile,
  getImageKitFileId,
  rememberImageKitFile,
} from '@/services/imagekit/imagekit-file-map';

interface CreateOrgLogoUploaderProps {
  value?: string;
  organizationName?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

function getInitials(name?: string): string {
  if (!name?.trim()) return 'ORG';

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'ORG';
}

export function CreateOrgLogoUploader({
  value,
  organizationName,
  onChange,
  disabled = false,
  onUploadingChange,
}: CreateOrgLogoUploaderProps) {
  const t = useTranslations('dashboard.createOrganization.logo');
  const ctx = useServiceContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const currentPreviewUrl = previewUrl ?? value;
  const currentFileId = uploadedFileId ?? getImageKitFileId(value);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.danger(t('sizeError'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const previousLogoUrl = value;
    const previousFileId = getImageKitFileId(previousLogoUrl) ?? currentFileId;

    setPreviewUrl(objectUrl);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const imageKit = new ImageKitService(ctx);
      const result = await imageKit.upload(file, 'organizations/logos');

      onChange(result.url);
      setPreviewUrl(result.url);
      setUploadedFileId(result.fileId);
      rememberImageKitFile(result.url, result.fileId);

      if (previousFileId && previousFileId !== result.fileId) {
        forgetImageKitFile(previousLogoUrl);
        void imageKit.deleteFile(previousFileId).catch(() => undefined);
      }
    } catch {
      setPreviewUrl(value);
      toast.danger(t('uploadError'));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleRemove() {
    if (disabled || isUploading) return;

    const currentFileId = uploadedFileId ?? getImageKitFileId(value);
    const currentUrl = value;
    setPreviewUrl(undefined);
    setUploadedFileId(null);
    onChange(undefined);

    if (currentUrl) {
      forgetImageKitFile(currentUrl);
    }

    if (currentFileId) {
      void new ImageKitService(ctx).deleteFile(currentFileId).catch(() => undefined);
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="group relative shrink-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed"
            aria-label={currentPreviewUrl ? t('change') : t('upload')}
          >
            <Avatar className="size-24 rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              {currentPreviewUrl ? (
                <AvatarImage src={currentPreviewUrl} alt={organizationName || t('alt')} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary rounded-full">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : organizationName?.trim() ? (
                  <span className="text-lg font-semibold">{getInitials(organizationName)}</span>
                ) : (
                  <Building2 className="h-7 w-7" />
                )}
              </AvatarFallback>
            </Avatar>

            {!disabled && !isUploading && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/0 opacity-0 transition-all group-hover:bg-slate-950/25 group-hover:opacity-100">
                <span className="rounded-full bg-white/95 p-2 text-slate-700 shadow-sm ring-1 ring-black/5">
                  <Camera className="h-4 w-4" />
                </span>
              </span>
            )}
          </button>

          {!disabled && !isUploading && currentPreviewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-1 -bottom-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-white text-slate-600 shadow-sm transition hover:text-rose-600 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-300"
              aria-label={t('remove')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t('title')}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('description')}
            </p>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('hint')}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
