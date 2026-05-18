'use client';

import { Download, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPreviewKind } from '@/utils/document-utils';
import type { DocumentResponse } from '@/services/documents';

interface DocumentViewerPanelProps {
  document: Pick<DocumentResponse, 'filePath' | 'fileName' | 'mimeType' | 'fileType'>;
  className?: string;
}

function buildOfficePreviewUrl(filePath: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(filePath)}`;
}

export function DocumentViewerPanel({ document, className }: DocumentViewerPanelProps) {
  const previewKind = getPreviewKind(document);
  const filePath = document.filePath;

  return (
    <section
      className={cn(
        'border-border/70 bg-card relative overflow-hidden rounded-3xl border shadow-sm',
        className,
      )}
    >
      <div className="border-border/70 flex items-center justify-between border-b px-5 py-4">
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">
            Document preview
          </p>
          <p className="text-foreground mt-1 text-sm font-medium">
            {document.fileName ?? 'Untitled document'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-border bg-background text-foreground hover:bg-muted"
          >
            <a href={filePath} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open source
            </a>
          </Button>
          <Button asChild size="sm">
            <a href={filePath} download>
              <Download className="size-4" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-18rem)] min-h-[540px] overflow-hidden bg-slate-50">
        {previewKind === 'image' ? (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.06),transparent_60%)] p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePath}
              alt={document.fileName ?? 'Document preview'}
              className="border-border max-h-full max-w-full rounded-3xl border bg-white object-contain shadow-xl"
            />
          </div>
        ) : null}

        {previewKind === 'pdf' ? (
          <iframe
            title={document.fileName ?? 'PDF preview'}
            src={filePath}
            className="h-full w-full border-0 bg-white"
          />
        ) : null}

        {previewKind === 'text' ? (
          <iframe
            title={document.fileName ?? 'Text preview'}
            src={filePath}
            className="h-full w-full border-0 bg-white"
          />
        ) : null}

        {previewKind === 'office' ? (
          <iframe
            title={document.fileName ?? 'Office preview'}
            src={buildOfficePreviewUrl(filePath)}
            className="h-full w-full border-0 bg-white"
          />
        ) : null}

        {previewKind === 'download' ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="bg-primary/8 text-primary rounded-3xl p-5">
              <FileText className="size-10" />
            </div>
            <div>
              <p className="text-foreground text-lg font-medium">
                Inline preview is not available
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                This file type can still be opened in a new tab or downloaded directly
                from ImageKit.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                asChild
                variant="outline"
                className="border-border bg-background text-foreground hover:bg-muted"
              >
                <a href={filePath} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Open source
                </a>
              </Button>
              <Button asChild>
                <a href={filePath} download>
                  <Download className="size-4" />
                  Download file
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
