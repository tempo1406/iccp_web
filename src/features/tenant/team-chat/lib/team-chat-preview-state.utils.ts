type PreviewValue = string | null | undefined;

type TeamChatAttachmentPreviewLike = {
  previewStatus?: PreviewValue;
  previewAssetSource?: PreviewValue;
  thumbnailUrl?: PreviewValue;
  thumbnailUrlSmall?: PreviewValue;
  thumbnailUrlMedium?: PreviewValue;
};

type TeamChatLinkPreviewAssetLike = {
  previewAssetStatus?: PreviewValue;
  previewAssetSource?: PreviewValue;
  previewAssetId?: PreviewValue;
  previewAssetErrorCode?: PreviewValue;
};

function normalizePreviewValue(value?: PreviewValue) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return undefined;
  return normalizedValue.toLowerCase();
}

function coalescePreviewValue(...values: PreviewValue[]) {
  for (const value of values) {
    const normalizedValue = value?.trim();
    if (normalizedValue) return normalizedValue;
  }

  return undefined;
}

export function hasRealTeamChatAttachmentThumbnail(
  attachment: TeamChatAttachmentPreviewLike,
) {
  const previewStatus = normalizePreviewValue(attachment.previewStatus);
  const previewAssetSource = normalizePreviewValue(attachment.previewAssetSource);

  if (previewStatus !== 'ready') return false;
  if (previewAssetSource !== 'rendered' && previewAssetSource !== 'derived') return false;

  return Boolean(
    coalescePreviewValue(attachment.thumbnailUrlMedium, attachment.thumbnailUrl),
  );
}

export function isTeamChatAttachmentPreviewPending(
  attachment: TeamChatAttachmentPreviewLike,
) {
  return normalizePreviewValue(attachment.previewStatus) === 'pending';
}

export function resolveTeamChatAttachmentThumbnailUrls(
  attachment: TeamChatAttachmentPreviewLike,
) {
  if (!hasRealTeamChatAttachmentThumbnail(attachment)) {
    return {
      thumbnailUrl: undefined,
      thumbnailUrlSmall: undefined,
      thumbnailUrlMedium: undefined,
    };
  }

  return {
    thumbnailUrl: coalescePreviewValue(attachment.thumbnailUrl),
    thumbnailUrlSmall: coalescePreviewValue(attachment.thumbnailUrlSmall),
    thumbnailUrlMedium: coalescePreviewValue(attachment.thumbnailUrlMedium),
  };
}

export function resolveTeamChatAttachmentDocumentPreviewUrl(
  attachment: TeamChatAttachmentPreviewLike,
) {
  const { thumbnailUrlMedium, thumbnailUrl } = resolveTeamChatAttachmentThumbnailUrls(
    attachment,
  );

  return thumbnailUrlMedium ?? thumbnailUrl;
}

export function hasExplicitTeamChatLinkPreviewAssetState(
  preview: TeamChatLinkPreviewAssetLike,
) {
  return Boolean(
    coalescePreviewValue(
      preview.previewAssetStatus,
      preview.previewAssetSource,
      preview.previewAssetId,
      preview.previewAssetErrorCode,
    ),
  );
}

export function canRenderRealTeamChatLinkPreviewHeroImage(
  preview: TeamChatLinkPreviewAssetLike,
  candidateImageUrl?: PreviewValue,
) {
  if (!coalescePreviewValue(candidateImageUrl)) return false;
  if (!hasExplicitTeamChatLinkPreviewAssetState(preview)) return true;

  const previewAssetStatus = normalizePreviewValue(preview.previewAssetStatus);
  const previewAssetSource = normalizePreviewValue(preview.previewAssetSource);

  if (previewAssetStatus !== 'ready') return false;

  return (
    previewAssetSource === 'rendered' ||
    previewAssetSource === 'proxied' ||
    previewAssetSource === 'cached' ||
    previewAssetSource === 'external'
  );
}

export function shouldAttemptTeamChatLinkPreviewHeroImageLoad(
  preview: TeamChatLinkPreviewAssetLike,
  candidateImageUrl?: PreviewValue,
) {
  return canRenderRealTeamChatLinkPreviewHeroImage(preview, candidateImageUrl);
}

