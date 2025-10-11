import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plant } from '@/types/plant';
import { useCultivars } from '@/services/cultivarsApi';
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
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

// Validation schema using Zod
const plantSchema = z.object({
  plantTag: z
    .string()
    .min(1, 'Plant tag is required')
    .max(50, 'Plant tag must be 50 characters or less'),
  cultivarId: z.string().optional(),
  plantedDate: z.string().min(1, 'Planted date is required'),
  stage: z.enum(['seedling', 'vegetative', 'flowering', 'harvested'], {
    errorMap: () => ({ message: 'Please select a stage' }),
  }),
  healthStatus: z.enum(['active', 'dead'], {
    errorMap: () => ({ message: 'Please select a status' }),
  }),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export type PlantFormData = z.infer<typeof plantSchema>;

interface PlantFormProps {
  plant?: Plant;
  growId: string;
  onSubmit: (data: PlantFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * PlantForm - Reusable form for creating and editing plants
 * Implements Task Group 6.4.2 and 6.4.3
 */
export function PlantForm({
  plant,
  growId: _growId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PlantFormProps) {
  // const isEditMode = !!plant;
  const { data: cultivars, isLoading: cultivarsLoading } = useCultivars();

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) {
      return format(new Date(), 'yyyy-MM-dd');
    }
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return format(new Date(), 'yyyy-MM-dd');
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      plantTag: plant?.plantTag || '',
      cultivarId: plant?.cultivarId || '',
      plantedDate: formatDateForInput(plant?.plantedDate),
      stage: plant?.stage || 'seedling',
      healthStatus: plant?.healthStatus || 'active',
      notes: plant?.notes || '',
    },
  });

  const selectedCultivarId = watch('cultivarId');
  const selectedStage = watch('stage');
  const selectedHealthStatus = watch('healthStatus');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plant Tag Field */}
      <div className="space-y-2">
        <Label htmlFor="plantTag">
          Plant Tag <span className="text-destructive">*</span>
        </Label>
        <Input
          id="plantTag"
          type="text"
          placeholder="e.g., A1, Plant-001, Northern Lights #1"
          {...register('plantTag')}
          aria-invalid={!!errors.plantTag}
          aria-describedby={errors.plantTag ? 'plantTag-error' : undefined}
        />
        {errors.plantTag && (
          <p id="plantTag-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.plantTag.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          A unique identifier for this plant
        </p>
      </div>

      {/* Cultivar Field */}
      <div className="space-y-2">
        <Label htmlFor="cultivarId">Cultivar (Optional)</Label>
        <Select
          value={selectedCultivarId}
          onValueChange={(value) => setValue('cultivarId', value === 'none' ? '' : value)}
          disabled={cultivarsLoading}
        >
          <SelectTrigger id="cultivarId">
            <SelectValue placeholder={cultivarsLoading ? 'Loading...' : 'Select a cultivar'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No cultivar</SelectItem>
            {cultivars?.map((cultivar) => (
              <SelectItem key={cultivar.id} value={cultivar.id}>
                {cultivar.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Planted Date Field */}
      <div className="space-y-2">
        <Label htmlFor="plantedDate">
          Planted Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="plantedDate"
          type="date"
          {...register('plantedDate')}
          aria-invalid={!!errors.plantedDate}
          aria-describedby={errors.plantedDate ? 'plantedDate-error' : undefined}
        />
        {errors.plantedDate && (
          <p id="plantedDate-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.plantedDate.message}
          </p>
        )}
      </div>

      {/* Stage Field */}
      <div className="space-y-2">
        <Label htmlFor="stage">
          Stage <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedStage}
          onValueChange={(value) => setValue('stage', value as any)}
        >
          <SelectTrigger id="stage" aria-invalid={!!errors.stage}>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seedling">Seedling</SelectItem>
            <SelectItem value="vegetative">Vegetative</SelectItem>
            <SelectItem value="flowering">Flowering</SelectItem>
            <SelectItem value="harvested">Harvested</SelectItem>
          </SelectContent>
        </Select>
        {errors.stage && (
          <p id="stage-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.stage.message}
          </p>
        )}
      </div>

      {/* Status Field */}
      <div className="space-y-2">
        <Label htmlFor="healthStatus">
          Status <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedHealthStatus}
          onValueChange={(value) => setValue('healthStatus', value as any)}
        >
          <SelectTrigger id="healthStatus" aria-invalid={!!errors.healthStatus}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="dead">Dead</SelectItem>
          </SelectContent>
        </Select>
        {errors.healthStatus && (
          <p
            id="healthStatus-error"
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4" />
            {errors.healthStatus.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Active: Plant is alive and growing | Dead: Plant has died
        </p>
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes about this plant..."
          rows={4}
          {...register('notes')}
          aria-invalid={!!errors.notes}
          aria-describedby={errors.notes ? 'notes-error' : undefined}
        />
        {errors.notes && (
          <p id="notes-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.notes.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Maximum 1000 characters</p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : plant ? 'Update Plant' : 'Create Plant'}
        </Button>
      </div>
    </form>
  );
}