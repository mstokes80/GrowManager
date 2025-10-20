import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface TimeRange {
  from: Date;
  to: Date;
  label: string;
}

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  presets?: TimeRangePreset[];
  showCustom?: boolean;
  className?: string;
  disabled?: boolean;
}

interface TimeRangePreset {
  label: string;
  days?: number;
  from?: Date;
  to?: Date;
}

// Default presets
const DEFAULT_PRESETS: TimeRangePreset[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  {
    label: 'All time',
    from: startOfDay(new Date(2000, 0, 1)), // January 1, 2000
    to: endOfDay(new Date())
  },
];

/**
 * TimeRangeSelector - Component for selecting date ranges
 * Provides preset options and optional custom date selection
 */
export function TimeRangeSelector({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  showCustom = false,
  className = '',
  disabled = false,
}: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<string>(
    format(value.from, 'yyyy-MM-dd')
  );
  const [customTo, setCustomTo] = useState<string>(
    format(value.to, 'yyyy-MM-dd')
  );

  const handlePresetClick = (preset: TimeRangePreset) => {
    let from: Date;
    let to: Date;

    if (preset.from && preset.to) {
      // Use preset dates but always use today for 'to' to ensure current data
      from = preset.from;
      to = endOfDay(new Date());
    } else if (preset.days) {
      to = endOfDay(new Date());
      from = startOfDay(subDays(new Date(), preset.days - 1));
    } else {
      // Default to last 7 days if no configuration
      to = endOfDay(new Date());
      from = startOfDay(subDays(new Date(), 6));
    }

    onChange({
      from,
      to,
      label: preset.label,
    });
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    const from = startOfDay(new Date(customFrom));
    const to = endOfDay(new Date(customTo));

    if (from <= to) {
      onChange({
        from,
        to,
        label: `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`,
      });
      setIsOpen(false);
    }
  };

  const isPresetActive = (preset: TimeRangePreset): boolean => {
    if (!value) return false;

    if (preset.from && preset.to) {
      // For fixed date presets (like "All time"), check if from matches and to is today
      const expectedTo = endOfDay(new Date());
      return (
        value.from.getTime() === preset.from.getTime() &&
        Math.abs(value.to.getTime() - expectedTo.getTime()) < 86400000 // Within 1 day
      );
    }

    if (preset.days) {
      const expectedFrom = startOfDay(subDays(new Date(), preset.days - 1));
      const expectedTo = endOfDay(new Date());

      return (
        Math.abs(value.from.getTime() - expectedFrom.getTime()) < 86400000 && // Within 1 day
        Math.abs(value.to.getTime() - expectedTo.getTime()) < 86400000
      );
    }

    return false;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2', className)}
          disabled={disabled}
        >
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{value.label}</span>
          <span className="sm:hidden">
            {format(value.from, 'MMM d')} - {format(value.to, 'MMM d')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3">
          <div className="space-y-1">
            {presets.map((preset, index) => (
              <Button
                key={index}
                variant={isPresetActive(preset) ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {showCustom && (
            <>
              <div className="border-t my-3" />
              <div className="space-y-3">
                <div className="text-sm font-medium">Custom Range</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="custom-from"
                      className="text-xs text-muted-foreground"
                    >
                      From
                    </label>
                    <input
                      id="custom-from"
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      max={customTo}
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="custom-to"
                      className="text-xs text-muted-foreground"
                    >
                      To
                    </label>
                    <input
                      id="custom-to"
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      min={customFrom}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCustomApply}
                  disabled={!customFrom || !customTo}
                >
                  Apply Custom Range
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}