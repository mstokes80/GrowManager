import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useEnvironmentalTrends } from '@/services/analyticsApi';
import { useGrows, useGrow } from '@/services/growsApi';
import { ChartWrapper } from '@/components/analytics/charts/ChartWrapper';
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
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from 'recharts';
import {
  Thermometer,
  Droplet,
  Droplets,
  TrendingUp,
  Loader2,
  AlertCircle,
  BarChart3,
  Sprout,
} from 'lucide-react';
import {
  formatChartDate,
  formatTemperature,
  formatHumidity,
  CHART_COLORS,
} from '@/utils/chartUtils';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

/**
 * EnvironmentalAnalyticsPage - Visualizes environmental trends
 * Shows temperature, humidity, VPD, CO2, and light data with analytics
 */
export default function EnvironmentalAnalyticsPage() {
  // Fetch user's grows for selection
  const { data: growsData } = useGrows();
  const activeGrows = growsData?.filter((g) => !g.isArchived) || [];

  // Selected grow state (initialized to null, set after grows load)
  const [selectedGrowId, setSelectedGrowId] = useState<string | null>(null);

  // Auto-select first active grow when grows data loads
  useEffect(() => {
    if (activeGrows.length > 0 && !selectedGrowId && activeGrows[0]) {
      setSelectedGrowId(activeGrows[0].id);
    }
  }, [activeGrows, selectedGrowId]);

  // Time range state (default to last 30 days)
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
    label: 'Last 30 days',
  });

  // Aggregation state
  const [aggregation, setAggregation] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');

  // Parameter visibility toggles
  const [visibleParams, setVisibleParams] = useState({
    temperature: true,
    humidity: true,
    vpd: true,
    co2: true,
    light: true,
    soilMoisture: true,
  });

  // Fetch the selected grow's details (for target ranges)
  const { data: selectedGrow } = useGrow(selectedGrowId || '');

  // Fetch environmental trends data (only when a grow is selected)
  const { data, isLoading, isError, error } = useEnvironmentalTrends(
    {
      growId: selectedGrowId || undefined,
      startDate: format(timeRange.from, 'yyyy-MM-dd'),
      endDate: format(timeRange.to, 'yyyy-MM-dd'),
      aggregation,
    },
    {
      enabled: !!selectedGrowId, // Only run query when a grow is selected
    }
  );

  // Toggle parameter visibility
  const toggleParameter = (param: keyof typeof visibleParams) => {
    setVisibleParams((prev) => ({ ...prev, [param]: !prev[param] }));
  };

  // Format chart data for Recharts
  const chartData = useMemo(() => {
    if (!data?.dataPoints) return [];

    return data.dataPoints.map((point) => ({
      timestamp: point.timestamp,
      date: formatChartDate(point.timestamp),
      temperature: point.temperature,
      temperatureMin: point.temperatureMin,
      temperatureMax: point.temperatureMax,
      humidity: point.humidity,
      humidityMin: point.humidityMin,
      humidityMax: point.humidityMax,
      vpd: point.vpd,
      co2: point.co2,
      lightIntensity: point.lightIntensity,
      soilMoisture: point.soilMoisture,
    }));
  }, [data?.dataPoints]);

  // Custom tooltip component
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
            <span className="font-medium">{entry.value?.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Environmental Analytics"
        subtitle="Analyze temperature, humidity, VPD, and other environmental factors over time"
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedGrowId || ''}
              onValueChange={setSelectedGrowId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a grow" />
              </SelectTrigger>
              <SelectContent>
                {activeGrows.map((grow) => (
                  <SelectItem key={grow.id} value={grow.id}>
                    {grow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={aggregation}
              onValueChange={(value: any) => setAggregation(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
              showCustom={true}
            />
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* No Grow Selected State */}
        {!selectedGrowId && activeGrows.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a grow to view environmental analytics
            </AlertDescription>
          </Alert>
        )}

        {/* No Active Grows State */}
        {activeGrows.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have any active grows. Create a grow to start tracking environmental data.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {selectedGrowId && isLoading && (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Loading environmental data"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {selectedGrowId && isError && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading environmental data: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {selectedGrowId && !isLoading && !isError && chartData.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No environmental data available</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking environmental conditions to see analytics here
            </p>
          </div>
        )}

        {/* Main Content */}
        {selectedGrowId && !isLoading && !isError && data && chartData.length > 0 && (
          <div className="space-y-6">
            {/* Parameter Toggles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Visible Parameters</CardTitle>
                <CardDescription>Toggle which environmental parameters to display</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="temp-toggle"
                      checked={visibleParams.temperature}
                      onChange={() => toggleParameter('temperature')}
                    />
                    <Label htmlFor="temp-toggle" className="cursor-pointer">
                      Temperature
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="humidity-toggle"
                      checked={visibleParams.humidity}
                      onChange={() => toggleParameter('humidity')}
                    />
                    <Label htmlFor="humidity-toggle" className="cursor-pointer">
                      Humidity
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="vpd-toggle"
                      checked={visibleParams.vpd}
                      onChange={() => toggleParameter('vpd')}
                    />
                    <Label htmlFor="vpd-toggle" className="cursor-pointer">
                      VPD
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="co2-toggle"
                      checked={visibleParams.co2}
                      onChange={() => toggleParameter('co2')}
                    />
                    <Label htmlFor="co2-toggle" className="cursor-pointer">
                      CO2
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="light-toggle"
                      checked={visibleParams.light}
                      onChange={() => toggleParameter('light')}
                    />
                    <Label htmlFor="light-toggle" className="cursor-pointer">
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="soil-moisture-toggle"
                      checked={visibleParams.soilMoisture}
                      onChange={() => toggleParameter('soilMoisture')}
                    />
                    <Label htmlFor="soil-moisture-toggle" className="cursor-pointer">
                      Soil Moisture
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overall Summary Section */}
            {data.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Overall Environmental Summary</CardTitle>
                  <CardDescription>
                    Aggregate statistics across all parameters for the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Stability Score</span>
                        <span className="text-2xl font-bold">{data.summary.stabilityScore.toFixed(1)}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground px-4">
                        Overall environmental stability across all parameters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">Days Out of Range</span>
                        <span className={`text-2xl font-bold ${data.summary.daysOutOfRange === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {data.summary.daysOutOfRange}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground px-4">
                        Number of days with parameters outside optimal ranges
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Parameter Statistics */}
            {data.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Parameter Statistics</CardTitle>
                  <CardDescription>
                    Comprehensive breakdown of environmental parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Temperature Details */}
                    {data.summary.temperature && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Thermometer className="h-5 w-5 text-red-600" />
                          <h4 className="font-semibold">Temperature</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Minimum</p>
                            <p className="text-lg font-semibold">{formatTemperature(data.summary.temperature.min)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Maximum</p>
                            <p className="text-lg font-semibold">{formatTemperature(data.summary.temperature.max)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Average</p>
                            <p className="text-lg font-semibold">{formatTemperature(data.summary.temperature.average)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Std Deviation</p>
                            <p className="text-lg font-semibold">{data.summary.temperature.standardDeviation.toFixed(2)}°F</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Optimal Range</p>
                            <p className="text-lg font-semibold">
                              {data.summary.temperature.optimalRange.min}-{data.summary.temperature.optimalRange.max}{data.summary.temperature.optimalRange.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Humidity Details */}
                    {data.summary.humidity && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Droplet className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold">Humidity</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Minimum</p>
                            <p className="text-lg font-semibold">{formatHumidity(data.summary.humidity.min)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Maximum</p>
                            <p className="text-lg font-semibold">{formatHumidity(data.summary.humidity.max)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Average</p>
                            <p className="text-lg font-semibold">{formatHumidity(data.summary.humidity.average)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Std Deviation</p>
                            <p className="text-lg font-semibold">{data.summary.humidity.standardDeviation.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Optimal Range</p>
                            <p className="text-lg font-semibold">
                              {data.summary.humidity.optimalRange.min}-{data.summary.humidity.optimalRange.max}{data.summary.humidity.optimalRange.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VPD Details */}
                    {data.summary.vpd && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Droplets className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold">Vapor Pressure Deficit (VPD)</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Minimum</p>
                            <p className="text-lg font-semibold">{data.summary.vpd.min.toFixed(2)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Maximum</p>
                            <p className="text-lg font-semibold">{data.summary.vpd.max.toFixed(2)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Average</p>
                            <p className="text-lg font-semibold">{data.summary.vpd.average.toFixed(2)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Std Deviation</p>
                            <p className="text-lg font-semibold">{data.summary.vpd.standardDeviation.toFixed(3)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Optimal Range</p>
                            <p className="text-lg font-semibold">
                              {data.summary.vpd.optimalRange.min}-{data.summary.vpd.optimalRange.max} {data.summary.vpd.optimalRange.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Soil Moisture Details */}
                    {data.summary.soilMoisture && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <Sprout className="h-5 w-5 text-amber-700" />
                          <h4 className="font-semibold">Soil Moisture</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Minimum</p>
                            <p className="text-lg font-semibold">{data.summary.soilMoisture.min.toFixed(1)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Maximum</p>
                            <p className="text-lg font-semibold">{data.summary.soilMoisture.max.toFixed(1)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Average</p>
                            <p className="text-lg font-semibold">{data.summary.soilMoisture.average.toFixed(1)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Std Deviation</p>
                            <p className="text-lg font-semibold">{data.summary.soilMoisture.standardDeviation.toFixed(2)} kPa</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Optimal Range</p>
                            <p className="text-lg font-semibold">
                              {data.summary.soilMoisture.optimalRange.min}-{data.summary.soilMoisture.optimalRange.max} {data.summary.soilMoisture.optimalRange.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Temperature Trend Chart */}
            {visibleParams.temperature && (
              <ChartWrapper
                title="Temperature Trend"
                description={selectedGrow?.targetTempMin && selectedGrow?.targetTempMax
                  ? `Target: ${selectedGrow.targetTempMin}-${selectedGrow.targetTempMax}°F`
                  : 'Temperature over time'}
                data={chartData}
                exportFilename="temperature-trend.csv"
                height={300}
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={selectedGrow?.targetTempMin && selectedGrow?.targetTempMax
                      ? [
                          selectedGrow.targetTempMin - 5,
                          selectedGrow.targetTempMax + 5,
                        ]
                      : ['auto', 'auto']
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedGrow?.targetTempMin && selectedGrow?.targetTempMax && (
                    <ReferenceArea
                      y1={selectedGrow.targetTempMin}
                      y2={selectedGrow.targetTempMax}
                      fill={CHART_COLORS.success}
                      fillOpacity={0.1}
                      label="Target Range"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="temperatureMax"
                    name="Max Temp (°F)"
                    stroke="#ff9999"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#ff9999', r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Avg Temp (°F)"
                    stroke={CHART_COLORS.danger}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.danger, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperatureMin"
                    name="Min Temp (°F)"
                    stroke="#cc0000"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#cc0000', r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartWrapper>
            )}

            {/* Humidity Trend Chart */}
            {visibleParams.humidity && (
              <ChartWrapper
                title="Humidity Trend"
                description={selectedGrow?.targetHumidityMin && selectedGrow?.targetHumidityMax
                  ? `Target: ${selectedGrow.targetHumidityMin}-${selectedGrow.targetHumidityMax}%`
                  : 'Humidity over time'}
                data={chartData}
                exportFilename="humidity-trend.csv"
                height={300}
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={selectedGrow?.targetHumidityMin && selectedGrow?.targetHumidityMax
                      ? [
                          selectedGrow.targetHumidityMin - 10,
                          selectedGrow.targetHumidityMax + 10,
                        ]
                      : ['auto', 'auto']
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedGrow?.targetHumidityMin && selectedGrow?.targetHumidityMax && (
                    <ReferenceArea
                      y1={selectedGrow.targetHumidityMin}
                      y2={selectedGrow.targetHumidityMax}
                      fill={CHART_COLORS.success}
                      fillOpacity={0.1}
                      label="Target Range"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="humidityMax"
                    name="Max Humidity (%)"
                    stroke="#99ccff"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#99ccff', r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    name="Avg Humidity (%)"
                    stroke={CHART_COLORS.info}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.info, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="humidityMin"
                    name="Min Humidity (%)"
                    stroke="#0066cc"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={{ fill: '#0066cc', r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartWrapper>
            )}

            {/* VPD Trend Chart */}
            {visibleParams.vpd && (
              <ChartWrapper
                title="VPD Trend"
                description={data.summary?.vpd?.optimalRange
                  ? `Optimal: ${data.summary.vpd.optimalRange.min}-${data.summary.vpd.optimalRange.max} ${data.summary.vpd.optimalRange.unit}`
                  : 'VPD over time'}
                data={chartData}
                exportFilename="vpd-trend.csv"
                height={300}
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 2]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {data.summary?.vpd?.optimalRange && (
                    <ReferenceArea
                      y1={data.summary.vpd.optimalRange.min}
                      y2={data.summary.vpd.optimalRange.max}
                      fill={CHART_COLORS.success}
                      fillOpacity={0.1}
                      label="Optimal Range"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="vpd"
                    name="VPD (kPa)"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.secondary, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartWrapper>
            )}

            {/* Soil Moisture Trend Chart */}
            {visibleParams.soilMoisture && (
              <ChartWrapper
                title="Soil Moisture Trend"
                description={data.summary?.soilMoisture?.optimalRange
                  ? `Optimal: ${data.summary.soilMoisture.optimalRange.min}-${data.summary.soilMoisture.optimalRange.max} ${data.summary.soilMoisture.optimalRange.unit} (lower = wetter)`
                  : 'Soil moisture over time'}
                data={chartData}
                exportFilename="soil-moisture-trend.csv"
                height={300}
              >
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    domain={[0, 200]}
                    reversed
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {data.summary?.soilMoisture?.optimalRange && (
                    <ReferenceArea
                      y1={data.summary.soilMoisture.optimalRange.min}
                      y2={data.summary.soilMoisture.optimalRange.max}
                      fill={CHART_COLORS.success}
                      fillOpacity={0.1}
                      label="Optimal Range"
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="soilMoisture"
                    name="Soil Moisture (kPa)"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ fill: '#d97706', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ChartWrapper>
            )}

            {/* Multi-Parameter Chart (Temperature & Humidity) */}
            <ChartWrapper
              title="Temperature & Humidity Correlation"
              description="Dual-axis view of temperature and humidity trends"
              data={chartData}
              exportFilename="temp-humidity-correlation.csv"
              height={350}
            >
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke={CHART_COLORS.danger}
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Temperature (°F)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={CHART_COLORS.info}
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°F)"
                  stroke={CHART_COLORS.danger}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.danger, r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity (%)"
                  stroke={CHART_COLORS.info}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.info, r: 3 }}
                />
              </ComposedChart>
            </ChartWrapper>

            {/* Stage-Based Comparison */}
            {data.stageComparison && (data.stageComparison.vegetative || data.stageComparison.flowering) && (
              <Card>
                <CardHeader>
                  <CardTitle>Stage Comparison</CardTitle>
                  <CardDescription>
                    Environmental averages during vegetative vs flowering stages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Vegetative Stage */}
                    {data.stageComparison.vegetative && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="success" className="capitalize">
                            Vegetative
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({data.stageComparison.vegetative.dataPointCount} data points)
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Temperature</span>
                            <span className="font-medium">{formatTemperature(data.stageComparison.vegetative.avgTemperature)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Humidity</span>
                            <span className="font-medium">{formatHumidity(data.stageComparison.vegetative.avgHumidity)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">VPD</span>
                            <span className="font-medium">{data.stageComparison.vegetative.avgVpd.toFixed(2)} kPa</span>
                          </div>
                          {data.stageComparison.vegetative.avgCo2 && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">CO2</span>
                              <span className="font-medium">{Math.round(data.stageComparison.vegetative.avgCo2)} ppm</span>
                            </div>
                          )}
                          {data.stageComparison.vegetative.avgLight && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Light</span>
                              <span className="font-medium">{Math.round(data.stageComparison.vegetative.avgLight)} μmol/m²/s</span>
                            </div>
                          )}
                          {data.stageComparison.vegetative.avgSoilMoisture && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Soil Moisture</span>
                              <span className="font-medium">{data.stageComparison.vegetative.avgSoilMoisture.toFixed(1)} kPa</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Flowering Stage */}
                    {data.stageComparison.flowering && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="info" className="capitalize">
                            Flowering
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ({data.stageComparison.flowering.dataPointCount} data points)
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Temperature</span>
                            <span className="font-medium">{formatTemperature(data.stageComparison.flowering.avgTemperature)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">Humidity</span>
                            <span className="font-medium">{formatHumidity(data.stageComparison.flowering.avgHumidity)}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                            <span className="text-sm text-muted-foreground">VPD</span>
                            <span className="font-medium">{data.stageComparison.flowering.avgVpd.toFixed(2)} kPa</span>
                          </div>
                          {data.stageComparison.flowering.avgCo2 && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">CO2</span>
                              <span className="font-medium">{Math.round(data.stageComparison.flowering.avgCo2)} ppm</span>
                            </div>
                          )}
                          {data.stageComparison.flowering.avgLight && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Light</span>
                              <span className="font-medium">{Math.round(data.stageComparison.flowering.avgLight)} μmol/m²/s</span>
                            </div>
                          )}
                          {data.stageComparison.flowering.avgSoilMoisture && (
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm text-muted-foreground">Soil Moisture</span>
                              <span className="font-medium">{data.stageComparison.flowering.avgSoilMoisture.toFixed(1)} kPa</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Highlight significant differences */}
                  {data.stageComparison.vegetative && data.stageComparison.flowering && (
                    <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Key Differences
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Temperature: {Math.abs(data.stageComparison.flowering.avgTemperature - data.stageComparison.vegetative.avgTemperature).toFixed(1)}°F {data.stageComparison.flowering.avgTemperature > data.stageComparison.vegetative.avgTemperature ? 'higher' : 'lower'} in flowering
                        </p>
                        <p>
                          Humidity: {Math.abs(data.stageComparison.flowering.avgHumidity - data.stageComparison.vegetative.avgHumidity).toFixed(0)}% {data.stageComparison.flowering.avgHumidity > data.stageComparison.vegetative.avgHumidity ? 'higher' : 'lower'} in flowering
                        </p>
                        <p>
                          VPD: {Math.abs(data.stageComparison.flowering.avgVpd - data.stageComparison.vegetative.avgVpd).toFixed(2)} kPa {data.stageComparison.flowering.avgVpd > data.stageComparison.vegetative.avgVpd ? 'higher' : 'lower'} in flowering
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}