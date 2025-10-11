import { Plant } from '@/types/plant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, AlertTriangle, Activity, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
}

/**
 * PlantCard displays a plant in a card format
 * Shows plant tag, cultivar, stage, health status, and planted date
 */
export function PlantCard({ plant, onClick }: PlantCardProps) {
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
  ): 'default' | 'success' | 'warning' | 'destructive' => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'stressed':
        return 'warning';
      case 'sick':
        return 'destructive';
      case 'dead':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getHealthIcon = (status: Plant['healthStatus']) => {
    switch (status) {
      case 'healthy':
        return <Heart className="h-4 w-4" />;
      case 'stressed':
        return <AlertTriangle className="h-4 w-4" />;
      case 'sick':
        return <Activity className="h-4 w-4" />;
      case 'dead':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatPlantedDate = (dateString: string) => {
    try {
      return `Planted ${format(new Date(dateString), 'MMM dd, yyyy')}`;
    } catch (error) {
      return 'Date unavailable';
    }
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
        </div>
      </CardContent>
    </Card>
  );
}