import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grow, LightingType, MediumType } from '@/services/growsApi';
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
import { cn } from '@/lib/utils';
import {
  type TemperatureUnit,
  fromCelsius,
  toCelsius,
} from '@/utils/temperatureUtils';

// Validation schema using Zod
const growSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  startDate: z.string().min(1, 'Start date is required'),
  status: z.enum(['planning', 'active', 'flowering', 'drying', 'completed'], {
    errorMap: () => ({ message: 'Please select a status' }),
  }).optional(),
  environmentType: z.enum(['indoor', 'outdoor', 'greenhouse'], {
    errorMap: () => ({ message: 'Please select an environment type' }),
  }),
  lightingType: z.enum(['led', 'hps', 'mh', 'cmh', 'fluorescent', 'natural'], {
    errorMap: () => ({ message: 'Please select a lighting type' }),
  }).optional(),
  mediumType: z.enum(['soil', 'coco', 'hydro', 'aeroponics', 'aquaponics'], {
    errorMap: () => ({ message: 'Please select a medium type' }),
  }).optional(),
  location: z.string().max(255, 'Location must be 255 characters or less').optional(),
  targetTempMin: z.coerce.number().min(-50, 'Min temp must be at least -50°C').max(100, 'Min temp must not exceed 100°C').optional().or(z.literal('')),
  targetTempMax: z.coerce.number().min(-50, 'Max temp must be at least -50°C').max(100, 'Max temp must not exceed 100°C').optional().or(z.literal('')),
  targetHumidityMin: z.coerce.number().min(0, 'Min humidity must be at least 0%').max(100, 'Min humidity must not exceed 100%').optional().or(z.literal('')),
  targetHumidityMax: z.coerce.number().min(0, 'Max humidity must be at least 0%').max(100, 'Max humidity must not exceed 100%').optional().or(z.literal('')),
  expectedHarvestDate: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
});

export type GrowFormData = z.infer<typeof growSchema>;

