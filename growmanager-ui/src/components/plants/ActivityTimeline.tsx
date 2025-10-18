import { useMemo, useState } from 'react';
import { FeedingEvent } from '@/types/feedingEvent';
import { ActivityLog } from '@/types/activityLog';
import { FeedingEventItem } from './FeedingEventItem';
import { ActivityLogItem } from './ActivityLogItem';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface ActivityTimelineProps {
  feedingEvents: FeedingEvent[];
  activityLogs: ActivityLog[];
  isLoading?: boolean;
}

type TimelineItem =
  | { type: 'feeding'; data: FeedingEvent; timestamp: Date }
  | { type: 'activity'; data: ActivityLog; timestamp: Date };

/**
 * ActivityTimeline displays feeding events and activity logs in chronological order
 * Groups by date with newest first
 * Implements Task Group 6.4.4
 */
export function ActivityTimeline({
  feedingEvents,
  activityLogs,
  isLoading = false,
}: ActivityTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(20);

  // Combine and sort all timeline items
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [
      ...feedingEvents.map(event => ({
        type: 'feeding' as const,
        data: event,
        timestamp: new Date(event.fedAt),
      })),
      ...activityLogs.map(log => ({
        type: 'activity' as const,
        data: log,
        timestamp: new Date(log.loggedAt),
      })),
    ];

    // Sort by timestamp, newest first
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [feedingEvents, activityLogs]);

  // Group items by date
  const groupedItems = useMemo(() => {
    const groups: { date: Date; items: TimelineItem[] }[] = [];

    timelineItems.slice(0, visibleCount).forEach(item => {
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && isSameDay(lastGroup.date, item.timestamp)) {
        lastGroup.items.push(item);
      } else {
        groups.push({
          date: item.timestamp,
          items: [item],
        });
      }
    });

    return groups;
  }, [timelineItems, visibleCount]);

  const hasMore = visibleCount < timelineItems.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 20);
  };

  const formatDateHeader = (date: Date) => {
    try {
      return format(date, 'EEEE, MMMM dd, yyyy');
    } catch (error) {
      return 'Date unavailable';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (timelineItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="rounded-full bg-muted p-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No activity yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Track feeding events and maintenance activities to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedItems.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {formatDateHeader(group.date)}
            </h3>
            <Separator className="flex-1" />
          </div>

          {/* Items for this date */}
          <div className="space-y-3">
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                {item.type === 'feeding' ? (
                  <FeedingEventItem event={item.data} />
                ) : (
                  <ActivityLogItem log={item.data} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={handleLoadMore}>
            Load More ({timelineItems.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {/* Timeline End */}
      {!hasMore && timelineItems.length > 0 && (
        <div className="flex justify-center pt-4">
          <p className="text-sm text-muted-foreground">
            End of timeline ({timelineItems.length} total events)
          </p>
        </div>
      )}
    </div>
  );
}