import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useCultivarComparison } from '@/services/analyticsApi';
import { useCultivars } from '@/services/cultivarsApi';
import { ChartWrapper } from '@/components/analytics/charts/ChartWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Loader2,
  AlertCircle,
  BarChart3,
  Download,
  Printer,
  Award,
} from 'lucide-react';
import {
  formatPercent,
  CHART_COLORS,
  SERIES_COLORS,
  exportToCSV,
} from '@/utils/chartUtils';
import type { CultivarPerformanceMetrics } from '@/types/analytics';

/**
 * CultivarComparisonPage - Compare 2-4 cultivars side-by-side
 * Shows comprehensive metrics for informed decision-making
 */
export default function CultivarComparisonPage() {
  // State for selected cultivar IDs
  const [selectedCultivarIds, setSelectedCultivarIds] = useState<string[]>([]);

  // Fetch available cultivars for selection
  const { data: cultivars, isLoading: cultivarsLoading } = useCultivars();

  // Fetch comparison data when 2-4 cultivars are selected
  const {
    data: comparisonData,
    isLoading: comparisonLoading,
    isError,
    error,
  } = useCultivarComparison({
    cultivarIds: selectedCultivarIds,
    includeHistorical: true,
  });

  // Handle cultivar selection
  const handleCultivarToggle = (cultivarId: string) => {
    setSelectedCultivarIds((prev) => {
      if (prev.includes(cultivarId)) {
        return prev.filter((id) => id !== cultivarId);
      } else if (prev.length < 4) {
        return [...prev, cultivarId];
      }
      return prev;
    });
  };

  // Prepare radar chart data
  const radarData = useMemo(() => {
    if (!comparisonData?.cultivars) return [];

    const allMetrics = [
      {
        key: 'avgYieldPerPlant',
        label: 'Yield',
        getValue: (c: CultivarPerformanceMetrics) => c.performance.avgYieldPerPlant,
        max: Math.max(...comparisonData.cultivars.map((c) => c.performance.avgYieldPerPlant || 0), 1)
      },
      {
        key: 'successRate',
        label: 'Success Rate',
        getValue: (c: CultivarPerformanceMetrics) => c.performance.successRate,
        max: 100
      },
      {
        key: 'easeOfGrowthScore',
        label: 'Ease of Growth',
        getValue: (c: CultivarPerformanceMetrics) => c.performance.easeOfGrowthScore,
        max: 100
      },
      {
        key: 'avgQualityScore',
        label: 'Quality',
        getValue: (c: CultivarPerformanceMetrics) => c.quality.avgQualityScore,
        max: 10
      },
      {
        key: 'avgYieldPerSqFt',
        label: 'Yield/Sq Ft',
        getValue: (c: CultivarPerformanceMetrics) => c.performance.avgYieldPerSqFt || 0,
        max: Math.max(...comparisonData.cultivars.map((c) => c.performance.avgYieldPerSqFt || 0), 1)
      },
    ];

    // Filter out metrics where all cultivars have 0 or null values
    const metrics = allMetrics.filter((metric) => {
      return comparisonData.cultivars.some((cultivar) => {
        const value = metric.getValue(cultivar);
        return value && value > 0;
      });
    });

    return metrics.map((metric) => {
      const dataPoint: any = { metric: metric.label };
      comparisonData.cultivars.forEach((cultivar) => {
        const value = metric.getValue(cultivar) || 0;
        // Normalize to 0-100 scale for radar chart
        dataPoint[cultivar.cultivarName] = (value / metric.max) * 100;
      });
      return dataPoint;
    });
  }, [comparisonData]);

  // Prepare yield comparison bar chart data
  const yieldChartData = useMemo(() => {
    if (!comparisonData?.cultivars) return [];

    return comparisonData.cultivars.map((cultivar) => ({
      name: cultivar.cultivarName,
      'Average Yield': cultivar.performance.avgYieldPerPlant || 0,
      'Yield/Sq Ft': cultivar.performance.avgYieldPerSqFt || 0,
    }));
  }, [comparisonData]);

  // Export comparison to CSV
  const handleExportCSV = () => {
    if (!comparisonData?.cultivars) return;

    const exportData = comparisonData.cultivars.map((cultivar) => ({
      'Cultivar': cultivar.cultivarName,
      'Type': cultivar.type,
      'Total Grows': cultivar.totalGrows,
      'Total Plants': cultivar.totalPlants,
      'Average Yield (g)': cultivar.performance.avgYieldPerPlant?.toFixed(1) || 'N/A',
      'Yield/Sq Ft (g)': cultivar.performance.avgYieldPerSqFt?.toFixed(1) || 'N/A',
      'Success Rate (%)': cultivar.performance.successRate?.toFixed(0) || 'N/A',
      'Growth Duration (days)': cultivar.performance.avgDaysToHarvest || 'N/A',
      'Ease of Growth Score': cultivar.performance.easeOfGrowthScore?.toFixed(1) || 'N/A',
      'Wet to Dry Ratio': cultivar.performance.wetToDryRatio?.toFixed(2) || 'N/A',
      'Avg Potency (%)': cultivar.quality.avgPotency?.toFixed(1) || 'N/A',
      'Quality Score': cultivar.quality.avgQualityScore?.toFixed(1) || 'N/A',
      'Optimal Temp (°F)': cultivar.environmentalPreferences?.optimalTemperature?.toFixed(1) || 'N/A',
      'Optimal Humidity (%)': cultivar.environmentalPreferences?.optimalHumidity?.toFixed(0) || 'N/A',
      'Optimal VPD (kPa)': cultivar.environmentalPreferences?.optimalVpd?.toFixed(2) || 'N/A',
    }));

    exportToCSV(exportData, 'cultivar-comparison.csv');
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  // Get best/worst indicators
  const getBestWorst = (
    value: number,
    allValues: number[],
    higherIsBetter: boolean = true
  ) => {
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);

    if (higherIsBetter) {
      if (value === max) return { badge: 'Best', variant: 'success' as const };
      if (value === min) return { badge: 'Lowest', variant: 'destructive' as const };
    } else {
      if (value === min) return { badge: 'Best', variant: 'success' as const };
      if (value === max) return { badge: 'Longest', variant: 'warning' as const };
    }
    return null;
  };

  // Custom tooltip for charts
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

  const showComparison = selectedCultivarIds.length >= 2 && comparisonData;
  const validationError =
    selectedCultivarIds.length > 0 && selectedCultivarIds.length < 2
      ? 'Select at least 2 cultivars to compare'
      : null;

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <PageHeader
        title="Cultivar Comparison"
        subtitle="Compare cultivars side-by-side to make informed growing decisions"
        actions={
          showComparison && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          )
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Cultivar Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Cultivars to Compare</CardTitle>
            <CardDescription>
              Choose 2-4 cultivars for side-by-side comparison ({selectedCultivarIds.length}/4 selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cultivarsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {!cultivarsLoading && cultivars && cultivars.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No cultivars found. Add cultivars to your library first.
                </AlertDescription>
              </Alert>
            )}

            {!cultivarsLoading && cultivars && cultivars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cultivars.map((cultivar) => {
                  const isSelected = selectedCultivarIds.includes(cultivar.id);
                  const isDisabled = !isSelected && selectedCultivarIds.length >= 4;

                  return (
                    <button
                      key={cultivar.id}
                      onClick={() => !isDisabled && handleCultivarToggle(cultivar.id)}
                      disabled={isDisabled}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isDisabled
                          ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{cultivar.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {cultivar.type} {cultivar.plantCount ? `• ${cultivar.plantCount} plants` : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {validationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {comparisonLoading && (
          <div
            className="flex items-center justify-center py-12"
            role="status"
            aria-label="Loading comparison data"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {isError && !comparisonLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading comparison data: {error?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State - No Selection */}
        {!comparisonLoading && !isError && selectedCultivarIds.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Select cultivars to compare</h3>
            <p className="text-sm text-muted-foreground">
              Choose 2-4 cultivars from the list above to see detailed comparisons
            </p>
          </div>
        )}

        {/* Comparison Content */}
        {showComparison && (
          <div className="space-y-6">
            {/* Top Performers Summary */}
            {comparisonData.bestPerformers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <div className="text-sm text-muted-foreground mb-1">Highest Yield</div>
                      <div className="text-lg font-medium text-green-700 dark:text-green-400">
                        {comparisonData.cultivars.find((c) => c.cultivarId === comparisonData.bestPerformers.highestYield)?.cultivarName || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-muted-foreground mb-1">Fastest Growth</div>
                      <div className="text-lg font-medium text-blue-700 dark:text-blue-400">
                        {comparisonData.cultivars.find((c) => c.cultivarId === comparisonData.bestPerformers.fastestGrowth)?.cultivarName || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-muted-foreground mb-1">Easiest to Grow</div>
                      <div className="text-lg font-medium text-purple-700 dark:text-purple-400">
                        {comparisonData.cultivars.find((c) => c.cultivarId === comparisonData.bestPerformers.easiestToGrow)?.cultivarName || 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                      <div className="text-sm text-muted-foreground mb-1">Highest Quality</div>
                      <div className="text-lg font-medium text-yellow-700 dark:text-yellow-400">
                        {comparisonData.cultivars.find((c) => c.cultivarId === comparisonData.bestPerformers.highestQuality)?.cultivarName || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
                <CardDescription>Side-by-side metrics for all selected cultivars</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Metric</th>
                        {comparisonData.cultivars.map((cultivar, idx) => (
                          <th
                            key={cultivar.cultivarId}
                            className="text-left p-3 font-medium"
                            style={{ color: SERIES_COLORS[idx % SERIES_COLORS.length] }}
                          >
                            {cultivar.cultivarName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Total Grows */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Total Grows</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.totalGrows}
                          </td>
                        ))}
                      </tr>

                      {/* Average Yield */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Average Yield (g)</td>
                        {comparisonData.cultivars.map((cultivar) => {
                          const indicator = getBestWorst(
                            cultivar.performance.avgYieldPerPlant || 0,
                            comparisonData.cultivars.map((c) => c.performance.avgYieldPerPlant || 0)
                          );
                          return (
                            <td key={cultivar.cultivarId} className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{cultivar.performance.avgYieldPerPlant?.toFixed(1) || 'N/A'}</span>
                                {indicator && (
                                  <Badge variant={indicator.variant} className="text-xs">
                                    {indicator.badge}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Yield per Sq Ft */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Yield/Sq Ft (g)</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.performance.avgYieldPerSqFt?.toFixed(1) || 'N/A'}
                          </td>
                        ))}
                      </tr>

                      {/* Success Rate */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Success Rate</td>
                        {comparisonData.cultivars.map((cultivar) => {
                          const indicator = getBestWorst(
                            cultivar.performance.successRate,
                            comparisonData.cultivars.map((c) => c.performance.successRate)
                          );
                          return (
                            <td key={cultivar.cultivarId} className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatPercent(cultivar.performance.successRate, 0)}</span>
                                {indicator && (
                                  <Badge variant={indicator.variant} className="text-xs">
                                    {indicator.badge}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Growth Duration */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Growth Duration (days)</td>
                        {comparisonData.cultivars.map((cultivar) => {
                          const indicator = getBestWorst(
                            cultivar.performance.avgDaysToHarvest,
                            comparisonData.cultivars.map((c) => c.performance.avgDaysToHarvest),
                            false
                          );
                          return (
                            <td key={cultivar.cultivarId} className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{cultivar.performance.avgDaysToHarvest}</span>
                                {indicator && (
                                  <Badge variant={indicator.variant} className="text-xs">
                                    {indicator.badge}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Quality Score */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Quality Score</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.quality.avgQualityScore?.toFixed(1) || 'N/A'} / 10
                          </td>
                        ))}
                      </tr>

                      {/* Ease of Growth */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Ease of Growth Score</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.performance.easeOfGrowthScore?.toFixed(1) || 'N/A'} / 100
                          </td>
                        ))}
                      </tr>

                      {/* Optimal Temperature */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Optimal Temperature (°F)</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.environmentalPreferences?.optimalTemperature?.toFixed(1) || 'N/A'}
                          </td>
                        ))}
                      </tr>

                      {/* Optimal Humidity */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Optimal Humidity (%)</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.environmentalPreferences?.optimalHumidity?.toFixed(0) || 'N/A'}
                          </td>
                        ))}
                      </tr>

                      {/* Optimal VPD */}
                      <tr className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">Optimal VPD (kPa)</td>
                        {comparisonData.cultivars.map((cultivar) => (
                          <td key={cultivar.cultivarId} className="p-3 text-sm font-medium">
                            {cultivar.environmentalPreferences?.optimalVpd?.toFixed(2) || 'N/A'}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart - Multi-dimensional Comparison */}
            {radarData.length > 0 ? (
              <ChartWrapper
                title="Multi-Dimensional Comparison"
                description="Normalized view of key performance metrics"
                data={radarData}
                exportFilename="cultivar-radar-comparison.csv"
                height={400}
              >
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {comparisonData.cultivars.map((cultivar, idx) => (
                    <Radar
                      key={cultivar.cultivarId}
                      name={cultivar.cultivarName}
                      dataKey={cultivar.cultivarName}
                      stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
                      fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ChartWrapper>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient data for multi-dimensional comparison. Complete more grows with detailed metrics (quality score, ease of growth, etc.) to see this chart.
                </AlertDescription>
              </Alert>
            )}

            {/* Yield Comparison Bar Chart */}
            {yieldChartData.length > 0 && yieldChartData.some(d => d['Average Yield'] > 0) ? (
              <ChartWrapper
                title="Yield Comparison"
                description="Average yield and yield per square foot"
                data={yieldChartData}
                exportFilename="cultivar-yield-comparison.csv"
                height={350}
              >
                <BarChart data={yieldChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    angle={-15}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="Average Yield"
                    fill={CHART_COLORS.primary}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Yield/Sq Ft"
                    fill={CHART_COLORS.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartWrapper>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No yield data available for comparison. Complete harvests for the selected cultivars to see yield comparisons.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  );
}