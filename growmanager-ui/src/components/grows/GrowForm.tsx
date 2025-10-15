import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Grow } from '@/services/growsApi';
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
 * Implements Task Group 5.2.4 and 5.2.5
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
      notes: grow?.notes || '',
    },
  });

  const selectedStatus = watch('status');
  const selectedEnvironmentType = watch('environmentType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

      {/* Notes Field */}
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