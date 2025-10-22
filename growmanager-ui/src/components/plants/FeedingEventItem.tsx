import { FeedingEvent } from '@/types/feedingEvent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Droplets, Leaf, Beaker, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FeedingEventItemProps {
  event: FeedingEvent;
  onEdit?: (event: FeedingEvent) => void;
  onDelete?: (event: FeedingEvent) => void;
}

/**
 * FeedingEventItem displays a single feeding event in the timeline
 * Shows feeding type, amount, EC/pH levels, and timestamp
 */
export function FeedingEventItem({ event, onEdit, onDelete }: FeedingEventItemProps) {
  const getFeedingIcon = (type: FeedingEvent['feedingType']) => {
    switch (type) {
      case 'watering':
        return <Droplets className="h-5 w-5 text-blue-600" />;
      case 'foliar':
        return <Leaf className="h-5 w-5 text-green-600" />;
      case 'nutrients':
        return <Beaker className="h-5 w-5 text-purple-600" />;
      default:
        return <Droplets className="h-5 w-5 text-gray-600" />;
    }
  };

  const getFeedingBadgeColor = (
    type: FeedingEvent['feedingType']
  ): 'default' | 'secondary' | 'success' | 'info' => {
    switch (type) {
      case 'watering':
        return 'info';
      case 'foliar':
        return 'success';
      case 'nutrients':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return 'Date unavailable';
    }
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="pt-4 pb-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">{getFeedingIcon(event.feedingType)}</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getFeedingBadgeColor(event.feedingType)} className="capitalize">
                    {event.feedingType}
                  </Badge>
                  <span className="text-sm font-medium">{event.amountMl} ml</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(event.fedAt)}
                </time>
                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(event)}
                        aria-label="Edit feeding event"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(event)}
                        aria-label="Delete feeding event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* EC and pH levels */}
            {(event.ecLevel !== null && event.ecLevel !== undefined) ||
            (event.phLevel !== null && event.phLevel !== undefined) ? (
              <div className="flex gap-4 text-sm">
                {event.ecLevel !== null && event.ecLevel !== undefined && (
                  <span className="text-muted-foreground">
                    EC: <span className="font-medium text-foreground">{event.ecLevel}</span>
                  </span>
                )}
                {event.phLevel !== null && event.phLevel !== undefined && (
                  <span className="text-muted-foreground">
                    pH: <span className="font-medium text-foreground">{event.phLevel}</span>
                  </span>
                )}
              </div>
            ) : null}

            {/* Nutrient mix */}
            {event.nutrientMix && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Mix:</span> {event.nutrientMix}
              </p>
            )}

            {/* Amendments */}
            {event.amendments && event.amendments.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Soil Amendments:</p>
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {event.amendments.map((amendment, index) => (
                    <li key={index} className="flex items-baseline gap-1">
                      <span className="text-foreground/70">•</span>
                      <span>
                        {amendment.amount} {amendment.unit} of {amendment.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {event.notes && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}