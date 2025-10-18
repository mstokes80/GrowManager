import { Grow } from '@/services/growsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';

interface GrowCardProps {
  grow: Grow;
  onClick?: () => void;
}

/**
 * GrowCard displays a grow in a card format
 * Shows name, status badge, start date, plant count, and last update
 */
export function GrowCard({ grow, onClick }: GrowCardProps) {
  const getStatusColor = (
    status: Grow['status']
  ): 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' => {
    switch (status) {
      case 'planning':
        return 'secondary';
      case 'active':
        return 'success';
      case 'flowering':
        return 'info';
      case 'drying':
        return 'warning';
      case 'completed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatStartDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (date) {
      return `Started ${format(date, 'MMM dd, yyyy')}`;
    }
    return 'Date unavailable';
  };

  const formatUpdatedAt = (dateString: string) => {
    try {
      return `Updated ${formatDistanceToNow(new Date(dateString), { addSuffix: true })}`;
    } catch (error) {
      return 'Recently updated';
    }
  };

  const plantCount = grow.plantCount || 0;
  const plantCountText = plantCount === 0 ? 'No plants yet' : `${plantCount} ${plantCount === 1 ? 'plant' : 'plants'}`;

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
            <Sprout className="h-5 w-5 text-green-600 flex-shrink-0" />
            <CardTitle className="text-lg truncate">{grow.name}</CardTitle>
          </div>
          <Badge variant={getStatusColor(grow.status)} className="flex-shrink-0 capitalize">
            {grow.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{formatStartDate(grow.startDate)}</p>
          <p className="text-sm font-medium">{plantCountText}</p>
          <p className="text-xs text-muted-foreground">{formatUpdatedAt(grow.updatedAt)}</p>
        </div>
      </CardContent>
    </Card>
  );
}