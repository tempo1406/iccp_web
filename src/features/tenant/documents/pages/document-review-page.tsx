'use client';

import { useDocumentReview } from '../hooks/use-document-review';
import { DocumentReviewAiPanel } from '../components/documents-review/document-review-ai-panel';
import { DocumentReviewContextBar } from '../components/documents-review/document-review-context-bar';
import { DocumentReviewSourceViewer } from '../components/documents-review/document-review-source-viewer';

interface DocumentReviewPageProps {
  documentId?: string;
}

export function DocumentReviewPage({ documentId }: DocumentReviewPageProps) {
  const {
    document,
    tags,
    activeChunk,
    setActiveChunk,
    zoom,
    setZoom,
    chunks,
    avgConfidence,
    removeTag,
  } = useDocumentReview({ documentId });

  if (!documentId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground text-sm">No document selected for review.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <DocumentReviewContextBar document={document ?? null} />

      <div className="flex flex-1 overflow-hidden">
        <DocumentReviewSourceViewer zoom={zoom} onZoomChange={setZoom} />
        <DocumentReviewAiPanel
          title={document?.title ?? ''}
          author=""
          date={document ? new Date(document.createdAt).toLocaleDateString() : ''}
          tags={tags}
          chunks={chunks}
          activeChunk={activeChunk}
          avgConfidence={avgConfidence}
          onActiveChunkChange={setActiveChunk}
          onRemoveTag={removeTag}
        />
      </div>
    </div>
  );
}
