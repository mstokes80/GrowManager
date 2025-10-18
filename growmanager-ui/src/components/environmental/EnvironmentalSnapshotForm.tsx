import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type TemperatureUnit,
  getTemperatureConversion,
  validateTemperature,
  toCelsius,
} from '@/utils/temperatureUtils';

const environmentalSnapshotSchema = z.object({
  timestamp: z.string().optional(),
  temperatureInput: z.coerce
    .number()
    .optional(),
  humidity: z.coerce
    .number()
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must not exceed 100%')
    .optional(),
  co2: z.coerce
    .number()
    .min(0, 'CO2 must be at least 0 ppm')
    .max(5000, 'CO2 must not exceed 5000 ppm')
    .optional(),
  lightIntensity: z.coerce
    .number()
    .min(0, 'Light intensity must be at least 0 PPFD')
    .max(2000, 'Light intensity must not exceed 2000 PPFD')
    .optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof environmentalSnapshotSchema>;

export interface EnvironmentalSnapshotFormData {
  timestamp?: string;
  temperature?: number; // Always in Celsius for API
  humidity?: number;
  co2?: number;
  lightIntensity?: number;
  notes?: string;
}

interface EnvironmentalSnapshotFormProps {
  onSubmit: (data: EnvironmentalSnapshotFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * EnvironmentalSnapshotForm - Form for creating environmental snapshots
 * Allows manual entry of temperature, humidity, CO2, and light intensity
 * Supports both Celsius and Fahrenheit for temperature input
 */
export function EnvironmentalSnapshotForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EnvironmentalSnapshotFormProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('celsius');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(environmentalSnapshotSchema),
    defaultValues: {
      timestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    },
  });

  const temperatureInput = watch('temperatureInput');

  const handleFormSubmit = (data: FormData) => {
    // Convert temperature to Celsius if needed
    const temperatureCelsius = data.temperatureInput !== undefined
      ? toCelsius(data.temperatureInput, temperatureUnit)
      : undefined;

    // Transform the data to match the expected output type
    const submitData: EnvironmentalSnapshotFormData = {
      timestamp: data.timestamp,
      temperature: temperatureCelsius,
      humidity: data.humidity,
      co2: data.co2,
      lightIntensity: data.lightIntensity,
      notes: data.notes,
    };

    onSubmit(submitData);
  };

  const temperatureError = validateTemperature(temperatureInput, temperatureUnit);
  const conversionText = getTemperatureConversion(temperatureInput, temperatureUnit);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Timestamp */}
      <div className="space-y-2">
        <Label htmlFor="timestamp">Timestamp</Label>
        <Input
          id="timestamp"
          type="datetime-local"
          {...register('timestamp')}
        />
        {errors.timestamp && (
          <p className="text-sm text-destructive">{errors.timestamp.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Leave blank to use current time
        </p>
      </div>

      {/* Temperature with Unit Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="temperature">Temperature</Label>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 px-3 text-xs',
                temperatureUnit === 'celsius' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
              )}
              onClick={() => setTemperatureUnit('celsius')}
            >
              °C
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                'h-7 px-3 text-xs',
                temperatureUnit === 'fahrenheit' && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
              )}
              onClick={() => setTemperatureUnit('fahrenheit')}
            >
              °F
            </Button>
          </div>
        </div>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          placeholder={temperatureUnit === 'celsius' ? 'e.g., 24.5' : 'e.g., 76.1'}
          {...register('temperatureInput')}
        />
        {temperatureError && (
          <p className="text-sm text-destructive">{temperatureError}</p>
        )}
        {conversionText && !temperatureError && (
          <p className="text-xs text-muted-foreground">
            ≈ {conversionText}
          </p>
        )}
      </div>

      {/* Humidity */}
      <div className="space-y-2">
        <Label htmlFor="humidity">Humidity (%)</Label>
        <Input
          id="humidity"
          type="number"
          step="0.1"
          placeholder="e.g., 60"
          {...register('humidity')}
        />
        {errors.humidity && (
          <p className="text-sm text-destructive">{errors.humidity.message}</p>
        )}
      </div>

      {/* CO2 */}
      <div className="space-y-2">
        <Label htmlFor="co2">CO₂ (ppm)</Label>
        <Input
          id="co2"
          type="number"
          step="1"
          placeholder="e.g., 400"
          {...register('co2')}
        />
        {errors.co2 && (
          <p className="text-sm text-destructive">{errors.co2.message}</p>
        )}
      </div>

      {/* Light Intensity */}
      <div className="space-y-2">
        <Label htmlFor="lightIntensity">Light Intensity (PPFD)</Label>
        <Input
          id="lightIntensity"
          type="number"
          step="1"
          placeholder="e.g., 800"
          {...register('lightIntensity')}
        />
        {errors.lightIntensity && (
          <p className="text-sm text-destructive">{errors.lightIntensity.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Photosynthetic Photon Flux Density (μmol/m²/s)
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Add any additional observations..."
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isSubmitting ? 'Saving...' : 'Save Snapshot'}
        </Button>
      </div>
    </form>
  );
}