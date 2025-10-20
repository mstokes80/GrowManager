import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useFeedingAnalytics } from '@/services/analyticsApi';
import { useGrows } from '@/services/growsApi';
import { ChartWrapper } from '@/components/analytics/charts/ChartWrapper';
import { MetricCard } from '@/components/analytics/metrics/MetricCard';
import { TimeRangeSelector, TimeRange } from '@/components/analytics/filters/TimeRangeSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from 'recharts';
import {
  Droplet,
  Beaker,
  TrendingUp,
  Loader2,
  AlertCircle,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  formatChartDate,
  formatEC,
  formatPH,
  formatNumber,
  CHART_COLORS,
} from '@/utils/chartUtils';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

/**
 * FeedingAnalyticsPage - Visualizes feeding events, pH/EC trends, and efficiency metrics
 * Shows nutrient input, feeding schedule, and performance metrics
 */
export default function FeedingAnalyticsPage() {
  const { growId } = useParams<{ growId: string }>();
  const navigate = useNavigate();

  // Fetch user's grows for selection
  const { data: grows, isLoading: growsLoading } = useGrows();

  // Auto-select first grow if no growId in URL
  useEffect(() => {
    if (!growId && grows && grows.length > 0 && grows[0]) {
      navigate(`/analytics/feeding/${grows[0].id}`, { replace: true });
    }
  }, [growId, grows, navigate]);

  // Time range state (default to last 30 days)
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
    label: 'Last 30 days',
  });

  // Parameter visibility toggles
  const [visibleParams, setVisibleParams] = useState({
    ph: true,
    ec: true,
    schedule: true,
  });

  // Fetch feeding analytics data (only when growId is present)
  const { data, isLoading, isError, error } = useFeedingAnalytics(
    {
      growId,
      startDate: format(timeRange.from, 'yyyy-MM-dd'),
      endDate: format(timeRange.to, 'yyyy-MM-dd'),
    },
    { enabled: !!growId }
  );

  // Toggle parameter visibility
  const toggleParameter = (param: keyof typeof visibleParams) => {
    setVisibleParams((prev) => ({ ...prev, [param]: !prev[param] }));
  };

  // Format feeding events for timeline chart with all event details
  const feedingTimelineData = useMemo(() => {
    if (!data?.feedingTimeline) return [];

    return data.feedingTimeline.map((event) => ({
      timestamp: event.timestamp,
      date: formatChartDate(event.timestamp),
      waterVolume: event.waterVolume,
      feedingType: event.feedingType,
      ec: event.ec ?? undefined,
      ph: event.ph ?? undefined,
      plantTag: event.plantTag,
      nutrients: event.nutrients.join(', ') || 'None',
      // Separate volume by feeding type for stacked bars
      nutrientsVolume: event.feedingType === 'nutrients' ? event.waterVolume : 0,
      wateringVolume: event.feedingType === 'watering' ? event.waterVolume : 0,
      supplementVolume: event.feedingType === 'supplement' ? event.waterVolume : 0,
      flushVolume: event.feedingType === 'flush' ? event.waterVolume : 0,
    }));
  }, [data?.feedingTimeline]);

  // Format pH/EC trend data from individual feeding events
  const phEcTrendData = useMemo(() => {
    if (!data?.feedingTimeline) return [];

    return data.feedingTimeline
      .filter((event) => event.ph !== null || event.ec !== null)
      .map((event) => ({
        timestamp: event.timestamp,
        date: formatChartDate(event.timestamp),
        ph: event.ph ?? undefined,
        ec: event.ec ?? undefined,
        feedingType: event.feedingType,
        plantTag: event.plantTag,
        waterVolume: event.waterVolume,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [data?.feedingTimeline]);

  // Custom tooltip component for pH/EC trend charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  // Enhanced tooltip for feeding timeline showing all event details
  const FeedingTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-sm font-semibold mb-2 border-b pb-1">{data.date}</p>

        <div className="space-y-1.5 text-xs">
          {data.plantTag && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Plant:</span>
              <span className="font-medium">{data.plantTag}</span>
            </div>
          )}

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium capitalize">{data.feedingType}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-medium">{data.waterVolume.toFixed(0)} mL</span>
          </div>

          {data.ec !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">EC:</span>
              <span className="font-medium">{data.ec.toFixed(2)} mS/cm</span>
            </div>
          )}

          {data.ph !== undefined && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">pH:</span>
              <span className="font-medium">{data.ph.toFixed(2)}</span>
            </div>
          )}

          {data.nutrients && data.nutrients !== 'None' && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-muted-foreground mb-1">Nutrients:</p>
              <p className="font-medium text-xs">{data.nutrients}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Feeding Analytics"
        subtitle={growId ? "Analyze feeding schedule, pH, EC, and nutrient efficiency" : "Select a grow to view feeding analytics"}
        actions={
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            showCustom={true}
          />
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Grow Selector */}
        {!growsLoading && grows && grows.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Grow</CardTitle>
              <CardDescription>Choose a grow to analyze feeding data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Label htmlFor="grow-select" className="text-sm font-medium whitespace-nowrap">
                  Grow:
                </Label>
                <Select
                  value={growId || ''}
                  onValueChange={(value) => navigate(`/analytics/feeding/${value}`)}
                >
                  <SelectTrigger id="grow-select" className="w-full max-w-md">
                    <SelectValue placeholder="Select a grow..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grows.map((grow) => (
                      <SelectItem key={grow.id} value={grow.id}>
                        {grow.name} ({grow.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Loading feeding data"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading feeding data: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* No Grows Available */}
        {!growsLoading && grows && grows.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No grows found. Create a grow first to track feeding analytics.
            </AlertDescription>
          </Alert>
        )}

        {/* No Grow Selected (shouldn't happen due to auto-select) */}
        {!growId && !growsLoading && grows && grows.length > 0 && !isLoading && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a grow above</h3>
            <p className="text-sm text-muted-foreground">
              Choose a grow from the dropdown to view feeding analytics
            </p>
          </div>
        )}

        {/* Empty State */}
        {growId && !isLoading && !isError && feedingTimelineData.length === 0 && (
          <div className="text-center py-12">
            <Droplet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No feeding data available</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking feeding events to see analytics here
            </p>
          </div>
        )}

        {/* Main Content */}
        {growId && !isLoading && !isError && data && feedingTimelineData.length > 0 && (
          <div className="space-y-6">
            {/* Parameter Toggles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visible Parameters</CardTitle>
                <CardDescription>Toggle which feeding parameters to display</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ph-toggle"
                      checked={visibleParams.ph}
                      onChange={() => toggleParameter('ph')}
                    />
                    <Label htmlFor="ph-toggle" className="cursor-pointer">
                      pH Level
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ec-toggle"
                      checked={visibleParams.ec}
                      onChange={() => toggleParameter('ec')}
                    />
                    <Label htmlFor="ec-toggle" className="cursor-pointer">
                      EC Level
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="schedule-toggle"
                      checked={visibleParams.schedule}
                      onChange={() => toggleParameter('schedule')}
                    />
                    <Label htmlFor="schedule-toggle" className="cursor-pointer">
                      Feeding Schedule
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrient Metrics Cards - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Water Volume */}
              <MetricCard
                title="Total Water Used"
                value={`${formatNumber(data.nutrientMetrics.totalWaterVolume / 1000)} L`}
                description={`${data.nutrientMetrics.feedingEventCount} feeding events`}
                icon={<Beaker className="h-4 w-4" />}
                variant="info"
              />

              {/* Average pH */}
              <MetricCard
                title="Average pH"
                value={formatPH(data.nutrientMetrics.avgPh)}
                description={`Veg: ${formatPH(data.nutrientMetrics.vegetativeAvg?.avgPh || 0)} | Flower: ${formatPH(data.nutrientMetrics.floweringAvg?.avgPh || 0)}`}
                icon={<Droplet className="h-4 w-4" />}
                variant={
                  data.nutrientMetrics.avgPh >= 5.5 && data.nutrientMetrics.avgPh <= 6.5
                    ? 'success'
                    : 'warning'
                }
              />

              {/* Average EC */}
              <MetricCard
                title="Average EC"
                value={formatEC(data.nutrientMetrics.avgEc)}
                description={`Veg: ${formatEC(data.nutrientMetrics.vegetativeAvg?.avgEc || 0)} | Flower: ${formatEC(data.nutrientMetrics.floweringAvg?.avgEc || 0)}`}
                icon={<TrendingUp className="h-4 w-4" />}
                variant={
                  data.nutrientMetrics.avgEc >= 1.0 && data.nutrientMetrics.avgEc <= 2.5
                    ? 'success'
                    : 'warning'
                }
              />

              {/* Total EC */}
              <MetricCard
                title="Total EC"
                value={formatEC(data.nutrientMetrics.totalEc)}
                description="Cumulative EC across all feedings"
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>

            {/* Nutrient Metrics Cards - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Average Water Volume per Feeding */}
              <MetricCard
                title="Avg Water/Feeding"
                value={`${formatNumber(data.nutrientMetrics.totalWaterVolume / data.nutrientMetrics.feedingEventCount)} mL`}
                description={`Veg: ${formatNumber(data.nutrientMetrics.vegetativeAvg?.avgWaterVolume || 0)} mL | Flower: ${formatNumber(data.nutrientMetrics.floweringAvg?.avgWaterVolume || 0)} mL`}
                icon={<Droplet className="h-4 w-4" />}
                variant="info"
              />

              {/* Feeding Event Counts by Stage */}
              <MetricCard
                title="Events by Stage"
                value={`${data.nutrientMetrics.feedingEventCount} total`}
                description={`Veg: ${data.nutrientMetrics.vegetativeAvg?.eventCount || 0} | Flower: ${data.nutrientMetrics.floweringAvg?.eventCount || 0}`}
                icon={<Calendar className="h-4 w-4" />}
                variant="info"
              />

              {/* pH Variance by Stage */}
              <MetricCard
                title="pH Range"
                value={formatPH(data.nutrientMetrics.avgPh)}
                description="Overall average pH level"
                icon={<Droplet className="h-4 w-4" />}
                variant={
                  data.nutrientMetrics.avgPh >= 5.5 && data.nutrientMetrics.avgPh <= 6.5
                    ? 'success'
                    : 'warning'
                }
              />

              {/* EC Range */}
              <MetricCard
                title="EC Range"
                value={formatEC(data.nutrientMetrics.avgEc)}
                description="Overall average EC level"
                icon={<TrendingUp className="h-4 w-4" />}
                variant={
                  data.nutrientMetrics.avgEc >= 1.0 && data.nutrientMetrics.avgEc <= 2.5
                    ? 'success'
                    : 'warning'
                }
              />
            </div>

            {/* Efficiency Metrics (if available) */}
            {data.efficiencyMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.efficiencyMetrics.totalYield !== null && data.efficiencyMetrics.totalYield !== undefined && (
                  <MetricCard
                    title="Total Yield"
                    value={`${formatNumber(data.efficiencyMetrics.totalYield)} g`}
                    description="Total harvested from all plants"
                    icon={<Beaker className="h-4 w-4" />}
                    variant="success"
                  />
                )}

                {data.efficiencyMetrics.feedEfficiency && (
                  <MetricCard
                    title="Feed Efficiency"
                    value={`${formatNumber(data.efficiencyMetrics.feedEfficiency)} ${data.efficiencyMetrics.feedEfficiencyUnit || 'g/EC'}`}
                    description="Yield per unit of nutrients"
                    icon={<TrendingUp className="h-4 w-4" />}
                    variant="success"
                  />
                )}

                {data.efficiencyMetrics.waterUseEfficiency && (
                  <MetricCard
                    title="Water Use Efficiency"
                    value={`${formatNumber(data.efficiencyMetrics.waterUseEfficiency)} ${data.efficiencyMetrics.waterEfficiencyUnit || 'g/L'}`}
                    description="Yield per liter of water"
                    icon={<Droplet className="h-4 w-4" />}
                    variant="success"
                  />
                )}
              </div>
            )}

            {/* Feeding Schedule Timeline - Enhanced */}
            {visibleParams.schedule && (
              <ChartWrapper
                title="Feeding Schedule Timeline"
                description="Feeding events by type with pH/EC levels. Hover over events for detailed information."
                data={feedingTimelineData}
                exportFilename="feeding-schedule.csv"
                height={400}
              >
                <ComposedChart data={feedingTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Volume (mL)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 10]}
                    label={{ value: 'pH / EC', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<FeedingTooltip />} />
                  <Legend />

                  {/* Stacked bars for different feeding types */}
                  <Bar
                    yAxisId="left"
                    dataKey="nutrientsVolume"
                    stackId="a"
                    name="Nutrients"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="wateringVolume"
                    stackId="a"
                    name="Watering"
                    fill="#3b82f6"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="supplementVolume"
                    stackId="a"
                    name="Supplement"
                    fill="#a855f7"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="flushVolume"
                    stackId="a"
                    name="Flush"
                    fill="#f59e0b"
                  />

                  {/* pH and EC lines */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ph"
                    name="pH"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ec"
                    name="EC (mS/cm)"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                </ComposedChart>
              </ChartWrapper>
            )}

            {/* Stage-Based Comparison */}
            {(data.nutrientMetrics.vegetativeAvg || data.nutrientMetrics.floweringAvg) && (
              <Card>
                <CardHeader>
                  <CardTitle>Stage Comparison</CardTitle>
                  <CardDescription>
                    Feeding metrics during vegetative vs flowering stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vegetative Stage */}
                    {data.nutrientMetrics.vegetativeAvg && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="capitalize">
                            Vegetative
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({data.nutrientMetrics.vegetativeAvg.eventCount} events)
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Average EC</span>
                            <span className="font-medium">{formatEC(data.nutrientMetrics.vegetativeAvg.avgEc)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Average pH</span>
                            <span className="font-medium">{formatPH(data.nutrientMetrics.vegetativeAvg.avgPh)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Avg Water/Feeding</span>
                            <span className="font-medium">{formatNumber(data.nutrientMetrics.vegetativeAvg.avgWaterVolume)} mL</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Flowering Stage */}
                    {data.nutrientMetrics.floweringAvg && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="info" className="capitalize">
                            Flowering
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({data.nutrientMetrics.floweringAvg.eventCount} events)
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Average EC</span>
                            <span className="font-medium">{formatEC(data.nutrientMetrics.floweringAvg.avgEc)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Average pH</span>
                            <span className="font-medium">{formatPH(data.nutrientMetrics.floweringAvg.avgPh)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Avg Water/Feeding</span>
                            <span className="font-medium">{formatNumber(data.nutrientMetrics.floweringAvg.avgWaterVolume)} mL</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Highlight significant differences */}
                  {data.nutrientMetrics.vegetativeAvg && data.nutrientMetrics.floweringAvg && (
                    <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Differences
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          EC: {Math.abs(data.nutrientMetrics.floweringAvg.avgEc - data.nutrientMetrics.vegetativeAvg.avgEc).toFixed(2)} mS/cm {data.nutrientMetrics.floweringAvg.avgEc > data.nutrientMetrics.vegetativeAvg.avgEc ? 'higher' : 'lower'} in flowering
                        </p>
                        <p>
                          pH: {Math.abs(data.nutrientMetrics.floweringAvg.avgPh - data.nutrientMetrics.vegetativeAvg.avgPh).toFixed(2)} {data.nutrientMetrics.floweringAvg.avgPh > data.nutrientMetrics.vegetativeAvg.avgPh ? 'higher' : 'lower'} in flowering
                        </p>
                        <p>
                          Water Volume: {Math.abs(data.nutrientMetrics.floweringAvg.avgWaterVolume - data.nutrientMetrics.vegetativeAvg.avgWaterVolume).toFixed(0)} mL {data.nutrientMetrics.floweringAvg.avgWaterVolume > data.nutrientMetrics.vegetativeAvg.avgWaterVolume ? 'more' : 'less'} per feeding in flowering
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* pH Trend Chart */}
            {visibleParams.ph && phEcTrendData.length > 0 && (
              <ChartWrapper
                title="pH Trend (Individual Measurements)"
                description="pH values from individual feeding events. Optimal range: 5.5-6.5 (highlighted in green)"
                data={phEcTrendData}
                exportFilename="ph-trend.csv"
                height={300}
              >
                <LineChart data={phEcTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={[4.5, 7.5]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceArea
                    y1={5.5}
                    y2={6.5}
                    fill={CHART_COLORS.success}
                    fillOpacity={0.1}
                    label="Optimal Range"
                  />
                  <Line
                    type="monotone"
                    dataKey="ph"
                    name="pH Level"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.secondary, r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ChartWrapper>
            )}

            {/* EC Trend Chart */}
            {visibleParams.ec && phEcTrendData.length > 0 && (
              <ChartWrapper
                title="EC Trend (Individual Measurements)"
                description="EC values from individual feeding events. Optimal range: 1.0-2.5 mS/cm (highlighted in green)"
                data={phEcTrendData}
                exportFilename="ec-trend.csv"
                height={300}
              >
                <LineChart data={phEcTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 4]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceArea
                    y1={1.0}
                    y2={2.5}
                    fill={CHART_COLORS.success}
                    fillOpacity={0.1}
                    label="Optimal Range"
                  />
                  <Line
                    type="monotone"
                    dataKey="ec"
                    name="EC Level (mS/cm)"
                    stroke={CHART_COLORS.tertiary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.tertiary, r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                </LineChart>
              </ChartWrapper>
            )}
          </div>
        )}
      </div>
    </div>
  );
}