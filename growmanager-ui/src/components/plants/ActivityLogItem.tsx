import { ActivityLog } from '@/types/activityLog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scissors, Sprout, Leaf, Move, Bug, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLogItemProps {
  log: ActivityLog;
}

/**
 * ActivityLogItem displays a single activity log in the timeline
 * Shows activity type, description, and timestamp
 */
export function ActivityLogItem({ log }: ActivityLogItemProps) {
  const getActivityIcon = (type: ActivityLog['activityType']) => {
    switch (type) {
      case 'training':
        return <Sprout className="h-5 w-5 text-green-600" />;
      case 'pruning':
        return <Scissors className="h-5 w-5 text-orange-600" />;
      case 'defoliation':
        return <Leaf className="h-5 w-5 text-yellow-600" />;
      case 'transplant':
        return <Move className="h-5 w-5 text-blue-600" />;
      case 'pest_control':
        return <Bug className="h-5 w-5 text-red-600" />;
      case 'other':
        return <MoreHorizontal className="h-5 w-5 text-gray-600" />;
      default:
        return <MoreHorizontal className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityBadgeColor = (
    type: ActivityLog['activityType']
  ): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
    switch (type) {
      case 'training':
        return 'success';
      case 'pruning':
        return 'warning';
      case 'defoliation':
        return 'warning';
      case 'transplant':
        return 'secondary';
      case 'pest_control':
        return 'destructive';
      case 'other':
        return 'default';
      default:
        return 'default';
    }
  };

  const getActivityLabel = (type: ActivityLog['activityType']) => {
    switch (type) {
      case 'pest_control':
        return 'Pest Control';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
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
          <div className="flex-shrink-0 mt-1">{getActivityIcon(log.activityType)}</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Badge variant={getActivityBadgeColor(log.activityType)} className="mb-2">
                  {getActivityLabel(log.activityType)}
                </Badge>
                <p className="text-sm font-medium">{log.description}</p>
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatTimestamp(log.loggedAt)}
              </time>
            </div>

            {/* Notes */}
            {log.notes && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{log.notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}