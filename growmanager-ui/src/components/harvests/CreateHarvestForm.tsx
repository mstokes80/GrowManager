import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import type { WeightUnit } from '@/types/harvest';

// Validation schema using Zod
const harvestSchema = z.object({
  harvestDate: z.string().min(1, 'Harvest date is required'),
  wetWeight: z.coerce
    .number()
    .positive('Wet weight must be greater than 0')
    .max(99999, 'Wet weight is too large'),
  dryWeight: z.coerce
    .number()
    .positive('Dry weight must be greater than 0')
    .max(99999, 'Dry weight is too large')
    .optional()
    .or(z.literal('')),
  weightUnit: z.enum(['GRAMS', 'OUNCES']),
  thcPercent: z.coerce
    .number()
    .min(0, 'THC % must be at least 0')
    .max(100, 'THC % must not exceed 100')
    .optional()
    .or(z.literal('')),
  cbdPercent: z.coerce
    .number()
    .min(0, 'CBD % must be at least 0')
    .max(100, 'CBD % must not exceed 100')
    .optional()
    .or(z.literal('')),
  qualityRating: z.coerce
    .number()
    .int()
    .min(1, 'Quality rating must be at least 1')
    .max(10, 'Quality rating must not exceed 10')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional(),
});

export type CreateHarvestFormData = z.infer<typeof harvestSchema>;

interface CreateHarvestFormProps {
  plantId: string;
  onSubmit: (data: CreateHarvestFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * CreateHarvestForm - Form for logging a plant harvest
 * Implements Task Group 8.3.3
 */
export function CreateHarvestForm({
  plantId: _plantId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateHarvestFormProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateHarvestFormData>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      harvestDate: format(new Date(), 'yyyy-MM-dd'),
      wetWeight: undefined,
      dryWeight: undefined,
      weightUnit: 'GRAMS',
      thcPercent: undefined,
      cbdPercent: undefined,
      qualityRating: undefined,
      notes: '',
    },
  });

  const weightUnit = watch('weightUnit');
  const notesValue = watch('notes');

  // Handle star rating click
  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    setValue('qualityRating', rating);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Harvest Date Field */}
      <div className="space-y-2">
        <Label htmlFor="harvestDate">
          Harvest Date <span className="text-destructive">*</span>
        </Label>
        <Input
          id="harvestDate"
          type="date"
          {...register('harvestDate')}
          aria-invalid={!!errors.harvestDate}
        />
        {errors.harvestDate && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.harvestDate.message}
          </p>
        )}
      </div>

      {/* Weight Unit Selector */}
      <div className="space-y-2">
        <Label htmlFor="weightUnit">
          Weight Unit <span className="text-destructive">*</span>
        </Label>
        <Select
          value={weightUnit}
          onValueChange={(value) => setValue('weightUnit', value as WeightUnit)}
        >
          <SelectTrigger id="weightUnit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GRAMS">Grams (g)</SelectItem>
            <SelectItem value="OUNCES">Ounces (oz)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Wet Weight Field */}
      <div className="space-y-2">
        <Label htmlFor="wetWeight">
          Wet Weight ({weightUnit === 'GRAMS' ? 'g' : 'oz'}){' '}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          id="wetWeight"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('wetWeight')}
          aria-invalid={!!errors.wetWeight}
        />
        {errors.wetWeight && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.wetWeight.message}
          </p>
        )}
      </div>

      {/* Dry Weight Field */}
      <div className="space-y-2">
        <Label htmlFor="dryWeight">
          Dry Weight ({weightUnit === 'GRAMS' ? 'g' : 'oz'})
        </Label>
        <Input
          id="dryWeight"
          type="number"
          step="0.01"
          placeholder="0.00 (optional - add after drying)"
          {...register('dryWeight')}
          aria-invalid={!!errors.dryWeight}
        />
        {errors.dryWeight && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.dryWeight.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          You can add dry weight later after the harvest has dried
        </p>
      </div>

      {/* Potency Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="thcPercent">THC %</Label>
          <Input
            id="thcPercent"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('thcPercent')}
            aria-invalid={!!errors.thcPercent}
          />
          {errors.thcPercent && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.thcPercent.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cbdPercent">CBD %</Label>
          <Input
            id="cbdPercent"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('cbdPercent')}
            aria-invalid={!!errors.cbdPercent}
          />
          {errors.cbdPercent && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.cbdPercent.message}
            </p>
          )}
        </div>
      </div>

      {/* Quality Rating */}
      <div className="space-y-2">
        <Label>Quality Rating (1-10)</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRatingClick(rating)}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
              aria-label={`Rate ${rating} out of 10`}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  rating <= (hoveredRating || selectedRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {selectedRating > 0 && (
          <p className="text-sm text-muted-foreground">
            Rating: {selectedRating}/10
          </p>
        )}
        {errors.qualityRating && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.qualityRating.message}
          </p>
        )}
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this harvest..."
          rows={4}
          {...register('notes')}
          aria-invalid={!!errors.notes}
        />
        <div className="flex justify-between items-center">
          <div>
            {errors.notes && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.notes.message}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {notesValue?.length || 0} / 2000
          </p>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Logging Harvest...' : 'Log Harvest'}
        </Button>
      </div>
    </form>
  );
}