import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  AlertCircle,
  Camera,
  Upload,
  X,
  FileImage,
  Activity,
  Bug,
  AlertTriangle,
  Droplet,
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { useImageCompression } from '@/hooks/useImageCompression';
import type { Observation, ObservationType } from '@/types/observation';

// Validation schema using Zod
const observationSchema = z.object({
  timestamp: z.string().min(1, 'Date/time is required'),
  note: z
    .string()
    .min(1, 'Note is required')
    .max(2000, 'Note must be 2000 characters or less'),
  observationType: z.enum(
    ['health_check', 'progress', 'pest', 'disease', 'deficiency', 'other'],
    {
      errorMap: () => ({ message: 'Please select an observation type' }),
    }
  ),
  tags: z.string().optional(),
});

export type EditObservationFormData = z.infer<typeof observationSchema>;

interface EditObservationFormProps {
  observation: Observation;
  onSubmit: (
    data: EditObservationFormData,
    newFiles: File[],
    photosToRemove: string[]
  ) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
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

/**
 * EditObservationForm - Form for editing existing observations
 * Implements Task Group 7.4.4
 */
export function EditObservationForm({
  observation,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditObservationFormProps) {
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newPhotoPreviewUrls, setNewPhotoPreviewUrls] = useState<string[]>([]);
  const [photosToRemove, setPhotosToRemove] = useState<string[]>([]);
  const [photoToRemove, setPhotoToRemove] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<number[]>([]);
  const { compressImage, isCompressing } = useImageCompression();

  // Format timestamp for datetime-local input (YYYY-MM-DDTHH:mm)
  const formatTimestampForInput = (timestamp: string) => {
    // If already in correct format (ISO string), extract just the part we need
    // This avoids timezone issues when parsing
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timestamp)) {
      return timestamp.substring(0, 16); // Extract YYYY-MM-DDTHH:mm
    }
    // Fallback to parsing if format is unexpected
    try {
      return format(new Date(timestamp), "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
      return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditObservationFormData>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      timestamp: formatTimestampForInput(observation.timestamp),
      note: observation.note,
      observationType: observation.observationType,
      tags: observation.tags?.join(', ') || '',
    },
  });

  const selectedObservationType = watch('observationType');
  const noteValue = watch('note');

  // Calculate total photo count
  // photosToRemove contains 2 URLs per photo (fullSize + thumbnail)
  const existingPhotoCount = observation.photos.length - (photosToRemove.length / 2);
  const totalPhotoCount = existingPhotoCount + newPhotos.length;

  // Handle file drops
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check max 10 photos limit
      if (totalPhotoCount + acceptedFiles.length > 10) {
        alert('Maximum 10 photos allowed per observation');
        return;
      }

      // Compress images before adding
      const compressedFiles: File[] = [];
      const newPreviewUrls: string[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        // Skip if file is undefined (shouldn't happen, but TypeScript safety)
        if (!file) {
          continue;
        }

        setCompressionProgress((prev) => {
          const newProgress = [...prev];
          newProgress[newPhotos.length + i] = 0;
          return newProgress;
        });

        try {
          const result = await compressImage(file, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.85,
          });

          compressedFiles.push(result.file);
          newPreviewUrls.push(URL.createObjectURL(result.file));

          setCompressionProgress((prev) => {
            const newProgress = [...prev];
            newProgress[newPhotos.length + i] = 100;
            return newProgress;
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          // Use original file if compression fails
          compressedFiles.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        }
      }

      setNewPhotos((prev) => [...prev, ...compressedFiles]);
      setNewPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    },
    [totalPhotoCount, newPhotos.length, compressImage]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/heic': ['.heic'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: totalPhotoCount >= 10,
  });

  // Remove new photo
  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviewUrls((prev) => {
      const url = prev[index];
      if (url) {
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, i) => i !== index);
    });
    setCompressionProgress((prev) => prev.filter((_, i) => i !== index));
  };

  // Mark existing photo for removal
  const markPhotoForRemoval = (fullSizeUrl: string, _thumbnailUrl: string) => {
    setPhotoToRemove(fullSizeUrl);
  };

  // Confirm photo removal
  const confirmPhotoRemoval = () => {
    if (photoToRemove) {
      // Find the photo object to get both URLs
      const photo = observation.photos.find((p) => p.fullSizeUrl === photoToRemove);
      if (photo) {
        // Add both fullSizeUrl and thumbnailUrl to the removal list
        setPhotosToRemove((prev) => [...prev, photo.fullSizeUrl, photo.thumbnailUrl]);
      }
      setPhotoToRemove(null);
    }
  };

  // Cancel photo removal
  const cancelPhotoRemoval = () => {
    setPhotoToRemove(null);
  };

  // Unmark photo for removal
  const unmarkPhotoForRemoval = (fullSizeUrl: string, thumbnailUrl: string) => {
    // Remove both URLs from the removal list
    setPhotosToRemove((prev) => prev.filter((url) => url !== fullSizeUrl && url !== thumbnailUrl));
  };

  // Handle form submission
  const handleFormSubmit = (data: EditObservationFormData) => {
    onSubmit(data, newPhotos, photosToRemove);
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      newPhotoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPhotoPreviewUrls]);

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Observation Type Field */}
        <div className="space-y-2">
          <Label htmlFor="observationType">
            Observation Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedObservationType}
            onValueChange={(value) => setValue('observationType', value as ObservationType)}
          >
            <SelectTrigger id="observationType" aria-invalid={!!errors.observationType}>
              <SelectValue placeholder="Select observation type" />
            </SelectTrigger>
            <SelectContent>
              {(
                ['health_check', 'progress', 'pest', 'disease', 'deficiency', 'other'] as const
              ).map((type) => {
                const Icon = getObservationTypeIcon(type);
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{getObservationTypeLabel(type)}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.observationType && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.observationType.message}
            </p>
          )}
        </div>

        {/* Date/Time Field */}
        <div className="space-y-2">
          <Label htmlFor="timestamp">
            Date & Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="timestamp"
            type="datetime-local"
            {...register('timestamp')}
            aria-invalid={!!errors.timestamp}
            aria-describedby={errors.timestamp ? 'timestamp-error' : undefined}
          />
          {errors.timestamp && (
            <p id="timestamp-error" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.timestamp.message}
            </p>
          )}
        </div>

        {/* Note Field */}
        <div className="space-y-2">
          <Label htmlFor="note">
            Note <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="note"
            placeholder="Describe what you observed..."
            rows={4}
            {...register('note')}
            aria-invalid={!!errors.note}
            aria-describedby={errors.note ? 'note-error' : undefined}
          />
          <div className="flex justify-between items-center">
            <div>
              {errors.note && (
                <p id="note-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.note.message}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{noteValue?.length || 0} / 2000</p>
          </div>
        </div>

        {/* Existing Photos */}
        {observation.photos.length > 0 && (
          <div className="space-y-2">
            <Label>Current Photos</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {observation.photos.map((photo) => {
                const isMarkedForRemoval = photosToRemove.includes(photo.fullSizeUrl);
                return (
                  <div key={photo.fullSizeUrl} className="relative group">
                    <img loading="lazy" decoding="async"
                      src={photo.thumbnailUrl}
                      alt="Observation"
                      className={`w-full h-24 object-cover rounded-md ${
                        isMarkedForRemoval ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    {isMarkedForRemoval ? (
                      <button
                        type="button"
                        onClick={() => unmarkPhotoForRemoval(photo.fullSizeUrl, photo.thumbnailUrl)}
                        className="absolute top-1 right-1 p-1 bg-primary text-primary-foreground rounded-full text-xs"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markPhotoForRemoval(photo.fullSizeUrl, photo.thumbnailUrl)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Photos */}
        {totalPhotoCount < 10 && (
          <div className="space-y-2">
            <Label>Add More Photos (up to {10 - totalPhotoCount} more)</Label>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${totalPhotoCount >= 10 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                {isDragActive ? (
                  <>
                    <Upload className="h-8 w-8 text-primary" />
                    <p className="text-sm text-primary">Drop photos here...</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag & drop photos, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPEG, PNG, HEIC • Max 10MB per photo
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* New Photo Previews */}
            {newPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                {newPhotos.map((_photo, index) => (
                  <div key={index} className="relative group">
                    <img loading="lazy" decoding="async"
                      src={newPhotoPreviewUrls[index]}
                      alt={`New preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove new photo ${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {compressionProgress[index] !== undefined &&
                      compressionProgress[index] < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                          Compressing...
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {totalPhotoCount} / 10 photos total
        </p>

        {/* Tags Field */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (optional)</Label>
          <Input
            id="tags"
            type="text"
            placeholder="e.g., week-3, flowering, topping"
            {...register('tags')}
            aria-describedby="tags-help"
          />
          <p id="tags-help" className="text-sm text-muted-foreground">
            Comma-separated tags for easier searching
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || isCompressing} className="flex-1">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Photo Removal Confirmation Dialog */}
      <AlertDialog open={!!photoToRemove} onOpenChange={(open) => !open && cancelPhotoRemoval()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This photo will be removed from the observation when you save your changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPhotoRemoval}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPhotoRemoval}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}