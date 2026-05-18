'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { useServiceContext } from '@/lib/use-service-context';
import { ImageKitService } from '@/services/imagekit/imagekit.service';
import {
  forgetImageKitFile,
  getImageKitFileId,
  rememberImageKitFile,
} from '@/services/imagekit/imagekit-file-map';

interface OrgLogoUploaderProps {
  currentLogoUrl?: string;
  orgName?: string;
  onUpload: (url: string) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
}

function getInitials(name?: string): string {
  if (!name) return 'O';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

interface LogoOverride {
  url: string | null;
  fileId?: string | null;
}

export function OrgLogoUploader({
  currentLogoUrl,
  orgName,
  onUpload,
  onRemove,
}: OrgLogoUploaderProps) {
  const t = useTranslations('orgConfig.organizationProfile.logoUploader');
  const ctx = useServiceContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoOverride, setLogoOverride] = useState<LogoOverride | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const previewUrl = logoOverride ? (logoOverride.url ?? undefined) : currentLogoUrl;
  const uploadedFileId = useMemo(
    () => logoOverride?.fileId ?? getImageKitFileId(currentLogoUrl),
    [currentLogoUrl, logoOverride?.fileId],
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.danger(t('toasts.fileTooLarge'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    const previousLogoUrl = currentLogoUrl?.trim() ? currentLogoUrl : undefined;
    const previousFileId = getImageKitFileId(previousLogoUrl) ?? uploadedFileId;

    setLogoOverride({ url: localPreview, fileId: previousFileId });
    setIsUploading(true);

    try {
      const imageKit = new ImageKitService(ctx);
      const result = await imageKit.upload(file, 'organizations/logos');
      const isSaved = await onUpload(result.url);

      if (!isSaved) {
        void imageKit.deleteFile(result.fileId).catch(() => undefined);
        setLogoOverride(null);
        return;
      }

      rememberImageKitFile(result.url, result.fileId);
      setLogoOverride({ url: result.url, fileId: result.fileId });

      if (previousLogoUrl && previousFileId && previousFileId !== result.fileId) {
        forgetImageKitFile(previousLogoUrl);
        void imageKit.deleteFile(previousFileId).catch(() => undefined);
      }
    } catch {
      setLogoOverride(null);
      toast.danger(t('toasts.uploadFailed'));
    } finally {
      URL.revokeObjectURL(localPreview);
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemoveClick() {
    if (!previewUrl || isUploading || isRemoving) return;
    setIsRemoveDialogOpen(true);
  }

  async function handleRemoveConfirm() {
    if (!previewUrl || isUploading || isRemoving) return;

    const currentRemoteUrl =
      currentLogoUrl?.trim() ||
      (previewUrl.startsWith('blob:') ? undefined : previewUrl);
    const currentFileId = uploadedFileId ?? getImageKitFileId(currentRemoteUrl);

    const confirmed = window.confirm(t('removeDialog.confirmNative'));
    if (!confirmed) return;

    setIsRemoveDialogOpen(false);
    setIsRemoving(true);

    try {
      const ok = await onRemove();
      if (!ok) {
        setLogoOverride(null);
        return;
      }

      if (currentRemoteUrl) {
        forgetImageKitFile(currentRemoteUrl);
      }

      if (currentFileId) {
        await new ImageKitService(ctx).deleteFile(currentFileId).catch(() => {
          toast.warning(
            t('toasts.storageDeleteFailed'),
          );
        });
      }

      setLogoOverride({ url: null, fileId: null });
    } catch {
      setLogoOverride(null);
      toast.danger(t('toasts.removeFailed'));
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <div className="group relative">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || isRemoving}
            className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed"
            aria-label={previewUrl ? t('changeLogo') : t('uploadLogo')}
          >
            <Avatar className="h-20 w-20 rounded-full border border-slate-200/80 shadow-sm dark:border-slate-800">
              {previewUrl && <AvatarImage src={previewUrl} alt={orgName ?? t('alt')} />}
              <AvatarFallback className="bg-primary/10 text-primary rounded-full text-xl font-semibold">
                {isUploading || isRemoving ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  getInitials(orgName)
                )}
              </AvatarFallback>
            </Avatar>
          </button>

          {!isUploading && !isRemoving && previewUrl && (
            <>
              <div className="pointer-events-none absolute inset-0 rounded-full bg-slate-950/0 opacity-0 transition-all group-hover:bg-slate-950/30 group-hover:opacity-100" />
              <button
                type="button"
                onClick={handleRemoveClick}
                className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
                aria-label={t('removeLogo')}
              >
                <span className="rounded-full bg-white/95 p-2 text-rose-600 shadow-sm ring-1 ring-black/5">
                  <Trash2 className="h-4 w-4" />
                </span>
              </button>
            </>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {previewUrl ? t('replaceHint') : t('uploadHint')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('requirements')}
            {previewUrl ? ` ${t('deleteHint')}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading || isRemoving}
              className="rounded-full border-[var(--brand-muted)] text-[var(--brand)] hover:bg-[var(--brand-light)] hover:text-[var(--brand)]"
            >
              <Camera className="mr-2 h-4 w-4" />
              {previewUrl ? t('changeLogo') : t('uploadLogo')}
            </Button>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removeDialog.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>{t('removeDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={isRemoving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isRemoving ? t('removeDialog.deleting') : t('removeDialog.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
