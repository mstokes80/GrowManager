import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Edit,
  Trash2,
  Activity,
  FileImage,
  Bug,
  AlertTriangle,
  Droplet,
  HelpCircle,
  Calendar,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { FullSizePhotoViewer } from './FullSizePhotoViewer';
import type { Observation, ObservationType } from '@/types/observation';

interface ObservationDetailModalProps {
  observation: Observation | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeletingObservation?: boolean;
}

// Get icon for observation type
const getObservationTypeIcon = (type: ObservationType) => {
  switch (type) {
    case 'health_check':
      return Activity;
    case 'progress':
      return FileImage;
    case 'pest':
      return Bug;
    case 'disease':
      return AlertTriangle;
    case 'deficiency':
      return Droplet;
    case 'other':
      return HelpCircle;
    default:
      return FileImage;
  }
};

// Get label for observation type
const getObservationTypeLabel = (type: ObservationType) => {
  switch (type) {
    case 'health_check':
      return 'Health Check';
    case 'progress':
      return 'Progress Update';
    case 'pest':
      return 'Pest Issue';
    case 'disease':
      return 'Disease';
    case 'deficiency':
      return 'Nutrient Deficiency';
    case 'other':
      return 'Other';
    default:
      return type;
  }
};

// Get badge color for observation type
const getObservationTypeBadgeVariant = (type: ObservationType) => {
  switch (type) {
    case 'health_check':
      return 'default';
    case 'progress':
      return 'secondary';
    case 'pest':
      return 'destructive';
    case 'disease':
      return 'destructive';
    case 'deficiency':
      return 'outline';
    case 'other':
      return 'outline';
    default:
      return 'default';
  }
};

/**
 * ObservationDetailModal - Modal for viewing observation details
 * Implements Task Group 7.4.5
 */
export function ObservationDetailModal({
  observation,
  open,
  onClose,
  onEdit,
  onDelete,
  isDeletingObservation = false,
}: ObservationDetailModalProps) {
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!observation) return null;

  const TypeIcon = getObservationTypeIcon(observation.observationType);

  const openPhotoViewer = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowPhotoViewer(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  const photoViewerPhotos = observation.photos.map((photo) => ({
    url: photo.fullSizeUrl,
    date: observation.timestamp,
    caption: observation.note,
  }));

  return (
    <>
      <Dialog open={open && !showPhotoViewer} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5" />
              Observation Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Observation Type Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={getObservationTypeBadgeVariant(observation.observationType)}>
                {getObservationTypeLabel(observation.observationType)}
              </Badge>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {format(new Date(observation.timestamp), 'MMMM d, yyyy')}
                </p>
                <p className="text-muted-foreground">
                  {format(new Date(observation.timestamp), 'h:mm a')}
                </p>
              </div>
            </div>

            <Separator />

            {/* Note */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Note</h4>
              <p className="text-sm whitespace-pre-wrap">{observation.note}</p>
            </div>

            {/* Photos */}
            {observation.photos.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Photos ({observation.photos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {observation.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => openPhotoViewer(index)}
                        className="relative group cursor-pointer rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img loading="lazy" decoding="async"
                          src={photo.thumbnailUrl}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <FileImage className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tags */}
            {observation.tags && observation.tags.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Tags</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {observation.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Created: {format(new Date(observation.createdAt), 'MMM d, yyyy h:mm a')}</p>
              {observation.updatedAt !== observation.createdAt && (
                <p>Updated: {format(new Date(observation.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
              Close
            </Button>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeletingObservation}
                className="flex-1 sm:flex-initial"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeletingObservation ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit} className="flex-1 sm:flex-initial">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer */}
      {showPhotoViewer && observation.photos.length > 0 && (
        <FullSizePhotoViewer
          photos={photoViewerPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setShowPhotoViewer(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this observation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the observation and all associated photos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}