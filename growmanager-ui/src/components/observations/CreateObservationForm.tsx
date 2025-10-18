import { useState, useCallback } from 'react';
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
import type { ObservationType } from '@/types/observation';

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

export type CreateObservationFormData = z.infer<typeof observationSchema>;

interface CreateObservationFormProps {
  plantId: string;
  onSubmit: (data: CreateObservationFormData, files: File[]) => void;
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
 * CreateObservationForm - Form for creating new observations with photos
 * Implements Task Group 7.4.3
 */
export function CreateObservationForm({
  plantId: _plantId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateObservationFormProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [compressionProgress, setCompressionProgress] = useState<number[]>([]);
  const { compressImage, isCompressing } = useImageCompression();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateObservationFormData>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      note: '',
      observationType: 'health_check',
      tags: '',
    },
  });

  const selectedObservationType = watch('observationType');
  const noteValue = watch('note');

  // Handle file drops
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check max 10 photos limit
      if (photos.length + acceptedFiles.length > 10) {
        alert('Maximum 10 photos allowed per observation');
        return;
      }

      // Compress images before adding
      const compressedFiles: File[] = [];
      const newPreviewUrls: string[] = [];

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        if (!file) continue;

        setCompressionProgress((prev) => {
          const newProgress = [...prev];
          newProgress[photos.length + i] = 0;
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
            newProgress[photos.length + i] = 100;
            return newProgress;
          });
        } catch (error) {
          console.error('Error compressing image:', error);
          // Use original file if compression fails
          compressedFiles.push(file);
          newPreviewUrls.push(URL.createObjectURL(file));
        }
      }

      setPhotos((prev) => [...prev, ...compressedFiles]);
      setPhotoPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    },
    [photos.length, compressImage]
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
    disabled: photos.length >= 10,
  });

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls((prev) => {
      // Revoke object URL to free memory
      const url = prev[index];
      if (url) {
        URL.revokeObjectURL(url);
      }
      return prev.filter((_, i) => i !== index);
    });
    setCompressionProgress((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleFormSubmit = (data: CreateObservationFormData) => {
    onSubmit(data, photos);
  };

  return (
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
            {(['health_check', 'progress', 'pest', 'disease', 'deficiency', 'other'] as const).map(
              (type) => {
                const Icon = getObservationTypeIcon(type);
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{getObservationTypeLabel(type)}</span>
                    </div>
                  </SelectItem>
                );
              }
            )}
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

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Photos (up to 10)</Label>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${photos.length >= 10 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
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

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
            {photos.map((_file, index) => (
              <div key={index} className="relative group">
                <img loading="lazy" decoding="async"
                  src={photoPreviewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove photo ${index + 1}`}
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
        <p className="text-sm text-muted-foreground">
          {photos.length} / 10 photos added
        </p>
      </div>

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
        <Button
          type="submit"
          disabled={isSubmitting || isCompressing}
          className="flex-1"
        >
          {isSubmitting ? 'Creating...' : 'Create Observation'}
        </Button>
      </div>
    </form>
  );
}