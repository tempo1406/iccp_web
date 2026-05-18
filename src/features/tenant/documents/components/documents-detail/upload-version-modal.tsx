'use client';

import { useState } from 'react';
import { ArrowUpRight, FileUp, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { useUploadDocumentVersion } from '../../query/use-documents';
import { formatDocumentSize } from '@/utils/document-utils';
import { appConfig, validateDocumentFile } from '@/common/constant/app';

interface UploadVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentVersion: number;
}

export function UploadVersionModal({
  open,
  onOpenChange,
  documentId,
  currentVersion,
}: UploadVersionModalProps) {
  const uploadVersion = useUploadDocumentVersion(documentId);
  const [file, setFile] = useState<File | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  function handleClose(openState: boolean) {
    if (!openState) {
      setFile(null);
      setChangeNotes('');
      setIsDragging(false);
    }
    onOpenChange(openState);
  }

  function handleFileSelect(incoming: File | null) {
    if (!incoming) return;
    const err = validateDocumentFile(incoming);
    if (err) {
      toast.danger(err);
      return;
    }
    setFile(incoming);
  }

  async function handleSubmit() {
    if (!file) {
      toast.danger('Choose a file for the new version.');
      return;
    }

    const result = await uploadVersion.mutateAsync({
      file,
      changeNotes: changeNotes.trim() || undefined,
    });

    if (!result.ok) {
      toast.danger(result.error.message);
      return;
    }

    toast.success('New version uploaded.');
    setFile(null);
    setChangeNotes('');
    handleClose(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-border/70 bg-background !flex max-h-[90vh] !w-[min(96vw,1040px)] !max-w-[1040px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:!max-w-[1040px]">
        <DialogHeader className="border-border/70 bg-card shrink-0 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary inline-flex shrink-0 rounded-xl p-2.5">
              <RefreshCw className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-xl">
                Upload new version
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1 text-sm">
                Replace the active source file and keep the document history clean. Current version is{' '}
                <span className="text-foreground font-medium">v{currentVersion}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1.1fr)_320px]">
          <div
            className="border-border/70 flex min-w-0 flex-col overflow-y-auto border-b p-6 lg:border-r lg:border-b-0"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelect(e.dataTransfer.files[0] ?? null);
            }}
          >
            <div className="mb-4">
              <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
                Source file
              </p>
              <h3 className="text-foreground mt-1 text-lg font-semibold">
                Choose the replacement file
              </h3>
            </div>

            <label
              className={cn(
                'block min-h-[320px] cursor-pointer rounded-2xl border-2 border-dashed p-6 transition',
                isDragging
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-primary/20 bg-primary/[0.04] hover:border-primary/40 hover:bg-primary/[0.07]',
              )}
            >
              <input
                type="file"
                accept={appConfig.upload.acceptAttr}
                className="hidden"
                onChange={(event) => handleFileSelect(event.target.files?.[0] ?? null)}
              />
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="bg-primary/10 text-primary inline-flex rounded-2xl p-4">
                  <FileUp className="size-8" />
                </div>
                <div>
                  <p className="text-foreground text-lg font-semibold">
                    {file ? 'Replacement file selected' : 'Choose a new file'}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {file
                      ? 'Click again or drag another file here to replace it.'
                      : `Drag and drop here, or click to browse. ${appConfig.upload.acceptLabel} · up to ${appConfig.upload.maxFileSizeMb} MB`}
                  </p>
                </div>
                {!file ? (
                  <Button type="button" size="sm" className="mt-2 pointer-events-none">
                    <ArrowUpRight className="size-3.5" />
                    Browse files
                  </Button>
                ) : null}
              </div>

              {file ? (
                <div className="border-border/70 bg-background/80 mt-6 rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold [overflow-wrap:anywhere]">
                        {file.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className="border-border bg-background text-foreground text-xs"
                        >
                          {formatDocumentSize(file.size)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-border bg-background text-muted-foreground text-xs"
                        >
                          {file.type || 'Unknown type'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setFile(null);
                      }}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </label>
          </div>

          <div className="bg-muted/20 min-w-0 shrink-0 overflow-y-auto p-6">
            <div className="space-y-5">
              <section className="border-border/70 bg-card rounded-xl border p-4 shadow-sm">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
                  Version update
                </p>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Current</span>
                    <Badge
                      variant="outline"
                      className="border-border bg-background text-foreground"
                    >
                      v{currentVersion}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Next</span>
                    <Badge className="rounded-md px-2 py-0.5 shadow-none">
                      v{currentVersion + 1}
                    </Badge>
                  </div>
                </div>
              </section>

              <div className="space-y-2">
                <label className="text-muted-foreground text-xs font-medium">
                  Change notes
                </label>
                <Textarea
                  value={changeNotes}
                  onChange={(event) => setChangeNotes(event.target.value)}
                  className="border-border bg-background text-foreground min-h-[220px] resize-none text-sm"
                  placeholder="What changed in this version?"
                />
                <p className="text-muted-foreground text-xs leading-5">
                  Keep this short and specific so version history stays easy to scan.
                </p>
              </div>

              <section className="border-border/70 bg-background rounded-xl border p-4">
                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.16em] uppercase">
                  Upload rule
                </p>
                <p className="text-foreground mt-2 text-sm leading-6">
                  The new file becomes the active source for this document while older versions stay available in history.
                </p>
              </section>
            </div>
          </div>
        </div>

        <DialogFooter className="border-border/70 bg-muted/20 shrink-0 border-t px-6 py-4">
          <Button
            size="sm"
            variant="outline"
            className="border-border bg-background text-foreground hover:bg-muted"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="min-w-32"
            disabled={uploadVersion.isPending || !file}
            onClick={() => void handleSubmit()}
          >
            {uploadVersion.isPending ? 'Uploading...' : 'Upload version'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
