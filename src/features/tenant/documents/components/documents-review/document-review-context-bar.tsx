import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DocumentResponse } from '@/services/documents';

interface DocumentReviewContextBarProps {
  document?: DocumentResponse | null;
}

export function DocumentReviewContextBar({ document }: DocumentReviewContextBarProps) {
  const statusLabel =
    document?.status === 'indexed'
      ? 'Indexed'
      : document?.status === 'processing'
        ? 'Processing'
        : (document?.status ?? 'Unknown');

  return (
    <div className="bg-background flex shrink-0 items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <Link href="../">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>Knowledge Base</span>
            <span>›</span>
            <span>Documents</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-base font-semibold">
              {document?.title ?? 'Select a document to review'}
            </h1>
            {document && (
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
              >
                {statusLabel}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {document && (
          <span className="text-muted-foreground text-xs">
            Updated: {new Date(document.updatedAt).toLocaleString()}
          </span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
