import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useYieldAnalytics } from '@/services/analyticsApi';
import { ChartWrapper } from '@/components/analytics/charts/ChartWrapper';
import { MetricCard } from '@/components/analytics/metrics/MetricCard';
import { TimeRangeSelector, TimeRange } from '@/components/analytics/filters/TimeRangeSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Target,
  Zap,
  Loader2,
  AlertCircle,
  Leaf,
  Calendar,
  Maximize,
} from 'lucide-react';
import {
  formatWeight,
  formatNumber,
  formatPercent,
  CHART_COLORS,
} from '@/utils/chartUtils';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

/**
 * YieldAnalyticsPage - Visualizes yield metrics, quality distribution, and efficiency
 * Shows yield comparison, potency metrics, and performance analysis
 */
export default function YieldAnalyticsPage() {
  // Time range state (default to last 90 days)
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: startOfDay(subDays(new Date(), 89)),
    to: endOfDay(new Date()),
    label: 'Last 90 days',
  });

  // Fetch yield analytics data
  const { data, isLoading, isError, error } = useYieldAnalytics({
    startDate: format(timeRange.from, 'yyyy-MM-dd'),
    endDate: format(timeRange.to, 'yyyy-MM-dd'),
  });

  // Format yield comparison data by cultivar (from top performers)
  const yieldComparisonData = useMemo(() => {
    if (!data?.topPerformers) return [];

    // Group top performers by cultivar to get totals
    const cultivarMap = new Map<string, { totalYield: number; count: number }>();

    data.topPerformers.forEach((performer) => {
      const existing = cultivarMap.get(performer.cultivarName) || { totalYield: 0, count: 0 };
      cultivarMap.set(performer.cultivarName, {
        totalYield: existing.totalYield + performer.yield,
        count: existing.count + 1,
      });
    });

    return Array.from(cultivarMap.entries()).map(([cultivar, stats]) => ({
      cultivar,
      totalYield: stats.totalYield,
      averageYield: stats.totalYield / stats.count,
    }));
  }, [data?.topPerformers]);

  // Format quality distribution data
  const qualityDistributionData = useMemo(() => {
    if (!data?.qualityTracking?.qualityDistribution) return [];

    const dist = data.qualityTracking.qualityDistribution;
    const total = dist.excellent + dist.good + dist.average + dist.poor;

    if (total === 0) return [];

    return [
      { name: 'Excellent', value: dist.excellent, percentage: (dist.excellent / total) * 100 },
      { name: 'Good', value: dist.good, percentage: (dist.good / total) * 100 },
      { name: 'Average', value: dist.average, percentage: (dist.average / total) * 100 },
      { name: 'Poor', value: dist.poor, percentage: (dist.poor / total) * 100 },
    ].filter(item => item.value > 0);
  }, [data?.qualityTracking]);

  // Custom tooltip for bar charts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
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
            <span className="font-medium">{formatWeight(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0];
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-1">{data.name}</p>
        <p className="text-xs text-muted-foreground">
          Count: {data.value}
        </p>
        <p className="text-xs text-muted-foreground">
          Percentage: {formatPercent(data.payload.percentage)}
        </p>
      </div>
    );
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.name} (${formatPercent(entry.percentage)})`;
  };

  // Get color for quality level
  const getQualityColor = (index: number) => {
    const colors = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];
    return colors[index] || CHART_COLORS.neutral;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Yield Analytics"
        subtitle="Analyze harvest yields, quality distribution, and production efficiency"
        actions={
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
            showCustom={true}
          />
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Loading yield data"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading yield data: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!data?.yieldMetrics || !data.yieldMetrics.totalYield || data.yieldMetrics.totalYield === 0) && (
          <div className="text-center py-12">
            <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No yield data available</h3>
            <p className="text-sm text-muted-foreground">
              Complete harvests to see yield analytics here
            </p>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !isError && data?.yieldMetrics && data.yieldMetrics.totalYield && data.yieldMetrics.totalYield > 0 && (
          <div className="space-y-6">
            {/* Summary Metrics Cards - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Yield */}
              <MetricCard
                title="Total Yield"
                value={formatWeight(data.yieldMetrics.totalYield)}
                description={`From ${data.yieldMetrics.totalHarvests} harvests`}
                icon={<Award className="h-4 w-4" />}
                variant="success"
              />

              {/* Average Yield Per Plant */}
              <MetricCard
                title="Avg Yield Per Plant"
                value={formatWeight(data.yieldMetrics.avgYieldPerPlant)}
                description={`${data.yieldMetrics.totalPlantsHarvested} plants harvested`}
                icon={<Leaf className="h-4 w-4" />}
                variant="success"
              />

              {/* Average Yield Per Cultivar */}
              <MetricCard
                title="Avg Yield Per Cultivar"
                value={formatWeight(data.yieldMetrics.avgYieldPerCultivar)}
                description="Average across all cultivars"
                icon={<Target className="h-4 w-4" />}
                variant="info"
              />

              {/* Average Yield Per Grow */}
              <MetricCard
                title="Avg Yield Per Grow"
                value={formatWeight(data.yieldMetrics.avgYieldPerGrow)}
                description="Average across all grows"
                icon={<TrendingUp className="h-4 w-4" />}
                variant="info"
              />
            </div>

            {/* Summary Metrics Cards - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Average Wet Weight */}
              <MetricCard
                title="Avg Wet Weight"
                value={formatWeight(data.yieldMetrics.avgWetWeight)}
                description="Average fresh harvest weight"
                icon={<Leaf className="h-4 w-4" />}
                variant="info"
              />

              {/* Average Dry Weight */}
              <MetricCard
                title="Avg Dry Weight"
                value={formatWeight(data.yieldMetrics.avgDryWeight)}
                description="Average cured weight"
                icon={<Award className="h-4 w-4" />}
                variant="success"
              />

              {/* Wet to Dry Ratio */}
              <MetricCard
                title="Wet to Dry Ratio"
                value={`${formatNumber(data.yieldMetrics.avgWetToDryRatio, 2)}:1`}
                description="Average conversion rate"
                icon={<Target className="h-4 w-4" />}
                variant="info"
              />

              {/* Success Rate */}
              <MetricCard
                title="Success Rate"
                value={`${formatPercent(data.productionEfficiency.successRate, 1)}`}
                description="Plants reaching harvest"
                icon={<TrendingUp className="h-4 w-4" />}
                variant={data.productionEfficiency.successRate >= 80 ? 'success' : 'warning'}
              />
            </div>

            {/* Production Efficiency Metrics - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Average Days to Harvest */}
              {data.productionEfficiency.avgDaysToHarvest && (
                <MetricCard
                  title="Avg Days to Harvest"
                  value={`${formatNumber(data.productionEfficiency.avgDaysToHarvest, 0)} days`}
                  description="Average time from start to harvest"
                  icon={<Calendar className="h-4 w-4" />}
                  variant="info"
                />
              )}

              {/* Yield Per Square Foot */}
              {data.productionEfficiency.yieldPerSqFt && (
                <MetricCard
                  title="Yield Per Sq Ft"
                  value={formatWeight(data.productionEfficiency.yieldPerSqFt)}
                  description="Space efficiency metric"
                  icon={<Maximize className="h-4 w-4" />}
                  variant="info"
                />
              )}

              {/* Grams Per Watt */}
              {data.productionEfficiency.gramsPerWatt && (
                <MetricCard
                  title="Grams Per Watt"
                  value={formatNumber(data.productionEfficiency.gramsPerWatt, 2)}
                  description="Light efficiency metric"
                  icon={<Zap className="h-4 w-4" />}
                  variant="info"
                />
              )}

              {/* Production Trend */}
              {data.productionEfficiency.trend && (
                <MetricCard
                  title="Production Trend"
                  value={data.productionEfficiency.trend.charAt(0).toUpperCase() + data.productionEfficiency.trend.slice(1)}
                  description="Overall yield trajectory"
                  icon={<TrendingUp className="h-4 w-4" />}
                  variant={
                    data.productionEfficiency.trend === 'improving'
                      ? 'success'
                      : data.productionEfficiency.trend === 'declining'
                      ? 'warning'
                      : 'info'
                  }
                />
              )}
            </div>

            {/* Yield Comparison by Cultivar */}
            {yieldComparisonData.length > 0 && (
              <ChartWrapper
                title="Yield Comparison by Cultivar"
                description="Total and average yield per cultivar"
                data={yieldComparisonData}
                exportFilename="yield-comparison.csv"
                height={350}
              >
                <BarChart data={yieldComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="cultivar"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Yield (g)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="totalYield"
                    name="Total Yield"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="averageYield"
                    name="Average Yield"
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartWrapper>
            )}

            {/* Two Column Layout for Quality and Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quality Distribution Pie Chart */}
              {qualityDistributionData.length > 0 && (
                <ChartWrapper
                  title="Quality Distribution"
                  description="Distribution by potency level"
                  data={qualityDistributionData}
                  exportFilename="quality-distribution.csv"
                  height={300}
                >
                  <PieChart>
                    <Pie
                      data={qualityDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {qualityDistributionData.map((_item, index) => (
                        <Cell key={`cell-${index}`} fill={getQualityColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ChartWrapper>
              )}

              {/* Top Performers List */}
              {data.topPerformers && data.topPerformers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Highest yielding plants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.topPerformers.slice(0, 5).map((performer, index) => (
                        <div
                          key={performer.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                index === 0
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                  : index === 1
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                              }`}
                            >
                              <span className="text-xs font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{performer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {performer.cultivarName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {formatWeight(performer.yield)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {performer.type === 'plant' ? 'Plant' : 'Grow'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}