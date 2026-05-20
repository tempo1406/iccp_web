'use client';

import { Eye, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  formatDocumentDate,
  formatDocumentSize,
} from '@/utils/document-utils';
import type { DocumentVersionResponse } from '@/services/documents';

interface DocumentVersionPanelProps {
  versions: DocumentVersionResponse[];
  currentVersion: number;
  previewedVersionId?: string | null;
  onPreviewVersion: (version: DocumentVersionResponse) => void;
  onOpenUploadVersion: () => void;
}

export function DocumentVersionPanel({
  versions,
  currentVersion,
  previewedVersionId,
  onPreviewVersion,
  onOpenUploadVersion,
}: DocumentVersionPanelProps) {
  const orderedVersions = [...versions].sort((left, right) => right.version - left.version);

  return (
    <section className="border-border/70 bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border/70 flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
            Versions
          </p>
          <h3 className="text-foreground mt-1 text-lg font-semibold">
            File history
          </h3>
          <p className="text-muted-foreground mt-1 text-sm">
            {versions.length} version{versions.length === 1 ? '' : 's'} available
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-border bg-background text-foreground hover:bg-muted shrink-0"
          onClick={onOpenUploadVersion}
        >
          <Sparkles className="size-3.5" />
          Upload
        </Button>
      </div>

      {versions.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <div className="bg-primary/8 text-primary rounded-2xl p-4">
            <History className="size-8" />
          </div>
          <div>
            <p className="text-foreground text-base font-medium">No version history yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Upload a new file version to start tracking document evolution.
            </p>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-[360px]">
          <div className="space-y-3 p-4">
            {orderedVersions.map((version) => {
              const isCurrent = version.version === currentVersion;
              const isPreviewing = previewedVersionId === version.id;

              return (
                <article
                  key={version.id}
                  className={cn(
                    'border-border/70 bg-muted/20 rounded-xl border p-3',
                    isPreviewing && 'border-primary/30 bg-primary/5',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className="border-border bg-background text-muted-foreground rounded-md px-2 py-0.5 text-[10px]"
                    >
                      v{version.version}
                    </Badge>
                    {isCurrent ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-md px-2 py-0.5 text-[10px] shadow-none">
                        Current
                      </Badge>
                    ) : null}
                    {isPreviewing ? (
                      <Badge className="bg-primary/12 text-primary hover:bg-primary/12 rounded-md px-2 py-0.5 text-[10px] shadow-none">
                        Previewing
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <p className="text-foreground text-sm font-medium leading-5 [overflow-wrap:anywhere]">
                      {version.fileName ?? 'Version file'}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs">
                    <div className="text-muted-foreground flex items-center justify-between gap-3">
                      <span>Size</span>
                      <span className="text-foreground font-medium">
                        {formatDocumentSize(version.fileSize)}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-start justify-between gap-3">
                      <span>Uploaded</span>
                      <span className="text-foreground max-w-[150px] text-right font-medium">
                        {formatDocumentDate(version.createdAt)}
                      </span>
                    </div>
                  </div>

                  {version.changeNotes ? (
                    <div className="border-border/70 bg-background mt-3 rounded-lg border px-3 py-2.5">
                      <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
                        Notes
                      </p>
                      <p className="text-foreground/85 mt-1.5 text-xs leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap">
                        {version.changeNotes}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3 flex justify-end">
                    <Button
                      size="xs"
                      variant={isPreviewing ? 'secondary' : 'outline'}
                      className="border-border bg-background text-foreground hover:bg-muted"
                      onClick={() => onPreviewVersion(version)}
                    >
                      <Eye className="size-3.5" />
                      {isPreviewing ? 'Previewing' : 'Preview'}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}
