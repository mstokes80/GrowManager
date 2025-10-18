import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { FullSizePhotoViewer } from './FullSizePhotoViewer';
import type { Observation } from '@/types/observation';

interface PhotoGalleryProps {
  observations: Observation[];
  isLoading?: boolean;
}

interface GalleryPhoto {
  url: string;
  thumbnailUrl: string;
  date: string;
  caption: string;
  observationId: string;
}

/**
 * PhotoGallery - Display all photos from observations for a plant
 * Implements Task Group 7.4.6
 */
export function PhotoGallery({ observations, isLoading = false }: PhotoGalleryProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Extract and sort all photos from observations
  const allPhotos = useMemo(() => {
    const photos: GalleryPhoto[] = [];

    observations.forEach((observation) => {
      observation.photos.forEach((photo) => {
        photos.push({
          url: photo.fullSizeUrl,
          thumbnailUrl: photo.thumbnailUrl,
          date: observation.timestamp,
          caption: observation.note,
          observationId: observation.id,
        });
      });
    });

    // Sort by date
    photos.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return photos;
  }, [observations, sortOrder]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
  };

  // Open photo viewer
  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowPhotoViewer(true);
  };

  // Format photos for viewer
  const photoViewerPhotos = allPhotos.map((photo) => ({
    url: photo.url,
    date: photo.date,
    caption: photo.caption,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading photos...</p>
        </div>
      </div>
    );
  }

  if (allPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <ImageOff className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Add an observation to start documenting your plant's journey with photos.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Sort Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allPhotos.map((photo, index) => (
            <button
              key={`${photo.observationId}-${index}`}
              onClick={() => openPhotoViewer(index)}
              className="relative group cursor-pointer rounded-md overflow-hidden border border-border hover:border-primary transition-colors aspect-square"
            >
              <img
                src={photo.thumbnailUrl}
                alt={`Photo from ${format(new Date(photo.date), 'MMM d, yyyy')}`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {/* Date Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs font-medium">
                  {format(new Date(photo.date), 'MMM d, yyyy')}
                </p>
                <p className="text-white/70 text-xs">
                  {format(new Date(photo.date), 'h:mm a')}
                </p>
              </div>
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Photo Viewer */}
      {showPhotoViewer && (
        <FullSizePhotoViewer
          photos={photoViewerPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setShowPhotoViewer(false)}
        />
      )}
    </>
  );
}