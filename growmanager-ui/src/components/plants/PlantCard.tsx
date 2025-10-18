import { Plant } from '@/types/plant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, AlertTriangle, Activity, Heart, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
  onCopy?: (plant: Plant) => void;
}

/**
 * PlantCard displays a plant in a card format
 * Shows plant tag, cultivar, stage, health status, and planted date
 */
export function PlantCard({ plant, onClick, onCopy }: PlantCardProps) {
  const getStageColor = (
    stage: Plant['stage']
  ): 'default' | 'secondary' | 'success' | 'warning' | 'info' => {
    switch (stage) {
      case 'seedling':
        return 'warning';
      case 'vegetative':
        return 'success';
      case 'flowering':
        return 'info';
      case 'harvested':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getHealthStatusColor = (
    status: Plant['healthStatus']
  ): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'harvested':
        return 'secondary';
      case 'removed':
        return 'warning';
      case 'dead':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getHealthIcon = (status: Plant['healthStatus']) => {
    switch (status) {
      case 'active':
        return <Heart className="h-4 w-4" />;
      case 'harvested':
        return <Activity className="h-4 w-4" />;
      case 'removed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'dead':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatPlantedDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (date) {
      return `Planted ${format(date, 'MMM dd, yyyy')}`;
    }
    return 'Date unavailable';
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Leaf className="h-5 w-5 text-green-600 flex-shrink-0" />
            <CardTitle className="text-lg truncate">{plant.plantTag}</CardTitle>
          </div>
          <Badge variant={getStageColor(plant.stage)} className="flex-shrink-0 capitalize">
            {plant.stage}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {plant.cultivarName && (
            <p className="text-sm font-medium text-muted-foreground">{plant.cultivarName}</p>
          )}
          <div className="flex items-center gap-2">
            <Badge
              variant={getHealthStatusColor(plant.healthStatus)}
              className="flex items-center gap-1 capitalize"
            >
              {getHealthIcon(plant.healthStatus)}
              {plant.healthStatus}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{formatPlantedDate(plant.plantedDate)}</p>

          {onCopy && (
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(plant);
                }}
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy Plant
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}