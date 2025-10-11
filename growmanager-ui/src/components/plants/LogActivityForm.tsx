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
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

// Validation schema using Zod
const activitySchema = z.object({
  activityType: z.enum(['training', 'pruning', 'defoliation', 'transplant', 'pest_control', 'other'], {
    errorMap: () => ({ message: 'Please select an activity type' }),
  }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  loggedAt: z.string().min(1, 'Date/time is required'),
  applyToAllPlants: z.boolean().optional(),
});

export type LogActivityFormData = z.infer<typeof activitySchema>;

interface LogActivityFormProps {
  plantId: string;
  onSubmit: (data: LogActivityFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

/**
 * LogActivityForm - Form for logging training/maintenance activities
 * Implements Task Group 6.4.6
 */
export function LogActivityForm({
  // plantId is passed for potential future use in the form
  plantId: _plantId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LogActivityFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LogActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityType: 'other',
      description: '',
      notes: '',
      loggedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      applyToAllPlants: false,
    },
  });

  const selectedActivityType = watch('activityType');
  const applyToAllPlants = watch('applyToAllPlants');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Activity Type Field */}
      <div className="space-y-2">
        <Label htmlFor="activityType">
          Activity Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedActivityType}
          onValueChange={(value) => setValue('activityType', value as any)}
        >
          <SelectTrigger id="activityType" aria-invalid={!!errors.activityType}>
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="training">Training (LST, HST, etc.)</SelectItem>
            <SelectItem value="pruning">Pruning</SelectItem>
            <SelectItem value="defoliation">Defoliation</SelectItem>
            <SelectItem value="transplant">Transplant</SelectItem>
            <SelectItem value="pest_control">Pest Control</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.activityType && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.activityType.message}
          </p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Describe what was done (e.g., 'Removed lower fan leaves', 'Applied LST to main stem')"
          rows={3}
          {...register('description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.description.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Briefly describe the activity performed
        </p>
      </div>

      {/* Date/Time Field */}
      <div className="space-y-2">
        <Label htmlFor="loggedAt">
          Date & Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id="loggedAt"
          type="datetime-local"
          {...register('loggedAt')}
          aria-invalid={!!errors.loggedAt}
          aria-describedby={errors.loggedAt ? 'loggedAt-error' : undefined}
        />
        {errors.loggedAt && (
          <p id="loggedAt-error" className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.loggedAt.message}
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
            This will create the same activity log for all plants in the current grow cycle
          </p>
        </div>
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional observations, concerns, or details..."
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
          {isSubmitting ? 'Logging...' : 'Log Activity'}
        </Button>
      </div>
    </form>
  );
}