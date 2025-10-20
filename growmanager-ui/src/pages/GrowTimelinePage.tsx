import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useTimelineEvents } from '@/services/analyticsApi';
import { useGrow } from '@/services/growsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  Calendar as CalendarIcon,
  Printer,
  Droplets,
  Scissors,
  Sprout,
  Camera,
  Pill,
  TrendingUp,
  Move,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TimeRangeSelector, TimeRange } from '@/components/analytics/filters/TimeRangeSelector';
import { formatChartDate } from '@/utils/chartUtils';
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns';
import type { TimelineEvent } from '@/types/analytics';

/**
 * GrowTimelinePage - Visualize all events in a grow chronologically
 * Shows feeding, watering, training, observations, and milestones
 */
export default function GrowTimelinePage() {
  const { growId } = useParams<{ growId: string }>();

  // Time range state (default to last 30 days)
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
    label: 'Last 30 days',
  });

  // Event type filters
  const [visibleEventTypes, setVisibleEventTypes] = useState({
    feeding: true,
    watering: true,
    training: true,
    pruning: true,
    observation: true,
    transplant: true,
    harvest: true,
    defoliation: true,
  });

  // Selected event for detail modal
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // View mode: timeline or calendar
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');

  // Calendar month state
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Fetch grow data
  const { data: grow } = useGrow(growId || '');

  // Memoize enabled event types to prevent unnecessary re-renders
  const enabledEventTypes = useMemo(() => {
    return Object.entries(visibleEventTypes)
      .filter(([_, visible]) => visible)
      .map(([type, _]) => type);
  }, [visibleEventTypes]);

  // Memoize timeline request params
  const timelineParams = useMemo(
    () => ({
      growId,
      startDate: format(timeRange.from, 'yyyy-MM-dd'),
      endDate: format(timeRange.to, 'yyyy-MM-dd'),
      eventTypes: enabledEventTypes,
    }),
    [growId, timeRange.from, timeRange.to, enabledEventTypes]
  );

  // Fetch timeline events
  const {
    data: timelineData,
    isLoading,
    isError,
    error,
  } = useTimelineEvents(timelineParams);

  // Toggle event type visibility
  const toggleEventType = (type: keyof typeof visibleEventTypes) => {
    setVisibleEventTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Events are already filtered by the backend based on enabledEventTypes
  const filteredEvents = useMemo(() => {
    return timelineData?.events || [];
  }, [timelineData?.events]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, TimelineEvent[]>();

    filteredEvents.forEach((event) => {
      const dateKey = format(parseISO(event.timestamp), 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, event]);
    });

    // Sort events within each day by timestamp
    grouped.forEach((events) => {
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });

    return grouped;
  }, [filteredEvents]);

  // Get event icon and color
  const getEventIcon = (type: TimelineEvent['eventType']) => {
    const iconMap: Record<TimelineEvent['eventType'], { icon: JSX.Element; color: string }> = {
      feeding: { icon: <Pill className="h-4 w-4" />, color: 'bg-green-500' },
      watering: { icon: <Droplets className="h-4 w-4" />, color: 'bg-blue-500' },
      training: { icon: <Move className="h-4 w-4" />, color: 'bg-orange-500' },
      pruning: { icon: <Scissors className="h-4 w-4" />, color: 'bg-red-500' },
      observation: { icon: <Camera className="h-4 w-4" />, color: 'bg-purple-500' },
      transplant: { icon: <Sprout className="h-4 w-4" />, color: 'bg-yellow-500' },
      harvest: { icon: <Scissors className="h-4 w-4" />, color: 'bg-amber-600' },
      defoliation: { icon: <Scissors className="h-4 w-4" />, color: 'bg-red-400' },
    };

    return iconMap[type] || { icon: <CalendarIcon className="h-4 w-4" />, color: 'bg-gray-500' };
  };

  // Export timeline
  const handleExport = () => {
    window.print();
  };

  // Photo timeline data
  const photoTimeline = useMemo(() => {
    if (!timelineData?.photos) return [];
    return timelineData.photos.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [timelineData?.photos]);

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add empty days at start to align with week start (Sunday = 0)
    const startDay = getDay(monthStart);
    const emptyDays = Array(startDay).fill(null);

    return [...emptyDays, ...days];
  }, [calendarMonth]);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <PageHeader
        title={`Timeline: ${grow?.name || 'Grow'}`}
        subtitle="Chronological view of all activities and milestones"
        actions={
          <div className="flex gap-2">
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
              showCustom={true}
            />
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Loading timeline data"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading timeline data: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {!isLoading && !isError && timelineData && (
          <div className="space-y-6">
            {/* Event Type Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Filters</CardTitle>
                <CardDescription>Toggle which event types to display</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(visibleEventTypes).map(([type, visible]) => {
                    const { icon, color } = getEventIcon(type as TimelineEvent['eventType']);
                    return (
                      <div key={type} className="flex items-center gap-2">
                        <Checkbox
                          id={`${type}-toggle`}
                          checked={visible}
                          onChange={() => toggleEventType(type as keyof typeof visibleEventTypes)}
                        />
                        <Label htmlFor={`${type}-toggle`} className="cursor-pointer flex items-center gap-2">
                          <div className={`${color} text-white p-1 rounded`}>
                            {icon}
                          </div>
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* View Mode Toggle */}
            <div className="flex justify-center gap-2">
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                onClick={() => setViewMode('timeline')}
              >
                Timeline View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
              >
                Calendar View
              </Button>
            </div>

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>
                    {filteredEvents.length} events in selected date range
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No events found for selected filters and date range
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Array.from(eventsByDate.entries())
                        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                        .map(([date, events]) => (
                          <div key={date} className="relative">
                            {/* Date Header */}
                            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CalendarIcon className="h-6 w-6 text-primary" />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium">{formatChartDate(date, 'EEEE, MMMM d, yyyy')}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {events.length} {events.length === 1 ? 'event' : 'events'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Events for this date */}
                            <div className="ml-6 pl-6 border-l-2 border-border space-y-4">
                              {events.map((event) => {
                                const { icon, color } = getEventIcon(event.eventType);
                                const photoUrls = event.details.photoUrls || [];
                                return (
                                  <button
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="w-full text-left p-4 rounded-lg border hover:border-primary hover:shadow-md transition-all"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={`${color} text-white p-2 rounded-lg flex-shrink-0`}>
                                        {icon}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium capitalize">{event.eventType.replace('_', ' ')}</span>
                                          <Badge variant="outline" className="capitalize">
                                            {event.eventType.replace('_', ' ')}
                                          </Badge>
                                          {event.plantTag && (
                                            <Badge variant="secondary" className="text-xs">
                                              {event.plantTag}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          {event.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                          <span>{format(parseISO(event.timestamp), 'h:mm a')}</span>
                                          {photoUrls.length > 0 && (
                                            <span className="flex items-center gap-1">
                                              <ImageIcon className="h-3 w-3" />
                                              {photoUrls.length} {photoUrls.length === 1 ? 'photo' : 'photos'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Calendar View</CardTitle>
                      <CardDescription>
                        {format(calendarMonth, 'MMMM yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarMonth(new Date())}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="space-y-2">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div
                          key={day}
                          className="text-center text-sm font-medium text-muted-foreground py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="aspect-square" />;
                        }

                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayEvents = eventsByDate.get(dateKey) || [];
                        const isCurrentMonth = isSameMonth(day, calendarMonth);
                        const isTodayDate = isToday(day);

                        return (
                          <div
                            key={dateKey}
                            className={`aspect-square border rounded-lg p-1 ${
                              !isCurrentMonth ? 'opacity-40' : ''
                            } ${isTodayDate ? 'border-primary bg-primary/5' : 'border-border'}`}
                          >
                            <div className="h-full flex flex-col">
                              <div
                                className={`text-xs font-medium text-center mb-1 ${
                                  isTodayDate ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                {format(day, 'd')}
                              </div>
                              <div className="flex-1 overflow-y-auto space-y-0.5">
                                {dayEvents.slice(0, 3).map((event) => {
                                  const { color } = getEventIcon(event.eventType);
                                  return (
                                    <button
                                      key={event.id}
                                      onClick={() => setSelectedEvent(event)}
                                      className={`w-full text-left px-1 py-0.5 rounded text-xs ${color} text-white truncate hover:opacity-80 transition-opacity`}
                                      title={`${event.eventType}: ${event.description}`}
                                    >
                                      {event.eventType}
                                    </button>
                                  );
                                })}
                                {dayEvents.length > 3 && (
                                  <div className="text-xs text-muted-foreground text-center">
                                    +{dayEvents.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected day events list (if applicable) */}
                  {filteredEvents.length === 0 && (
                    <div className="mt-6 text-center py-8 text-muted-foreground">
                      No events found for selected filters in this month
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Milestones */}
            {timelineData.milestones && timelineData.milestones.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Growth Milestones</CardTitle>
                  <CardDescription>Key stage transitions and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timelineData.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium capitalize">
                              {milestone.type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatChartDate(milestone.date, 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        {milestone.plantTag && (
                          <Badge variant="secondary" className="text-xs">
                            {milestone.plantTag}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Photo Timeline */}
            {photoTimeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photo Timeline
                  </CardTitle>
                  <CardDescription>
                    Chronological gallery of observation photos ({photoTimeline.length} photos)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photoTimeline.map((photo, idx) => (
                      <div
                        key={`${photo.plantId}-${photo.timestamp}-${idx}`}
                        className="group relative aspect-square rounded-lg overflow-hidden border hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <img
                          src={photo.photoUrl}
                          alt={`${photo.plantTag} - ${photo.plantStage}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <div className="text-sm font-medium">{photo.plantTag}</div>
                            <div className="text-xs opacity-90">
                              {formatChartDate(photo.timestamp, 'MMM d, yyyy')}
                            </div>
                            <Badge variant="secondary" className="text-xs mt-1 capitalize">
                              {photo.plantStage}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${getEventIcon(selectedEvent.eventType).color} text-white p-3 rounded-lg`}>
                    {getEventIcon(selectedEvent.eventType).icon}
                  </div>
                  <div>
                    <DialogTitle className="capitalize">{selectedEvent.eventType.replace('_', ' ')}</DialogTitle>
                    <DialogDescription>
                      {format(parseISO(selectedEvent.timestamp), 'EEEE, MMMM d, yyyy • h:mm a')}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.description}</p>
                </div>

                {selectedEvent.plantTag && (
                  <div>
                    <Label>Plant</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{selectedEvent.plantTag}</Badge>
                    </div>
                  </div>
                )}

                {selectedEvent.details && Object.keys(selectedEvent.details).filter(k => selectedEvent.details[k as keyof typeof selectedEvent.details] != null).length > 0 && (
                  <div>
                    <Label>Additional Details</Label>
                    <div className="mt-2 space-y-2">
                      {Object.entries(selectedEvent.details)
                        .filter(([_, value]) => value != null && (Array.isArray(value) ? value.length > 0 : true))
                        .filter(([key]) => key !== 'photoUrls')
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center p-2 rounded bg-muted/50">
                            <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-sm font-medium">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedEvent.details.photoUrls && selectedEvent.details.photoUrls.length > 0 && (
                  <div>
                    <Label>Photos</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {selectedEvent.details.photoUrls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`${selectedEvent.eventType} - Photo ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}