interface GrowFormProps {
  grow?: Grow;
  onSubmit: (data: GrowFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * GrowForm - Reusable form for creating and editing grows
 * Includes all metadata fields for comprehensive grow tracking
 * Note: startDate is immutable in edit mode (read-only)
 */
export function GrowForm({
  grow,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: GrowFormProps) {
  const isEditMode = !!grow;

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) {
      return format(new Date(), 'yyyy-MM-dd');
    }
    // If the date is already in YYYY-MM-DD format, return it directly
    // This avoids timezone issues when parsing LocalDate from backend
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
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
  } = useForm<GrowFormData>({
    resolver: zodResolver(growSchema),
    defaultValues: {
      name: grow?.name || '',
      startDate: formatDateForInput(grow?.startDate),
      status: grow?.status || 'planning',
      environmentType: grow?.environmentType || 'indoor',
      lightingType: grow?.lightingType,
      mediumType: grow?.mediumType,
      location: grow?.location || '',
      targetTempMin: grow?.targetTempMin || ('' as any),
      targetTempMax: grow?.targetTempMax || ('' as any),
      targetHumidityMin: grow?.targetHumidityMin || ('' as any),
      targetHumidityMax: grow?.targetHumidityMax || ('' as any),
      expectedHarvestDate: formatDateForInput(grow?.expectedHarvestDate) || '',
      tags: grow?.tags?.join(', ') || '',
      notes: grow?.notes || '',
    },
  });

  const selectedStatus = watch('status');
  const selectedEnvironmentType = watch('environmentType');
  const selectedLightingType = watch('lightingType');
  const selectedMediumType = watch('mediumType');

  // Temperature unit state (defaults to Celsius)
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>('celsius');

  // Watch temperature values
  const targetTempMin = watch('targetTempMin');
  const targetTempMax = watch('targetTempMax');

  // Display temperature values in selected unit
  const displayTempMin = tempUnit === 'fahrenheit' && targetTempMin !== '' && targetTempMin !== undefined
    ? fromCelsius(Number(targetTempMin), 'fahrenheit')
    : targetTempMin;

  const displayTempMax = tempUnit === 'fahrenheit' && targetTempMax !== '' && targetTempMax !== undefined
    ? fromCelsius(Number(targetTempMax), 'fahrenheit')
    : targetTempMax;

  // Handle temperature input changes
  const handleTempChange = (field: 'targetTempMin' | 'targetTempMax', value: string) => {
    if (value === '') {
      setValue(field, '' as any);
      return;
    }
    const numValue = parseFloat(value);
    // Convert to Celsius for storage if in Fahrenheit mode
    const celsiusValue = toCelsius(numValue, tempUnit);
    setValue(field, celsiusValue as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>

        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Summer 2025 Indoor"
            {...register('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Start Date Field */}
        <div className="space-y-2">
          <Label htmlFor="startDate">
            Start Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            disabled={isEditMode}
            className={isEditMode ? 'bg-muted cursor-not-allowed' : ''}
            {...register('startDate')}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'startDate-error' : undefined}
          />
          {errors.startDate && (
            <p id="startDate-error" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.startDate.message}
            </p>
          )}
          {isEditMode && (
            <p className="text-xs text-muted-foreground">
              Start date cannot be changed after creation
            </p>
          )}
        </div>

        {/* Status Field - Only show in edit mode */}
        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setValue('status', value as any)}
            >
              <SelectTrigger id="status" aria-invalid={!!errors.status}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="flowering">Flowering</SelectItem>
                <SelectItem value="drying">Drying</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p id="status-error" className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.status.message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Environment Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Environment Setup</h3>

        {/* Environment Type Field */}
        <div className="space-y-2">
          <Label htmlFor="environmentType">
            Environment Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedEnvironmentType}
            onValueChange={(value) => setValue('environmentType', value as any)}
          >
            <SelectTrigger id="environmentType" aria-invalid={!!errors.environmentType}>
              <SelectValue placeholder="Select environment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
              <SelectItem value="greenhouse">Greenhouse</SelectItem>
            </SelectContent>
          </Select>
          {errors.environmentType && (
            <p
              id="environmentType-error"
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              {errors.environmentType.message}
            </p>
          )}
        </div>

        {/* Lighting Type Field */}
        <div className="space-y-2">
          <Label htmlFor="lightingType">Lighting Type</Label>
          <Select
            value={selectedLightingType}
            onValueChange={(value) => setValue('lightingType', value as LightingType)}
          >
            <SelectTrigger id="lightingType" aria-invalid={!!errors.lightingType}>
              <SelectValue placeholder="Select lighting type (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="led">LED</SelectItem>
              <SelectItem value="hps">HPS (High Pressure Sodium)</SelectItem>
              <SelectItem value="mh">MH (Metal Halide)</SelectItem>
              <SelectItem value="cmh">CMH (Ceramic Metal Halide)</SelectItem>
              <SelectItem value="fluorescent">Fluorescent</SelectItem>
              <SelectItem value="natural">Natural Sunlight</SelectItem>
            </SelectContent>
          </Select>
          {errors.lightingType && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.lightingType.message}
            </p>
          )}
        </div>

        {/* Medium Type Field */}
        <div className="space-y-2">
          <Label htmlFor="mediumType">Growing Medium</Label>
          <Select
            value={selectedMediumType}
            onValueChange={(value) => setValue('mediumType', value as MediumType)}
          >
            <SelectTrigger id="mediumType" aria-invalid={!!errors.mediumType}>
              <SelectValue placeholder="Select medium type (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soil">Soil</SelectItem>
              <SelectItem value="coco">Coco Coir</SelectItem>
              <SelectItem value="hydro">Hydroponic</SelectItem>
              <SelectItem value="aeroponics">Aeroponics</SelectItem>
              <SelectItem value="aquaponics">Aquaponics</SelectItem>
            </SelectContent>
          </Select>
          {errors.mediumType && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.mediumType.message}
            </p>
          )}
        </div>

        {/* Location Field */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., Tent 2, Basement, North Garden"
            {...register('location')}
            aria-invalid={!!errors.location}
            aria-describedby={errors.location ? 'location-error' : undefined}
          />
          {errors.location && (
            <p id="location-error" className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.location.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional physical location or grow space identifier
          </p>
        </div>
      </div>

      {/* Target Ranges Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Target Environmental Ranges</h3>

        {/* Temperature Range with Unit Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Target Temperature Range</Label>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  'h-7 px-3 text-xs',
                  tempUnit === 'celsius' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                )}
                onClick={() => setTempUnit('celsius')}
              >
                °C
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  'h-7 px-3 text-xs',
                  tempUnit === 'fahrenheit' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                )}
                onClick={() => setTempUnit('fahrenheit')}
              >
                °F
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetTempMin" className="text-sm text-muted-foreground">
                Min
              </Label>
              <Input
                id="targetTempMin"
                type="number"
                step="0.1"
                placeholder={tempUnit === 'celsius' ? 'e.g., 20' : 'e.g., 68'}
                value={displayTempMin === '' ? '' : displayTempMin}
                onChange={(e) => handleTempChange('targetTempMin', e.target.value)}
                aria-invalid={!!errors.targetTempMin}
              />
              {errors.targetTempMin && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.targetTempMin.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetTempMax" className="text-sm text-muted-foreground">
                Max
              </Label>
              <Input
                id="targetTempMax"
                type="number"
                step="0.1"
                placeholder={tempUnit === 'celsius' ? 'e.g., 26' : 'e.g., 79'}
                value={displayTempMax === '' ? '' : displayTempMax}
                onChange={(e) => handleTempChange('targetTempMax', e.target.value)}
                aria-invalid={!!errors.targetTempMax}
              />
              {errors.targetTempMax && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.targetTempMax.message}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Optional temperature range for optimal growing conditions
          </p>
        </div>

        {/* Humidity Range */}
        <div className="space-y-2">
          <Label>Target Humidity Range (%)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetHumidityMin" className="text-sm text-muted-foreground">
                Min
              </Label>
              <Input
                id="targetHumidityMin"
                type="number"
                step="0.1"
                placeholder="e.g., 40"
                {...register('targetHumidityMin')}
                aria-invalid={!!errors.targetHumidityMin}
              />
              {errors.targetHumidityMin && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.targetHumidityMin.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetHumidityMax" className="text-sm text-muted-foreground">
                Max
              </Label>
              <Input
                id="targetHumidityMax"
                type="number"
                step="0.1"
                placeholder="e.g., 60"
                {...register('targetHumidityMax')}
                aria-invalid={!!errors.targetHumidityMax}
              />
              {errors.targetHumidityMax && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.targetHumidityMax.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Planning Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Planning</h3>

        {/* Expected Harvest Date */}
        <div className="space-y-2">
          <Label htmlFor="expectedHarvestDate">Expected Harvest Date</Label>
          <Input
            id="expectedHarvestDate"
            type="date"
            {...register('expectedHarvestDate')}
            aria-invalid={!!errors.expectedHarvestDate}
          />
          {errors.expectedHarvestDate && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.expectedHarvestDate.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional estimated harvest date for planning purposes
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            type="text"
            placeholder="e.g., LED, Organic, High Yield"
            {...register('tags')}
            aria-invalid={!!errors.tags}
          />
          {errors.tags && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.tags.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter tags separated by commas for easy categorization
          </p>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Additional Notes</h3>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes about this grow..."
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
          <p className="text-xs text-muted-foreground">
            Maximum 1000 characters
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
          {isSubmitting ? 'Saving...' : grow ? 'Update Grow' : 'Create Grow'}
        </Button>
      </div>
    </form>
  );
}