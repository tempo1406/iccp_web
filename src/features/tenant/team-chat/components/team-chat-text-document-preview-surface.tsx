'use client';

import { cn } from '@/lib/utils';

function getTextDocumentPreviewLineClass(line: string, fileName: string) {
  const normalizedLine = line.trim();
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex < 0 ? '' : fileName.slice(lastDotIndex + 1).trim().toLowerCase();

  if (extension === 'md' && normalizedLine.startsWith('#')) {
    return 'font-semibold text-slate-50';
  }

  if (
    extension === 'json' &&
    (normalizedLine === '{' ||
      normalizedLine === '}' ||
      normalizedLine === '[' ||
      normalizedLine === ']' ||
      normalizedLine.endsWith('{') ||
      normalizedLine.endsWith('[') ||
      normalizedLine.endsWith('},') ||
      normalizedLine.endsWith('],'))
  ) {
    return 'text-sky-200';
  }

  return 'text-slate-100/92';
}

export function TeamChatTextDocumentPreviewSurface({
  fileName,
  isLoading,
  lines,
}: {
  fileName: string;
  isLoading: boolean;
  lines: string[];
}) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#08111f_0%,#0b1730_100%)]">
      <div className="flex items-center gap-2 border-b border-white/6 bg-white/[0.02] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/14" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/8" />
        <div className="ml-2 h-2.5 w-24 rounded-full bg-white/10" />
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4 py-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-3 w-5 rounded-full bg-white/8" />
              <div
                className={cn(
                  'h-3 rounded-full bg-white/10',
                  index % 3 === 0 ? 'w-[78%]' : index % 3 === 1 ? 'w-[64%]' : 'w-[86%]',
                )}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative h-[calc(100%-49px)] overflow-hidden">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 px-4 py-4 font-mono text-[12.5px] leading-6 sm:px-5">
            {lines.map((line, index) => (
              <div key={fileName + '-line-' + index} className="contents">
                <span className="select-none pt-px text-right text-[11px] text-slate-500/80">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'min-w-0 whitespace-pre-wrap break-words',
                    getTextDocumentPreviewLineClass(line, fileName),
                  )}
                >
                  {line}
                </span>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b1730] via-[#0b1730]/76 to-transparent" />
        </div>
      )}
    </div>
  );
}
