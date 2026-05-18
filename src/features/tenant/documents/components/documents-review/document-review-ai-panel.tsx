import { Ban, CheckCircle, Edit, MessageSquare, Sparkles, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface ReviewChunk {
  id: string;
  text: string;
  confidence: number;
  isEdited?: boolean;
  position: number;
}

interface DocumentReviewAiPanelProps {
  title: string;
  author: string;
  date: string;
  tags: string[];
  chunks: ReviewChunk[];
  activeChunk: string;
  avgConfidence: number;
  onActiveChunkChange: (id: string) => void;
  onRemoveTag: (tag: string) => void;
}

function confidenceBadge(confidence: number) {
  if (confidence >= 95) {
    return (
      <Badge className="border-green-200 bg-green-100 text-[10px] font-bold text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
        {confidence}% CONFIDENCE
      </Badge>
    );
  }

  if (confidence >= 90) {
    return (
      <Badge className="border-yellow-200 bg-yellow-100 text-[10px] font-bold text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-400">
        {confidence}% CONFIDENCE
      </Badge>
    );
  }

  return (
    <Badge className="border-amber-200 bg-amber-100 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
      {confidence}% CONFIDENCE
    </Badge>
  );
}

export function DocumentReviewAiPanel({
  title,
  author,
  date,
  tags,
  chunks,
  activeChunk,
  avgConfidence,
  onActiveChunkChange,
  onRemoveTag,
}: DocumentReviewAiPanelProps) {
  return (
    <div className="bg-background flex w-[480px] shrink-0 flex-col border-l">
      <div className="shrink-0 border-b p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            <h3 className="font-bold">AI Suggested Metadata</h3>
          </div>
          <Button variant="link" size="sm" className="text-primary h-auto p-0">
            Edit All
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Document Title
            </label>
            <Input defaultValue={title} />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Author
            </label>
            <Input defaultValue={author} />
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Date
            </label>
            <Input defaultValue={date} />
          </div>
          <div className="col-span-2">
            <label className="text-muted-foreground mb-1 block text-xs font-medium">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => onRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="outline" size="sm" className="h-6 border-dashed text-xs">
                + Add
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 flex min-h-0 flex-1 flex-col">
        <div className="bg-background flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-bold">Indexed Chunks ({chunks.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Avg Confidence:</span>
            <span className="text-xs font-bold text-green-500">{avgConfidence}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {chunks.map((chunk) => (
            <Card
              key={chunk.id}
              className={`group cursor-pointer transition-all ${
                activeChunk === chunk.id
                  ? 'border-primary ring-primary/10 border-2 ring-4'
                  : 'hover:border-primary/50 hover:shadow-md'
              }`}
              onClick={() => onActiveChunkChange(chunk.id)}
            >
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  {confidenceBadge(chunk.confidence)}
                  <div
                    className={`flex gap-1 transition-opacity ${
                      activeChunk === chunk.id
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-destructive h-6 w-6"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {activeChunk === chunk.id && chunk.isEdited ? (
                  <div className="relative">
                    <Textarea
                      defaultValue={chunk.text}
                      className="resize-none"
                      rows={4}
                    />
                    <span className="text-muted-foreground absolute right-2 bottom-2 text-[10px]">
                      Edited
                    </span>
                  </div>
                ) : (
                  <p className="line-clamp-3 text-sm leading-relaxed">{chunk.text}</p>
                )}

                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground font-mono text-[10px]">
                    ID: {chunk.id}...
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    Chunk {chunk.position} of {chunks.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-background shrink-0 border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            <Ban className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button variant="outline" className="flex-1">
            <MessageSquare className="mr-2 h-4 w-4" />
            Request Changes
          </Button>
          <Button className="flex-[2] shadow-lg">
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve for RAG
            <kbd className="bg-primary-foreground/20 ml-2 rounded px-1.5 text-[10px]">
              Cmd+Enter
            </kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}
