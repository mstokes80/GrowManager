import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { AlertCircle, Droplets, Leaf, Beaker, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  type VolumeUnit,
  getVolumeConversion,
  validateVolume,
  toMilliliters,
} from '@/utils/volumeUtils';

// Amendment validation schema
const amendmentSchema = z.object({
  name: z.string().min(1, 'Amendment name is required'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive'),
  unit: z.enum(
    [
      'teaspoons',
      'tablespoons',
      'cups',
      'grams',
      'kilograms',
      'ounces',
      'pounds',
      'milliliters',
      'liters',
    ],
    {
      errorMap: () => ({ message: 'Please select a valid unit' }),
    }
  ),
});

// Validation schema using Zod
const feedingSchema = z.object({
  feedingType: z.enum(['watering', 'nutrients', 'foliar'], {
    errorMap: () => ({ message: 'Please select a feeding type' }),
  }),
  volumeInput: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .optional(),
  ecLevel: z
    .union([
      z.number().min(0, 'EC must be non-negative').max(10, 'EC must be less than 10'),
      z.literal('').transform(() => null),
      z.nan().transform(() => null),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),
  phLevel: z
    .union([
      z.number().min(0, 'pH must be between 0 and 14').max(14, 'pH must be between 0 and 14'),
      z.literal('').transform(() => null),
      z.nan().transform(() => null),
      z.null(),
      z.undefined(),
    ])
    .optional()
    .nullable(),
  nutrientMix: z.string().max(200, 'Nutrient mix must be 200 characters or less').optional(),
  amendments: z.array(amendmentSchema).optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  fedAt: z.string().min(1, 'Date/time is required'),
  applyToAllPlants: z.boolean().optional(),
});

type FormData = z.infer<typeof feedingSchema>;

// Output type for the form submission (always in ml)
export interface LogFeedingFormData {
  feedingType: 'watering' | 'nutrients' | 'foliar';
  amountMl: number;
  ecLevel?: number | null;
  phLevel?: number | null;
  nutrientMix?: string;
  amendments?: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  notes?: string;
  fedAt: string;
  applyToAllPlants?: boolean;
}

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
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('milliliters');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(feedingSchema),
    defaultValues: {
      feedingType: 'watering',
      volumeInput: undefined,
      ecLevel: null,
      phLevel: null,
      nutrientMix: '',
      amendments: [],
      notes: '',
      fedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      applyToAllPlants: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'amendments',
  });

  const selectedFeedingType = watch('feedingType');
  const applyToAllPlants = watch('applyToAllPlants');
  const volumeInput = watch('volumeInput');

  const handleFormSubmit = (data: FormData) => {
    // Convert volume to milliliters if needed
    const volumeMl = data.volumeInput !== undefined
      ? toMilliliters(data.volumeInput, volumeUnit)
      : 0;

    // Transform the data to match the expected output type
    const submitData: LogFeedingFormData = {
      feedingType: data.feedingType,
      amountMl: volumeMl,
      ecLevel: data.ecLevel,
      phLevel: data.phLevel,
      nutrientMix: data.nutrientMix,
      amendments: data.amendments,
      notes: data.notes,
      fedAt: data.fedAt,
      applyToAllPlants: data.applyToAllPlants,
    };

    onSubmit(submitData);
  };

  const volumeError = validateVolume(volumeInput, volumeUnit);
  const conversionText = getVolumeConversion(volumeInput, volumeUnit);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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

      {/* Amount Field with Unit Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="volumeInput">
            Amount <span className="text-destructive">*</span>
          </Label>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 px-3 text-xs',
                volumeUnit === 'milliliters' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
              )}
              onClick={() => setVolumeUnit('milliliters')}
            >
              ml
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 px-3 text-xs',
                volumeUnit === 'gallons' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
              )}
              onClick={() => setVolumeUnit('gallons')}
            >
              gal
            </Button>
          </div>
        </div>
        <Input
          id="volumeInput"
          type="number"
          step={volumeUnit === 'milliliters' ? '1' : '0.01'}
          placeholder={volumeUnit === 'milliliters' ? 'e.g., 500' : 'e.g., 0.13'}
          {...register('volumeInput', { valueAsNumber: true })}
          aria-invalid={!!volumeError}
          aria-describedby={volumeError ? 'volume-error' : undefined}
        />
        {volumeError && (
          <p id="volume-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {volumeError}
          </p>
        )}
        {conversionText && !volumeError && (
          <p className="text-xs text-muted-foreground">
            ≈ {conversionText}
          </p>
        )}
        {!volumeInput && (
          <p className="text-xs text-muted-foreground">
            Enter the water or solution volume
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

      {/* Soil Amendments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Soil Amendments (optional)</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Add organic soil amendments like kelp meal, dolomite lime, etc.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: '', amount: 0, unit: 'cups' as const })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Amendment
          </Button>
        </div>

        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <Label htmlFor={`amendments.${index}.name`} className="text-xs">
                      Amendment Name
                    </Label>
                    <Input
                      id={`amendments.${index}.name`}
                      placeholder="e.g., Kelp Meal"
                      {...register(`amendments.${index}.name`)}
                      aria-invalid={!!errors.amendments?.[index]?.name}
                    />
                    {errors.amendments?.[index]?.name && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.amendments[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`amendments.${index}.amount`} className="text-xs">
                      Amount
                    </Label>
                    <Input
                      id={`amendments.${index}.amount`}
                      type="number"
                      step="0.01"
                      placeholder="4"
                      {...register(`amendments.${index}.amount`, { valueAsNumber: true })}
                      aria-invalid={!!errors.amendments?.[index]?.amount}
                    />
                    {errors.amendments?.[index]?.amount && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.amendments[index]?.amount?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`amendments.${index}.unit`} className="text-xs">
                      Unit
                    </Label>
                    <Select
                      value={watch(`amendments.${index}.unit`)}
                      onValueChange={(value) => setValue(`amendments.${index}.unit`, value as any)}
                    >
                      <SelectTrigger id={`amendments.${index}.unit`} className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teaspoons">teaspoons</SelectItem>
                        <SelectItem value="tablespoons">tablespoons</SelectItem>
                        <SelectItem value="cups">cups</SelectItem>
                        <SelectItem value="grams">grams</SelectItem>
                        <SelectItem value="kilograms">kilograms</SelectItem>
                        <SelectItem value="ounces">ounces</SelectItem>
                        <SelectItem value="pounds">pounds</SelectItem>
                        <SelectItem value="milliliters">milliliters</SelectItem>
                        <SelectItem value="liters">liters</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.amendments?.[index]?.unit && (
                      <p className="text-xs text-destructive mt-1">
                        {errors.amendments[index]?.unit?.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => remove(index)}
                  aria-label="Remove amendment"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
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