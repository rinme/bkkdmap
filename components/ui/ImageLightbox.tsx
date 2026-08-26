import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Calendar,
  Layers,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { cn, formatDate, getCategoryBadge } from '@/lib/utils';
import { PlaceCategory } from '@/lib/types';

export interface LightboxImageItem {
  url: string;
  title?: string;
  subtitle?: string;
  category?: string;
  date?: string;
}

export interface ImageLightboxProps {
  images: (string | LightboxImageItem)[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDeletePhoto?: (photoUrl: string) => Promise<void> | void;
  isAdmin?: boolean;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onDeletePhoto,
  isAdmin = false
}) => {
  // Normalize items array
  const items: LightboxImageItem[] = useMemo(() => {
    return images.map((item) => (typeof item === 'string' ? { url: item } : item));
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Swipe gesture tracking state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [touchDelta, setTouchDelta] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Thumbnail container reference
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  // Synchronize currentIndex with initialIndex when opened
  useEffect(() => {
    if (isOpen) {
      const validIndex = Math.max(0, Math.min(initialIndex, items.length - 1));
      setCurrentIndex(validIndex);
      setIsZoomed(false);
      setZoomScale(1);
      setPanPosition({ x: 0, y: 0 });
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialIndex, items.length]);

  // Adjust currentIndex if items length shrinks
  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(items.length - 1);
    }
  }, [items.length, currentIndex]);

  // Reset zoom & pan and reload states when active image index changes
  useEffect(() => {
    setIsZoomed(false);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
    setTouchDelta({ x: 0, y: 0 });
  }, [currentIndex]);

  // Scroll active thumbnail into center view
  useEffect(() => {
    if (activeThumbnailRef.current && thumbnailContainerRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [currentIndex]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => {
      const nextState = !prev;
      setZoomScale(nextState ? 2 : 1);
      setPanPosition({ x: 0, y: 0 });
      return nextState;
    });
  }, []);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is confirming deletion
      if (showDeleteConfirm) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowDeleteConfirm(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '+' || e.key === '=' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        toggleZoom();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showDeleteConfirm, handlePrev, handleNext, toggleZoom, onClose]);

  // Download active photo
  const handleDownload = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem?.url) return;

    try {
      const response = await fetch(currentItem.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = currentItem.url.split('.').pop()?.split('?')[0] || 'jpg';
      const cleanTitle = (currentItem.title || `bangkok-photo-${currentIndex + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      link.download = `${cleanTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentItem.url, '_blank');
    }
  };

  // Delete photo action
  const handleDeleteConfirm = async () => {
    const currentItem = items[currentIndex];
    if (!currentItem?.url || !onDeletePhoto) return;

    try {
      setIsDeleting(true);
      await onDeletePhoto(currentItem.url);
      setShowDeleteConfirm(false);
      if (items.length <= 1) {
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete photo:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mouse pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed || !isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    if (isDragging) setIsDragging(false);
  };

  // Touch handlers for mobile swipe navigation and swipe down to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      if (isZoomed) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (isZoomed && isDragging) {
        setPanPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y
        });
      } else if (!isZoomed) {
        setTouchDelta({ x: deltaX, y: deltaY });
      }
    }
  };

  const handleTouchEnd = () => {
    if (isZoomed) {
      setIsDragging(false);
      touchStartRef.current = null;
      return;
    }

    if (touchStartRef.current) {
      const { x: deltaX, y: deltaY } = touchDelta;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Vertical swipe down to dismiss (swipe down >= 90px and mostly vertical)
      if (deltaY > 90 && absY > absX * 1.3) {
        onClose();
      }
      // Horizontal swipe to navigate (swipe >= 50px and mostly horizontal)
      else if (absX > 50 && absX > absY) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }

    touchStartRef.current = null;
    setTouchDelta({ x: 0, y: 0 });
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex] || { url: '' };
  const hasMultiple = items.length > 1;
  const categoryBadgeInfo = currentItem.category ? getCategoryBadge(currentItem.category as PlaceCategory) : null;

  // Calculate transform for smooth drag / swipe feedback
  const imageTransform = isZoomed
    ? `scale(${zoomScale}) translate(${panPosition.x / zoomScale}px, ${panPosition.y / zoomScale}px)`
    : `translate(${touchDelta.x * 0.4}px, ${touchDelta.y > 0 ? touchDelta.y * 0.8 : 0}px) scale(${
        touchDelta.y > 0 ? Math.max(0.75, 1 - touchDelta.y / 800) : 1
      })`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none touch-none animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox Viewer"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-xl transition-opacity duration-300"
        onClick={() => {
          if (!isZoomed && !showDeleteConfirm) onClose();
        }}
      />

      {/* Top Header / Control Bar */}
      <div className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Left: Counter & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.1] text-xs font-semibold text-white/90 shadow-sm tabular-nums">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {currentIndex + 1} / {items.length}
            </span>
          </div>

          {currentItem.title && (
            <span className="hidden md:inline-block text-xs font-medium text-slate-300 truncate max-w-[280px]">
              {currentItem.title}
            </span>
          )}
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={toggleZoom}
            className={cn(
              'p-2 sm:p-2.5 rounded-full transition-all border backdrop-blur-md cursor-pointer',
              isZoomed
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-glow-emerald'
                : 'bg-white/[0.08] hover:bg-white/[0.16] text-white/90 border-white/[0.1]'
            )}
            title={isZoomed ? 'Zoom Out (1x)' : 'Zoom In (2x)'}
            aria-label={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 sm:p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white transition-all border border-white/[0.1] backdrop-blur-md cursor-pointer"
            title="Download Image"
            aria-label="Download Image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Admin Delete Button */}
          {isAdmin && onDeletePhoto && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 sm:p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/25 text-red-300 hover:text-red-200 transition-all border border-red-500/30 backdrop-blur-md cursor-pointer"
              title="Delete Photo"
              aria-label="Delete Photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white/90 hover:text-white transition-all border border-white/[0.1] backdrop-blur-md cursor-pointer ml-1"
            title="Close Lightbox (Esc)"
            aria-label="Close Lightbox"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden px-2 sm:px-6 py-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Image Arrow */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 sm:left-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md border border-white/[0.15] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title="Previous Photo (Left Arrow)"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Center Main High-Res Image Container */}
        <div
          className={cn(
            'relative max-w-full max-h-full flex items-center justify-center transition-transform',
            isZoomed
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in'
          )}
          style={{ transform: imageTransform }}
          onMouseDown={handleMouseDown}
          onDoubleClick={toggleZoom}
        >
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-slate-400 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs font-medium tracking-wide">Loading full image...</span>
            </div>
          )}

          {/* Error Indicator */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900/80 rounded-2xl border border-red-500/30 text-center max-w-sm">
              <AlertTriangle className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-sm font-semibold text-white">Image could not be loaded</p>
              <p className="text-xs text-slate-400 mt-1 break-all">{currentItem.url}</p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentItem.url}
              src={currentItem.url}
              alt={currentItem.title || `Photo ${currentIndex + 1}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              draggable={false}
              className={cn(
                'max-h-[68vh] sm:max-h-[72vh] max-w-[95vw] sm:max-w-[85vw] object-contain rounded-xl sm:rounded-2xl shadow-2xl transition-opacity duration-300 select-none',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
            />
          )}
        </div>

        {/* Next Image Arrow */}
        {hasMultiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white backdrop-blur-md border border-white/[0.15] shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title="Next Photo (Right Arrow)"
            aria-label="Next Photo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Section: Caption & Thumbnails Carousel */}
      <div className="relative z-30 flex flex-col items-center bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-[max(16px,env(safe-area-inset-bottom))] pt-2 px-4 space-y-3">
        {/* Caption Bar */}
        {(currentItem.title || currentItem.subtitle || currentItem.category || currentItem.date) && (
          <div className="max-w-xl w-full text-center space-y-1 bg-black/40 backdrop-blur-md rounded-2xl py-2.5 px-4 border border-white/[0.08] shadow-lg">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {currentItem.title && (
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {currentItem.title}
                </h3>
              )}

              {currentItem.category && categoryBadgeInfo && (
                <span
                  className={cn(
                    'text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold border',
                    categoryBadgeInfo.color
                  )}
                >
                  {categoryBadgeInfo.label}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-slate-400 flex-wrap">
              {currentItem.subtitle && (
                <span className="font-medium text-slate-300">{currentItem.subtitle}</span>
              )}

              {currentItem.date && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {formatDate(currentItem.date)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Thumbnails Strip */}
        {hasMultiple && (
          <div
            ref={thumbnailContainerRef}
            className="flex items-center gap-2 overflow-x-auto max-w-full py-1.5 px-2 no-scrollbar scroll-smooth"
          >
            {items.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={`${item.url}-${idx}`}
                  ref={isActive ? activeThumbnailRef : null}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    'relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all cursor-pointer border',
                    isActive
                      ? 'ring-2 ring-emerald-400 border-white scale-105 shadow-glow-emerald opacity-100'
                      : 'border-white/15 opacity-50 hover:opacity-90 hover:border-white/40'
                  )}
                  aria-label={`View photo ${idx + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Delete Confirmation Overlay Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="relative w-full max-w-sm bg-[#0c1322] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Delete Photo?</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/[0.06] break-all">
              {currentItem.url}
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
