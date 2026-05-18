import { cn } from '@/lib/utils';
import type { FileKind } from '../data/team-chat-ui-data';
import { resolveTeamChatFileIconDescriptor } from '../lib/team-chat-icon-assets';

type TeamChatAttachmentKind = 'file' | 'image' | 'video' | 'audio';

interface TeamChatFileTypeIconProps {
  attachmentType?: TeamChatAttachmentKind | null;
  className?: string;
  documentType?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  iconClassName?: string;
  imageClassName?: string;
  kind?: FileKind | null;
  mimeType?: string | null;
}

export function TeamChatFileTypeIcon({
  attachmentType,
  className,
  documentType,
  fileName,
  fileUrl,
  iconClassName,
  imageClassName,
  kind,
  mimeType,
}: TeamChatFileTypeIconProps) {
  const descriptor = resolveTeamChatFileIconDescriptor({
    attachmentType,
    documentType,
    fileName,
    fileUrl,
    kind,
    mimeType,
  });
  const FallbackIcon = descriptor.fallbackIcon;

  if (descriptor.assetPath) {
    return (
      <img
        src={descriptor.assetPath}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={cn('h-[66%] w-[66%] object-contain', className, imageClassName)}
      />
    );
  }

  return <FallbackIcon aria-hidden="true" className={cn('h-[58%] w-[58%]', className, iconClassName)} />;
}
