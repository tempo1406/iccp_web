'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Eye,
  KeyRound,
  PencilLine,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/common/constant/routes';
import { useTenant } from '@/providers';
import {
  formatDocumentDate,
  formatDocumentSize,
  getAccessScopeLabel,
  getDocumentStatusLabel,
  getDocumentStatusTone,
} from '@/utils/document-utils';

import type { DocumentResponse } from '@/services/documents';

interface DocumentDetailHeaderProps {
  document: DocumentResponse;
  canEdit: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canManageAccess: boolean;
  canUploadVersion: boolean;
  isPreviewingHistoricVersion: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onManageAccess: () => void;
  onOpenUploadVersion: () => void;
  onExitVersionPreview: () => void;
}

export function DocumentDetailHeader({
  document,
  canEdit,
  canDelete,
  canDownload,
  canManageAccess,
  canUploadVersion,
  isPreviewingHistoricVersion,
  onEdit,
  onDelete,
  onManageAccess,
  onOpenUploadVersion,
  onExitVersionPreview,
}: DocumentDetailHeaderProps) {
  const { tenantId } = useTenant();

  return (
    <header className="border-border/70 bg-card rounded-xl border px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-4xl min-w-0">
          <Link
            href={ROUTES.tenant.documents(tenantId ?? '')}
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1.5 text-xs transition"
          >
            <ArrowLeft className="size-3.5" />
            Back to document manager
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              {document.title}
            </h1>
            <Badge
              variant="outline"
              className={`border-0 ring-1 ${getDocumentStatusTone(document.status)}`}
            >
              {getDocumentStatusLabel(document.status)}
            </Badge>
            <Badge
              variant="outline"
              className="border-border bg-background text-muted-foreground"
            >
              {getAccessScopeLabel(document.accessScope, document.accessRules)}
            </Badge>
            <Badge
              variant="outline"
              className="border-border bg-background text-muted-foreground"
            >
              v{document.version}
            </Badge>
          </div>

          <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>{document.fileName ?? 'Unknown'}</span>
            <span>{formatDocumentSize(document.fileSize)}</span>
            <span>{formatDocumentDate(document.updatedAt)}</span>
          </div>
          {document.description ? (
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
              {document.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isPreviewingHistoricVersion ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
              onClick={onExitVersionPreview}
            >
              <Eye className="size-3.5" />
              Exit preview
            </Button>
          ) : null}

          {canManageAccess ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
              title="Manage access"
              onClick={onManageAccess}
            >
              <KeyRound className="size-3.5" />
            </Button>
          ) : null}

          {canEdit ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
              title="Edit metadata"
              onClick={onEdit}
            >
              <PencilLine className="size-3.5" />
            </Button>
          ) : null}

          {canUploadVersion ? (
            <Button
              size="sm"
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
              title="Upload new version"
              onClick={onOpenUploadVersion}
            >
              <UploadCloud className="size-3.5" />
            </Button>
          ) : null}

          {canDownload ? (
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-border bg-background text-foreground hover:bg-muted"
            >
              <a href={document.filePath} download>
                <Download className="size-3.5" />
                Download
              </a>
            </Button>
          ) : null}

          {canDelete ? (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
