import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { format } from 'date-fns';

interface PhotoViewerPhoto {
  url: string;
  date?: string;
  caption?: string;
}

interface FullSizePhotoViewerProps {
  photos: PhotoViewerPhoto[];
  initialIndex?: number;
  onClose: () => void;
}

/**
 * FullSizePhotoViewer - Full-size image viewer with navigation and zoom
 * Implements Task Group 7.4.7
 */
export function FullSizePhotoViewer({
  photos,
  initialIndex = 0,
  onClose,
}: FullSizePhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentPhoto = photos[currentIndex];

  // Navigate to previous photo
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  }, [photos.length]);

  // Navigate to next photo
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  }, [photos.length]);

  // Zoom in
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  // Zoom out
  const zoomOut = () => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
        case '_':
          zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPrevious, goToNext]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // Handle touch gestures for zoom (pinch)
  useEffect(() => {
    let initialDistance = 0;
    let initialZoom = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (touch1 && touch2) {
          initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          initialZoom = zoom;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (touch1 && touch2) {
          const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          const scale = currentDistance / initialDistance;
          const newZoom = Math.min(Math.max(initialZoom * scale, 1), 4);
          setZoom(newZoom);
          if (newZoom === 1) {
            setPanPosition({ x: 0, y: 0 });
          }
        }
      }
    };

    const viewerElement = document.getElementById('photo-viewer');
    if (viewerElement) {
      viewerElement.addEventListener('touchstart', handleTouchStart);
      viewerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (viewerElement) {
        viewerElement.removeEventListener('touchstart', handleTouchStart);
        viewerElement.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [zoom]);

  // Handle mouse drag for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle swipe gestures for navigation
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && zoom === 1) {
        const touch = e.touches[0];
        if (touch) {
          touchStartX = touch.clientX;
          touchStartY = touch.clientY;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (zoom === 1) {
        const touch = e.changedTouches[0];
        if (touch) {
          const touchEndX = touch.clientX;
          const touchEndY = touch.clientY;
          const deltaX = touchEndX - touchStartX;
          const deltaY = touchEndY - touchStartY;

          // Only trigger swipe if horizontal movement is greater than vertical
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
              goToPrevious();
            } else {
              goToNext();
            }
          }
        }
      }
    };

    const viewerElement = document.getElementById('photo-viewer');
    if (viewerElement) {
      viewerElement.addEventListener('touchstart', handleTouchStart);
      viewerElement.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (viewerElement) {
        viewerElement.removeEventListener('touchstart', handleTouchStart);
        viewerElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [zoom, goToPrevious, goToNext]);

  if (!currentPhoto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex-1">
          <p className="text-sm font-medium">
            Photo {currentIndex + 1} of {photos.length}
          </p>
          {currentPhoto.date && (
            <p className="text-xs text-white/70">
              {format(new Date(currentPhoto.date), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>

        {/* Zoom Controls (Desktop) */}
        <div className="hidden md:flex items-center gap-2 mr-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={zoom <= 1}
            className="text-white hover:bg-white/20"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <span className="text-sm text-white/70 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={zoom >= 4}
            className="text-white hover:bg-white/20"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Photo Container */}
      <div
        id="photo-viewer"
        className="flex-1 relative overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img loading="lazy" decoding="async"
          src={currentPhoto.url}
          alt={currentPhoto.caption || `Photo ${currentIndex + 1}`}
          className="absolute top-1/2 left-1/2 max-w-none select-none"
          style={{
            transform: `translate(-50%, -50%) translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            maxHeight: '90vh',
            maxWidth: zoom === 1 ? '90vw' : 'none',
            width: zoom === 1 ? 'auto' : undefined,
            height: zoom === 1 ? 'auto' : undefined,
          }}
          draggable={false}
        />

        {/* Navigation Arrows */}
        {photos.length > 1 && zoom === 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}
      </div>

      {/* Caption */}
      {currentPhoto.caption && (
        <div className="p-4 text-white bg-black/50">
          <p className="text-sm">{currentPhoto.caption}</p>
        </div>
      )}

      {/* Mobile Zoom Controls */}
      <div className="md:hidden flex items-center justify-center gap-4 p-4 text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomOut}
          disabled={zoom <= 1}
          className="text-white hover:bg-white/20"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <span className="text-sm text-white/70 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={zoomIn}
          disabled={zoom >= 4}
          className="text-white hover:bg-white/20"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}