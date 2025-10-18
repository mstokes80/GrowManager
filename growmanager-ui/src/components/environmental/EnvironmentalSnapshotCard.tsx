import { EnvironmentalSnapshot } from '@/types/environmentalSnapshot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, Droplets, Wind, Sun, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface EnvironmentalSnapshotCardProps {
  snapshot: EnvironmentalSnapshot;
  onDelete?: (id: string) => void;
}

/**
 * EnvironmentalSnapshotCard - Displays an environmental snapshot
 * Shows temperature, humidity, CO2, light intensity, and VPD measurements
 */
export function EnvironmentalSnapshotCard({
  snapshot,
  onDelete,
}: EnvironmentalSnapshotCardProps) {
  const formatTimestamp = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getSourceBadgeVariant = (source: string): 'default' | 'secondary' | 'outline' => {
    switch (source) {
      case 'MANUAL':
        return 'default';
      case 'SENSOR':
        return 'secondary';
      case 'INTEGRATION':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{formatTimestamp(snapshot.timestamp)}</CardTitle>
            <Badge variant={getSourceBadgeVariant(snapshot.source)} className="mt-2 text-xs">
              {snapshot.source}
            </Badge>
          </div>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(snapshot.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Environmental Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Temperature */}
          {snapshot.temperature !== null && snapshot.temperature !== undefined && (
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <div className="text-sm">
                <p className="text-muted-foreground">Temp</p>
                <p className="font-medium">{snapshot.temperature}°C</p>
              </div>
            </div>
          )}

          {/* Humidity */}
          {snapshot.humidity !== null && snapshot.humidity !== undefined && (
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <p className="text-muted-foreground">Humidity</p>
                <p className="font-medium">{snapshot.humidity}%</p>
              </div>
            </div>
          )}

          {/* CO2 */}
          {snapshot.co2 !== null && snapshot.co2 !== undefined && (
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <div className="text-sm">
                <p className="text-muted-foreground">CO₂</p>
                <p className="font-medium">{snapshot.co2} ppm</p>
              </div>
            </div>
          )}

          {/* Light Intensity */}
          {snapshot.lightIntensity !== null && snapshot.lightIntensity !== undefined && (
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <div className="text-sm">
                <p className="text-muted-foreground">Light</p>
                <p className="font-medium">{snapshot.lightIntensity} PPFD</p>
              </div>
            </div>
          )}
        </div>

        {/* VPD (if calculated) */}
        {snapshot.vpd !== null && snapshot.vpd !== undefined && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Vapor Pressure Deficit</p>
            <p className="text-sm font-medium">{snapshot.vpd} kPa</p>
          </div>
        )}

        {/* Notes */}
        {snapshot.notes && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm whitespace-pre-wrap">{snapshot.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}