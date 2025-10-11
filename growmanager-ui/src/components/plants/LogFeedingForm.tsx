import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Droplets, Leaf, Beaker } from 'lucide-react';
import { format } from 'date-fns';

// Validation schema using Zod
const feedingSchema = z.object({
  feedingType: z.enum(['watering', 'nutrients', 'foliar'], {
    errorMap: () => ({ message: 'Please select a feeding type' }),
  }),
  amountMl: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(100000, 'Amount must be less than 100,000 ml'),
  ecLevel: z
    .number({ invalid_type_error: 'EC must be a number' })
    .min(0, 'EC must be non-negative')
    .max(10, 'EC must be less than 10')
    .optional()
    .nullable(),
  phLevel: z
    .number({ invalid_type_error: 'pH must be a number' })
    .min(0, 'pH must be between 0 and 14')
    .max(14, 'pH must be between 0 and 14')
    .optional()
    .nullable(),
  nutrientMix: z.string().max(200, 'Nutrient mix must be 200 characters or less').optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  fedAt: z.string().min(1, 'Date/time is required'),
  applyToAllPlants: z.boolean().optional(),
});

export type LogFeedingFormData = z.infer<typeof feedingSchema>;

interface LogFeedingFormProps {
  plantId: string;
  onSubmit: (data: LogFeedingFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * LogFeedingForm - Form for logging feeding/watering events
 * Implements Task Group 6.4.5
 */
export function LogFeedingForm({
  plantId: _plantId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LogFeedingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LogFeedingFormData>({
    resolver: zodResolver(feedingSchema),
    defaultValues: {
      feedingType: 'watering',
      amountMl: undefined,
      ecLevel: null,
      phLevel: null,
      nutrientMix: '',
      notes: '',
      fedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      applyToAllPlants: false,
    },
  });

  const selectedFeedingType = watch('feedingType');
  const applyToAllPlants = watch('applyToAllPlants');


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Feeding Type Field */}
      <div className="space-y-2">
        <Label htmlFor="feedingType">
          Feeding Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedFeedingType}
          onValueChange={(value) => setValue('feedingType', value as any)}
        >
          <SelectTrigger id="feedingType" aria-invalid={!!errors.feedingType}>
            <SelectValue placeholder="Select feeding type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="watering">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span>Watering</span>
              </div>
            </SelectItem>
            <SelectItem value="nutrients">
              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4 text-purple-600" />
                <span>Nutrients</span>
              </div>
            </SelectItem>
            <SelectItem value="foliar">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span>Foliar Feeding</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.feedingType && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.feedingType.message}
          </p>
        )}
      </div>

      {/* Amount Field */}
      <div className="space-y-2">
        <Label htmlFor="amountMl">
          Amount (ml) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="amountMl"
          type="number"
          step="0.01"
          placeholder="e.g., 500"
          {...register('amountMl', { valueAsNumber: true })}
          aria-invalid={!!errors.amountMl}
          aria-describedby={errors.amountMl ? 'amountMl-error' : undefined}
        />
        {errors.amountMl && (
          <p id="amountMl-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.amountMl.message}
          </p>
        )}
      </div>

      {/* EC and pH Levels */}
      <div className="grid grid-cols-2 gap-4">
        {/* EC Level */}
        <div className="space-y-2">
          <Label htmlFor="ecLevel">EC Level (optional)</Label>
          <Input
            id="ecLevel"
            type="number"
            step="0.1"
            placeholder="e.g., 1.2"
            {...register('ecLevel', {
              setValueAs: (v) => (v === '' ? null : parseFloat(v)),
            })}
            aria-invalid={!!errors.ecLevel}
            aria-describedby={errors.ecLevel ? 'ecLevel-error' : undefined}
          />
          {errors.ecLevel && (
            <p id="ecLevel-error" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.ecLevel.message}
            </p>
          )}
        </div>

        {/* pH Level */}
        <div className="space-y-2">
          <Label htmlFor="phLevel">pH Level (optional)</Label>
          <Input
            id="phLevel"
            type="number"
            step="0.1"
            placeholder="e.g., 6.5"
            {...register('phLevel', {
              setValueAs: (v) => (v === '' ? null : parseFloat(v)),
            })}
            aria-invalid={!!errors.phLevel}
            aria-describedby={errors.phLevel ? 'phLevel-error' : undefined}
          />
          {errors.phLevel && (
            <p id="phLevel-error" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.phLevel.message}
            </p>
          )}
        </div>
      </div>

      {/* Nutrient Mix */}
      <div className="space-y-2">
        <Label htmlFor="nutrientMix">Nutrient Mix (optional)</Label>
        <Input
          id="nutrientMix"
          type="text"
          placeholder="e.g., Fox Farm Grow Big, CalMag"
          {...register('nutrientMix')}
          aria-invalid={!!errors.nutrientMix}
          aria-describedby={errors.nutrientMix ? 'nutrientMix-error' : undefined}
        />
        {errors.nutrientMix && (
          <p id="nutrientMix-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.nutrientMix.message}
          </p>
        )}
      </div>

      {/* Date/Time Field */}
      <div className="space-y-2">
        <Label htmlFor="fedAt">
          Date & Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fedAt"
          type="datetime-local"
          {...register('fedAt')}
          aria-invalid={!!errors.fedAt}
          aria-describedby={errors.fedAt ? 'fedAt-error' : undefined}
        />
        {errors.fedAt && (
          <p id="fedAt-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.fedAt.message}
          </p>
        )}
      </div>

      {/* Apply to All Plants Checkbox */}
      <div className="flex items-start space-x-3 rounded-md border p-4 bg-muted/50">
        <div className="flex-1">
          <Checkbox
            id="applyToAllPlants"
            checked={!!applyToAllPlants}
            onChange={(e) => setValue('applyToAllPlants', e.target.checked)}
            label="Apply to all plants in this grow"
          />
          <p className="text-sm text-muted-foreground mt-2 ml-13">
            This will create the same feeding event for all plants in the current grow cycle
          </p>
        </div>
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes..."
          rows={3}
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
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Logging...' : 'Log Feeding'}
        </Button>
      </div>
    </form>
  );
}