'use client';

import { useState } from 'react';
import { useDocumentById } from '../query/use-documents';
import type { ReviewChunk } from '../components/documents-review/document-review-ai-panel';

interface UseDocumentReviewOptions {
  documentId?: string;
}

export function useDocumentReview({ documentId }: UseDocumentReviewOptions) {
  const { data: document } = useDocumentById(documentId ?? '');
  const [tags, setTags] = useState<string[]>([]);
  const [activeChunk, setActiveChunk] = useState('');
  const [zoom, setZoom] = useState(100);

  // Chunks will be populated when a chunk API endpoint is available
  const chunks: ReviewChunk[] = [];
  const avgConfidence = 0;

  function removeTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  return {
    document,
    tags,
    setTags,
    activeChunk,
    setActiveChunk,
    zoom,
    setZoom,
    chunks,
    avgConfidence,
    removeTag,
  };
}
