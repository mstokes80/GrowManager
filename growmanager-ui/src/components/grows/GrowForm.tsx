import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grow, LightingType, MediumType } from '@/services/growsApi';
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
import { AlertCircle, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  type TemperatureUnit,
  fromCelsius,
  toCelsius,
} from '@/utils/temperatureUtils';

// Light equipment validation schema
const lightEquipmentSchema = z.object({
  name: z.string().min(1, 'Light name is required'),
  wattage: z
    .number({ invalid_type_error: 'Wattage must be a number' })
    .positive('Wattage must be positive'),
});

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
  canopySquareFt: z.coerce.number().min(0, 'Canopy size must be at least 0').max(10000, 'Canopy size must not exceed 10000').optional().or(z.literal('')),
  vegetativeDate: z.string().optional(),
  flowerDate: z.string().optional(),
  lights: z.array(lightEquipmentSchema).optional(),
  tempUom: z.enum(['C', 'F'], {
    errorMap: () => ({ message: 'Please select a temperature unit' }),
  }).optional(),
  tags: z.string().optional(), // Comma-separated tags
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  // Organic growing fields
  isOrganic: z.boolean().optional(),
  soilSource: z.string().max(255, 'Soil source must be 255 characters or less').optional(),
  soilTexture: z.string().max(100, 'Soil texture must be 100 characters or less').optional(),
  organicMatterPercent: z.coerce.number().min(0, 'Organic matter must be at least 0%').max(100, 'Organic matter must not exceed 100%').optional().or(z.literal('')),
  baseNutrientProfile: z.string().max(255, 'Base nutrient profile must be 255 characters or less').optional(),
  soilReusedCycles: z.coerce.number().min(0, 'Soil reused cycles must be at least 0').optional().or(z.literal('')),
  mycorrhizaeAdded: z.boolean().optional(),
  microbeInoculants: z.string().optional(), // Comma-separated list
  coverCropType: z.string().max(255, 'Cover crop type must be 255 characters or less').optional(),
  mulchType: z.string().max(255, 'Mulch type must be 255 characters or less').optional(),
  compostReused: z.boolean().optional(),
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
  const formatDateForInput = (dateString?: string, defaultToToday = false) => {
    if (!dateString) {
      return defaultToToday ? format(new Date(), 'yyyy-MM-dd') : '';
    }
    // If the date is already in YYYY-MM-DD format, return it directly
    // This avoids timezone issues when parsing LocalDate from backend
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return defaultToToday ? format(new Date(), 'yyyy-MM-dd') : '';
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<GrowFormData>({
    resolver: zodResolver(growSchema),
    defaultValues: {
      name: grow?.name || '',
      startDate: formatDateForInput(grow?.startDate, true),
      status: grow?.status || 'planning',
      environmentType: grow?.environmentType || 'indoor',
      lightingType: grow?.lightingType,
      mediumType: grow?.mediumType,
      location: grow?.location || '',
      targetTempMin: grow?.targetTempMin || ('' as any),
      targetTempMax: grow?.targetTempMax || ('' as any),
      targetHumidityMin: grow?.targetHumidityMin || ('' as any),
      targetHumidityMax: grow?.targetHumidityMax || ('' as any),
      expectedHarvestDate: formatDateForInput(grow?.expectedHarvestDate, false),
      canopySquareFt: grow?.canopySquareFt || ('' as any),
      vegetativeDate: formatDateForInput(grow?.vegetativeDate, false),
      flowerDate: formatDateForInput(grow?.flowerDate, false),
      lights: grow?.lights || [],
      tempUom: (grow?.tempUom === 'C' || grow?.tempUom === 'F') ? grow.tempUom : undefined,
      tags: grow?.tags?.join(', ') || '',
      notes: grow?.notes || '',
      // Organic growing defaults
      isOrganic: grow?.isOrganic || false,
      soilSource: grow?.soilSource || '',
      soilTexture: grow?.soilTexture || '',
      organicMatterPercent: grow?.organicMatterPercent || ('' as any),
      baseNutrientProfile: grow?.baseNutrientProfile || '',
      soilReusedCycles: grow?.soilReusedCycles || ('' as any),
      mycorrhizaeAdded: grow?.mycorrhizaeAdded || false,
      microbeInoculants: grow?.microbeInoculants?.join(', ') || '',
      coverCropType: grow?.coverCropType || '',
      mulchType: grow?.mulchType || '',
      compostReused: grow?.compostReused || false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lights',
  });

  const selectedStatus = watch('status');
  const selectedEnvironmentType = watch('environmentType');
  const selectedLightingType = watch('lightingType');
  const selectedMediumType = watch('mediumType');
  const isOrganic = watch('isOrganic');

  // Temperature unit state (defaults to Celsius, or from database)
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>(
    grow?.tempUom === 'F' ? 'fahrenheit' : 'celsius'
  );

  // Watch temperature values
  const targetTempMin = watch('targetTempMin');
  const targetTempMax = watch('targetTempMax');

  // Handle temperature unit toggle - convert existing values
  const handleTempUnitChange = (newUnit: TemperatureUnit) => {
    const newUomValue = newUnit === 'celsius' ? 'C' : 'F';

    // Convert existing temperature values when switching units
    if (targetTempMin !== '' && targetTempMin !== undefined) {
      const convertedMin = newUnit === 'celsius'
        ? toCelsius(Number(targetTempMin), tempUnit)
        : fromCelsius(Number(targetTempMin), tempUnit);
      setValue('targetTempMin', convertedMin as any);
    }

    if (targetTempMax !== '' && targetTempMax !== undefined) {
      const convertedMax = newUnit === 'celsius'
        ? toCelsius(Number(targetTempMax), tempUnit)
        : fromCelsius(Number(targetTempMax), tempUnit);
      setValue('targetTempMax', convertedMax as any);
    }

    setTempUnit(newUnit);
    setValue('tempUom', newUomValue);
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

        {/* Light Equipment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Light Equipment</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', wattage: 0 })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Light
            </Button>
          </div>

          {fields.length > 0 && (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md bg-muted/30">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`lights.${index}.name`} className="text-sm">
                        Name
                      </Label>
                      <Input
                        id={`lights.${index}.name`}
                        placeholder="e.g., Spider Farmer SF4000"
                        {...register(`lights.${index}.name` as const)}
                        aria-invalid={!!errors.lights?.[index]?.name}
                      />
                      {errors.lights?.[index]?.name && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.lights[index]?.name?.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`lights.${index}.wattage`} className="text-sm">
                        Wattage
                      </Label>
                      <Input
                        id={`lights.${index}.wattage`}
                        type="number"
                        step="1"
                        placeholder="e.g., 480"
                        {...register(`lights.${index}.wattage` as const, { valueAsNumber: true })}
                        aria-invalid={!!errors.lights?.[index]?.wattage}
                      />
                      {errors.lights?.[index]?.wattage && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.lights[index]?.wattage?.message}
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
                    aria-label="Remove light"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No light equipment added yet. Click "Add Light" to add your grow lights.
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
                onClick={() => handleTempUnitChange('celsius')}
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
                onClick={() => handleTempUnitChange('fahrenheit')}
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
                {...register('targetTempMin')}
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
                {...register('targetTempMax')}
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

        {/* Canopy Square Footage */}
        <div className="space-y-2">
          <Label htmlFor="canopySquareFt">Canopy Size (sq ft)</Label>
          <Input
            id="canopySquareFt"
            type="number"
            step="0.1"
            placeholder="e.g., 16"
            {...register('canopySquareFt')}
            aria-invalid={!!errors.canopySquareFt}
          />
          {errors.canopySquareFt && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.canopySquareFt.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Optional grow area size for yield per square foot calculations
          </p>
        </div>

        {/* Phase Transition Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vegetativeDate">Vegetative Date</Label>
            <Input
              id="vegetativeDate"
              type="date"
              {...register('vegetativeDate')}
              aria-invalid={!!errors.vegetativeDate}
            />
            {errors.vegetativeDate && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.vegetativeDate.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              When grow transitions to veg stage
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="flowerDate">Flower Date</Label>
            <Input
              id="flowerDate"
              type="date"
              {...register('flowerDate')}
              aria-invalid={!!errors.flowerDate}
            />
            {errors.flowerDate && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.flowerDate.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              When grow transitions to flower stage
            </p>
          </div>
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

      {/* Organic Growing Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Organic Growing</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isOrganic"
              checked={isOrganic}
              onChange={(e) => setValue('isOrganic', e.target.checked)}
            />
            <Label htmlFor="isOrganic" className="text-sm font-normal cursor-pointer">
              Enable organic tracking
            </Label>
          </div>
        </div>

        {isOrganic && (
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            {/* Soil Characteristics */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Soil Characteristics</h4>

              <div className="space-y-2">
                <Label htmlFor="soilSource">Soil Source</Label>
                <Input
                  id="soilSource"
                  type="text"
                  placeholder="e.g., Coast of Maine Stonington Blend"
                  {...register('soilSource')}
                  aria-invalid={!!errors.soilSource}
                />
                {errors.soilSource && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.soilSource.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilTexture">Soil Texture</Label>
                <Input
                  id="soilTexture"
                  type="text"
                  placeholder="e.g., loamy, sandy, clay"
                  {...register('soilTexture')}
                  aria-invalid={!!errors.soilTexture}
                />
                {errors.soilTexture && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.soilTexture.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="organicMatterPercent">Organic Matter (%)</Label>
                <Input
                  id="organicMatterPercent"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 25"
                  {...register('organicMatterPercent')}
                  aria-invalid={!!errors.organicMatterPercent}
                />
                {errors.organicMatterPercent && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.organicMatterPercent.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseNutrientProfile">Base Nutrient Profile</Label>
                <Input
                  id="baseNutrientProfile"
                  type="text"
                  placeholder="e.g., 3-1-2 (compost base)"
                  {...register('baseNutrientProfile')}
                  aria-invalid={!!errors.baseNutrientProfile}
                />
                {errors.baseNutrientProfile && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.baseNutrientProfile.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  NPK profile from soil or compost
                </p>
              </div>
            </div>

            {/* Soil Reuse */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Soil Reuse</h4>
              <div className="space-y-2">
                <Label htmlFor="soilReusedCycles">Soil Reused Cycles</Label>
                <Input
                  id="soilReusedCycles"
                  type="number"
                  placeholder="e.g., 2"
                  {...register('soilReusedCycles')}
                  aria-invalid={!!errors.soilReusedCycles}
                />
                {errors.soilReusedCycles && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.soilReusedCycles.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of times this soil has been reused
                </p>
              </div>
            </div>

            {/* Beneficial Biology */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Beneficial Biology</h4>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mycorrhizaeAdded"
                  checked={watch('mycorrhizaeAdded')}
                  onChange={(e) => setValue('mycorrhizaeAdded', e.target.checked)}
                />
                <Label htmlFor="mycorrhizaeAdded" className="text-sm font-normal cursor-pointer">
                  Mycorrhizal fungi added
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="microbeInoculants">Microbe Inoculants</Label>
                <Input
                  id="microbeInoculants"
                  type="text"
                  placeholder="e.g., Recharge, Mammoth P"
                  {...register('microbeInoculants')}
                  aria-invalid={!!errors.microbeInoculants}
                />
                {errors.microbeInoculants && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.microbeInoculants.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter inoculants separated by commas
                </p>
              </div>
            </div>

            {/* Cover Crops and Mulching */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Cover Crops & Mulching</h4>

              <div className="space-y-2">
                <Label htmlFor="coverCropType">Cover Crop Type</Label>
                <Input
                  id="coverCropType"
                  type="text"
                  placeholder="e.g., clover, rye"
                  {...register('coverCropType')}
                  aria-invalid={!!errors.coverCropType}
                />
                {errors.coverCropType && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.coverCropType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mulchType">Mulch Type</Label>
                <Input
                  id="mulchType"
                  type="text"
                  placeholder="e.g., straw, wood chips"
                  {...register('mulchType')}
                  aria-invalid={!!errors.mulchType}
                />
                {errors.mulchType && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.mulchType.message}
                  </p>
                )}
              </div>
            </div>

            {/* Compost Reuse */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="compostReused"
                checked={watch('compostReused')}
                onChange={(e) => setValue('compostReused', e.target.checked)}
              />
              <Label htmlFor="compostReused" className="text-sm font-normal cursor-pointer">
                Compost reused from previous grows
              </Label>
            </div>
          </div>
        )}
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