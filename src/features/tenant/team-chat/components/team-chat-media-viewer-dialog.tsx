'use client';

import type { MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { focusRingClass } from '../lib/team-chat-screen.shared';

export interface TeamChatMediaViewerItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  alt: string;
  fileName: string;
  sizeLabel?: string;
  statusLabel?: string;
}

interface TeamChatMediaViewerDialogProps {
  activeIndex: number;
  items: TeamChatMediaViewerItem[];
  open: boolean;
  onActiveIndexChange: (nextIndex: number) => void;
  onOpenChange: (open: boolean) => void;
}

const MIN_IMAGE_ZOOM = 1;
const MAX_IMAGE_ZOOM = 3;
const IMAGE_ZOOM_STEP = 0.25;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function TeamChatMediaViewerDialog({
  activeIndex,
  items,
  open,
  onActiveIndexChange,
  onOpenChange,
}: TeamChatMediaViewerDialogProps) {
  const t = useTranslations('teamChat');
  const [imageZoom, setImageZoom] = useState(MIN_IMAGE_ZOOM);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageViewportRef = useRef<HTMLDivElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    originX: number;
    originY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const hasItems = items.length > 0;
  const currentIndex = hasItems ? Math.min(Math.max(activeIndex, 0), items.length - 1) : 0;
  const currentItem = items[currentIndex];
  const canNavigate = items.length > 1;
  const isImage = currentItem?.type === 'image';
  const canPanImage = isImage && imageZoom > MIN_IMAGE_ZOOM;
  const imageZoomLabel = useMemo(
    () => `${Math.round(imageZoom * 100)}%`,
    [imageZoom],
  );

  useEffect(() => {
    if (!open) return;
    const frameId = window.requestAnimationFrame(() => {
      setImageZoom(MIN_IMAGE_ZOOM);
      setImagePan({ x: 0, y: 0 });
      setIsImageDragging(false);
      dragStateRef.current = null;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [currentItem?.id, open]);

  const clampImagePan = useCallback(
    (nextPan: { x: number; y: number }) => {
      if (imageZoom <= MIN_IMAGE_ZOOM) {
        return { x: 0, y: 0 };
      }

      const viewport = imageViewportRef.current;
      const image = imageElementRef.current;

      if (!viewport || !image) {
        return { x: 0, y: 0 };
      }

      const viewportRect = viewport.getBoundingClientRect();
      const baseWidth = image.clientWidth;
      const baseHeight = image.clientHeight;

      if (viewportRect.width <= 0 || viewportRect.height <= 0 || baseWidth <= 0 || baseHeight <= 0) {
        return { x: 0, y: 0 };
      }

      const scaledWidth = baseWidth * imageZoom;
      const scaledHeight = baseHeight * imageZoom;
      const maxX = Math.max(0, (scaledWidth - viewportRect.width) / 2);
      const maxY = Math.max(0, (scaledHeight - viewportRect.height) / 2);

      return {
        x: clamp(nextPan.x, -maxX, maxX),
        y: clamp(nextPan.y, -maxY, maxY),
      };
    },
    [imageZoom],
  );

  useEffect(() => {
    if (!open || !isImage) return;

    const frameId = window.requestAnimationFrame(() => {
      if (imageZoom <= MIN_IMAGE_ZOOM) {
        setImagePan({ x: 0, y: 0 });
        return;
      }

      setImagePan((currentPan) => clampImagePan(currentPan));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [clampImagePan, imageZoom, isImage, open]);

  useEffect(() => {
    if (!open || !canNavigate) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onActiveIndexChange(currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onActiveIndexChange(currentIndex >= items.length - 1 ? 0 : currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canNavigate, currentIndex, items.length, onActiveIndexChange, open]);

  useEffect(() => {
    if (!open || !isImageDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      setImagePan(
        clampImagePan({
          x: dragState.originX + deltaX,
          y: dragState.originY + deltaY,
        }),
      );
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      setIsImageDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [clampImagePan, isImageDragging, open]);

  if (!currentItem) {
    return null;
  }

  const downloadCurrentItem = () => {
    const link = document.createElement('a');
    link.href = currentItem.src;
    link.download = currentItem.fileName;
    link.rel = 'noreferrer';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImageZoomOut = () =>
    setImageZoom((currentZoom) =>
      Math.max(MIN_IMAGE_ZOOM, currentZoom - IMAGE_ZOOM_STEP),
    );

  const handleImageZoomIn = () =>
    setImageZoom((currentZoom) =>
      Math.min(MAX_IMAGE_ZOOM, currentZoom + IMAGE_ZOOM_STEP),
    );

  const resetImageZoom = () => {
    setImageZoom(MIN_IMAGE_ZOOM);
    setImagePan({ x: 0, y: 0 });
    setIsImageDragging(false);
    dragStateRef.current = null;
  };

  const handleImageMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!canPanImage) return;

    event.preventDefault();
    dragStateRef.current = {
      originX: imagePan.x,
      originY: imagePan.y,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsImageDragging(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="!top-[5vh] !left-[5vw] !h-[90vh] !w-[90vw] !max-w-none !translate-x-0 !translate-y-0 border-white/10 bg-[#111214]/98 flex flex-col overflow-hidden rounded-[30px] p-0 shadow-[0_38px_120px_-34px_rgba(0,0,0,0.82)] sm:!max-w-none"
      >
        <DialogHeader className="gap-1 border-b border-white/8 bg-[#111214]/96 px-6 py-5 pr-28">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base font-semibold text-white">
              {currentItem.fileName}
            </DialogTitle>
            <DialogDescription className="mt-1 flex items-center gap-2 text-xs text-white/65">
              <span>
                {currentIndex + 1} / {items.length}
              </span>
              {currentItem.sizeLabel ? <span>{currentItem.sizeLabel}</span> : null}
              {currentItem.statusLabel ? <span>{currentItem.statusLabel}</span> : null}
            </DialogDescription>
          </div>
        </DialogHeader>

        <button
          type="button"
          onClick={downloadCurrentItem}
          className={cn(
            'absolute top-4 right-14 z-[60] inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/55 text-white shadow-sm backdrop-blur transition-colors hover:bg-black/72',
            focusRingClass,
          )}
          aria-label={t('mediaViewer.download', { name: currentItem.fileName })}
        >
          <Download className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_30%),linear-gradient(180deg,#060708_0%,#0a0b0d_100%)] px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
          {canNavigate ? (
            <button
              type="button"
              onClick={() =>
                onActiveIndexChange(currentIndex <= 0 ? items.length - 1 : currentIndex - 1)
              }
              className={cn(
                'absolute left-5 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/58 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/78',
                focusRingClass,
              )}
              aria-label={t('mediaViewer.previous')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div
            ref={imageViewportRef}
            className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[26px] border border-white/8 bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <div className="flex h-full w-full items-center justify-center p-4 sm:p-5">
              {isImage ? (
                <div
                  onMouseDown={handleImageMouseDown}
                  className={cn(
                    'flex h-full w-full items-center justify-center',
                    canPanImage
                      ? isImageDragging
                        ? 'cursor-grabbing'
                        : 'cursor-grab'
                      : 'cursor-default',
                  )}
                >
                  <img
                    ref={imageElementRef}
                    src={currentItem.src}
                    alt={currentItem.alt}
                    className="block h-auto max-h-full w-auto max-w-full shrink-0 select-none object-contain transition-transform duration-200"
                    style={{
                      transform: canPanImage
                        ? `translate3d(${imagePan.x}px, ${imagePan.y}px, 0) scale(${imageZoom})`
                        : 'scale(1)',
                      transformOrigin: 'center center',
                      willChange: canPanImage ? 'transform' : undefined,
                    }}
                    onLoad={() => {
                      setImagePan((currentPan) => clampImagePan(currentPan));
                    }}
                    draggable={false}
                  />
                </div>
              ) : (
                <video
                  src={currentItem.src}
                  controls
                  playsInline
                  autoPlay
                  className="block h-auto max-h-full w-auto max-w-full object-contain"
                />
              )}
            </div>
          </div>

          {canNavigate ? (
            <button
              type="button"
              onClick={() =>
                onActiveIndexChange(currentIndex >= items.length - 1 ? 0 : currentIndex + 1)
              }
              className={cn(
                'absolute right-5 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/58 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/78',
                focusRingClass,
              )}
              aria-label={t('mediaViewer.next')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}

          {isImage ? (
            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2 py-2 text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] backdrop-blur">
              <button
                type="button"
                onClick={handleImageZoomOut}
                disabled={imageZoom <= MIN_IMAGE_ZOOM}
                className={cn(
                  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45',
                  focusRingClass,
                )}
                aria-label={t('mediaViewer.zoomOut')}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetImageZoom}
                className={cn(
                  'min-w-[76px] cursor-pointer rounded-full px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10',
                  focusRingClass,
                )}
                aria-label={t('mediaViewer.resetZoom')}
              >
                {imageZoomLabel}
              </button>
              <button
                type="button"
                onClick={handleImageZoomIn}
                disabled={imageZoom >= MAX_IMAGE_ZOOM}
                className={cn(
                  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45',
                  focusRingClass,
                )}
                aria-label={t('mediaViewer.zoomIn')}
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetImageZoom}
                className={cn(
                  'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10',
                  focusRingClass,
                )}
                aria-label={t('mediaViewer.fitToViewport')}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
