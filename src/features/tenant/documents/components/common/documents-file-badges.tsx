'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getDocumentStatusLabel,
  getDocumentStatusTone,
} from '@/utils/document-utils';

export function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn('border-0 ring-1', getDocumentStatusTone(status))}
    >
      {getDocumentStatusLabel(status)}
    </Badge>
  );
}
