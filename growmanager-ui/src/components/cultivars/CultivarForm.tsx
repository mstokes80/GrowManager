import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Cultivar } from '@/services/cultivarsApi';
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
import { AlertCircle, Plus, X } from 'lucide-react';

// Validation schema using Zod
const cultivarSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),
  breeder: z.string().max(255, 'Breeder must be 255 characters or less').optional(),
  genetics: z.string().optional(),
  type: z.enum(['indica', 'sativa', 'hybrid', 'auto', 'unknown']),
  notes: z.string().optional(),
  characteristics: z.string().optional(), // We'll store this as JSON string for simplicity
});

export type CultivarFormData = z.infer<typeof cultivarSchema>;

interface CultivarFormProps {
  cultivar?: Cultivar;
  onSubmit: (data: CultivarFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface CharacteristicPair {
  key: string;
  value: string;
}

/**
 * CultivarForm - Reusable form for creating and editing cultivars
 * Implements Task Group 5.1.4
 */
export function CultivarForm({
  cultivar,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CultivarFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CultivarFormData>({
    resolver: zodResolver(cultivarSchema),
    defaultValues: {
      name: cultivar?.name || '',
      breeder: cultivar?.breeder || '',
      genetics: cultivar?.genetics || '',
      type: cultivar?.type || 'unknown',
      notes: cultivar?.notes || '',
      characteristics: cultivar?.characteristics
        ? JSON.stringify(cultivar.characteristics, null, 2)
        : '',
    },
  });

  const selectedType = watch('type');

  // Parse existing characteristics into key-value pairs
  const parseCharacteristics = (jsonString: string): CharacteristicPair[] => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    } catch {
      return [];
    }
  };

  // Initialize characteristics state
  const [characteristics, setCharacteristics] = useState<CharacteristicPair[]>(
    () => parseCharacteristics(cultivar?.characteristics ? JSON.stringify(cultivar.characteristics) : '')
  );

  // Add a new characteristic pair
  const addCharacteristic = () => {
    setCharacteristics([...characteristics, { key: '', value: '' }]);
  };

  // Remove a characteristic pair
  const removeCharacteristic = (index: number) => {
    setCharacteristics(characteristics.filter((_, i) => i !== index));
  };

  // Update a characteristic key or value
  const updateCharacteristic = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...characteristics];
    const item = updated[index];
    if (item) {
      item[field] = newValue;
      setCharacteristics(updated);
    }
  };

  // Convert characteristics to JSON before submit
  const handleFormSubmit = (data: CultivarFormData) => {
    // Build characteristics object from key-value pairs
    const characteristicsObj: Record<string, string> = {};
    characteristics.forEach((pair) => {
      if (pair.key.trim() && pair.value.trim()) {
        characteristicsObj[pair.key.trim()] = pair.value.trim();
      }
    });

    // Convert to JSON string
    const characteristicsJson = Object.keys(characteristicsObj).length > 0
      ? JSON.stringify(characteristicsObj)
      : '';

    onSubmit({
      ...data,
      characteristics: characteristicsJson,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Blue Dream"
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

      {/* Breeder Field */}
      <div className="space-y-2">
        <Label htmlFor="breeder">Breeder</Label>
        <Input
          id="breeder"
          type="text"
          placeholder="e.g., Humboldt Seed Organization"
          {...register('breeder')}
          aria-invalid={!!errors.breeder}
          aria-describedby={errors.breeder ? 'breeder-error' : undefined}
        />
        {errors.breeder && (
          <p id="breeder-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.breeder.message}
          </p>
        )}
      </div>

      {/* Type Field */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Type <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedType} onValueChange={(value) => setValue('type', value as any)}>
          <SelectTrigger id="type" aria-invalid={!!errors.type}>
            <SelectValue placeholder="Select cultivar type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="indica">Indica</SelectItem>
            <SelectItem value="sativa">Sativa</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
            <SelectItem value="auto">Auto-flowering</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p id="type-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.type.message}
          </p>
        )}
      </div>

      {/* Genetics Field */}
      <div className="space-y-2">
        <Label htmlFor="genetics">Genetics</Label>
        <Textarea
          id="genetics"
          placeholder="e.g., Blueberry x Haze"
          rows={2}
          {...register('genetics')}
          aria-invalid={!!errors.genetics}
          aria-describedby={errors.genetics ? 'genetics-error' : undefined}
        />
        {errors.genetics && (
          <p id="genetics-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.genetics.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Describe the genetic lineage of this cultivar
        </p>
      </div>

      {/* Characteristics Field */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Characteristics</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCharacteristic}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Property
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Add custom properties like flowering time, yield, THC content, etc.
        </p>

        {characteristics.length > 0 && (
          <div className="space-y-2 border rounded-md p-3 bg-muted/50">
            {characteristics.map((pair, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Property name (e.g., Flowering Time)"
                    value={pair.key}
                    onChange={(e) => updateCharacteristic(index, 'key', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Value (e.g., 8-9 weeks)"
                    value={pair.value}
                    onChange={(e) => updateCharacteristic(index, 'value', e.target.value)}
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharacteristic(index)}
                  className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  aria-label="Remove property"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {characteristics.length === 0 && (
          <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
            No characteristics added yet. Click "Add Property" to get started.
          </div>
        )}
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes about this cultivar..."
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
          {isSubmitting ? 'Saving...' : cultivar ? 'Update Cultivar' : 'Create Cultivar'}
        </Button>
      </div>
    </form>
  );
}