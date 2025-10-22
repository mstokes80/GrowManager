import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useGrows } from '@/services/growsApi';
import { usePlants } from '@/services/plantsApi';
import { useAnalyticsDashboard } from '@/services/analyticsApi';
import { MetricCard } from '@/components/analytics/metrics/MetricCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Sprout,
  Leaf,
  Activity,
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2,
  Thermometer,
  Droplet,
  AlertTriangle,
  Droplets,
  Lightbulb,
  Wind,
  BarChart3,
} from 'lucide-react';
import type { Plant } from '@/types/plant';
import type { EnvironmentalQualityIndicator } from '@/types/analytics';
import { formatDistanceToNow } from 'date-fns';

/**
 * DashboardPage - Enhanced main dashboard with analytics
 * Shows overview of active grows, analytics metrics, environmental quality,
 * plant distribution, issues, and recent activity
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: grows, isLoading: growsLoading } = useGrows();
  const { data: plants, isLoading: plantsLoading } = usePlants();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsDashboard();

  // Get environmental indicator icon and color
  const getEnvironmentalIcon = (parameter: EnvironmentalQualityIndicator['parameter']) => {
    switch (parameter) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Droplet className="h-4 w-4" />;
      case 'vpd':
        return <Droplets className="h-4 w-4" />;
      case 'co2':
        return <Wind className="h-4 w-4" />;
      case 'light':
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: EnvironmentalQualityIndicator['status']) => {
    switch (status) {
      case 'optimal':
        return 'success' as const;
      case 'warning':
        return 'warning' as const;
      case 'critical':
        return 'danger' as const;
      default:
        return 'default' as const;
    }
  };

  // Get status badge colors - matches PlantCard colors
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

  // Get activity type icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return <Droplet className="h-4 w-4" />;
      case 'watering':
        return <Droplets className="h-4 w-4" />;
      case 'training':
        return <Activity className="h-4 w-4" />;
      case 'pruning':
        return <Leaf className="h-4 w-4" />;
      case 'observation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'transplanting':
        return <Sprout className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const activeGrows = grows?.filter((g) => !g.isArchived) || [];
    const activePlants = plants?.filter((p) => p.healthStatus === 'active') || [];
    const totalPlants = plants?.length || 0;

    // Get recent plants (last 5)
    const recentPlants = [...(plants || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalGrows: grows?.length || 0,
      activeGrows: activeGrows.length,
      totalPlants,
      activePlants: activePlants.length,
      recentPlants,
      activeGrowsList: activeGrows.slice(0, 3),
    };
  }, [grows, plants]);

  const isLoading = growsLoading || plantsLoading || analyticsLoading;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your grows and analytics insights"
        actions={
          <Button size="sm" onClick={() => navigate('/grows')}>
            <Plus className="h-4 w-4 mr-2" />
            New Grow
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Grows */}
              <MetricCard
                title="Total Grows"
                value={stats.totalGrows}
                description={`${stats.activeGrows} active`}
                icon={<Sprout className="h-4 w-4" />}
              />

              {/* Total Plants */}
              <MetricCard
                title="Total Plants"
                value={stats.totalPlants}
                description="Across all grows"
                icon={<Leaf className="h-4 w-4" />}
              />

              {/* Active Plants */}
              <MetricCard
                title="Active Plants"
                value={stats.activePlants}
                description="Currently growing"
                icon={<Activity className="h-4 w-4" />}
              />

              {/* This Month */}
              <MetricCard
                title="This Month"
                value={
                  stats.recentPlants.filter((p) => {
                    const oneMonthAgo = new Date();
                    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                    return new Date(p.createdAt) > oneMonthAgo;
                  }).length
                }
                description="Plants added"
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>

            {/* Environmental Quality Indicators */}
            {analytics?.environmentalQuality && analytics.environmentalQuality.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Environmental Quality</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {analytics.environmentalQuality.map((indicator) => (
                    <MetricCard
                      key={indicator.parameter}
                      title={indicator.parameter.charAt(0).toUpperCase() + indicator.parameter.slice(1)}
                      value={`${indicator.currentValue}${indicator.unit}`}
                      description={
                        indicator.optimalMin && indicator.optimalMax
                          ? `Optimal: ${indicator.optimalMin}-${indicator.optimalMax}${indicator.unit}`
                          : undefined
                      }
                      icon={getEnvironmentalIcon(indicator.parameter)}
                      variant={getStatusVariant(indicator.status)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Plant Stage Distribution & Issue Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plant Stage Distribution */}
              {analytics?.plantStageDistribution && analytics.plantStageDistribution.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Plant Distribution by Stage</CardTitle>
                    <CardDescription>Breakdown of plants by growth stage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.plantStageDistribution.map((stage) => (
                        <div
                          key={stage.stage}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate(`/plants?stage=${stage.stage}`)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Badge variant={getStageColor(stage.stage)} className="capitalize">
                              {stage.stage}
                            </Badge>
                            <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${stage.percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium">{stage.count}</p>
                            <p className="text-xs text-muted-foreground">{stage.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Issue Tracking Summary */}
              {analytics?.issueTracking && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Issue Tracking</CardTitle>
                        <CardDescription>Recent issues and trends</CardDescription>
                      </div>
                      <Badge
                        variant={
                          analytics.issueTracking.trend === 'down'
                            ? 'success'
                            : analytics.issueTracking.trend === 'up'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {analytics.issueTracking.trend === 'down' && '↓'}
                        {analytics.issueTracking.trend === 'up' && '↑'}
                        {analytics.issueTracking.trend === 'stable' && '→'}
                        {' '}
                        {analytics.issueTracking.trend}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-lg bg-muted">
                          <p className="text-2xl font-bold">{analytics.issueTracking.totalIssues}</p>
                          <p className="text-xs text-muted-foreground mt-1">Total</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {analytics.issueTracking.unresolvedCount}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Unresolved</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {analytics.issueTracking.resolvedCount}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Resolved</p>
                        </div>
                      </div>

                      {analytics.issueTracking.recentIssues.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Recent Issues</h4>
                          {analytics.issueTracking.recentIssues.slice(0, 3).map((issue) => (
                            <div
                              key={issue.id}
                              className="flex items-start gap-2 p-2 rounded-lg border text-sm"
                            >
                              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium capitalize">
                                  {issue.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {issue.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Activity Feed */}
            {analytics?.recentActivities && analytics.recentActivities.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest activities across all grows</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/timeline')}
                    >
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentActivities.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          if (activity.plantId) {
                            navigate(`/plants/${activity.plantId}`);
                          } else {
                            navigate(`/grows/${activity.growId}`);
                          }
                        }}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="capitalize text-xs">
                              {activity.type.replace(/_/g, ' ')}
                            </Badge>
                            {activity.plantTag && (
                              <span className="text-xs font-medium">{activity.plantTag}</span>
                            )}
                          </div>
                          <p className="text-sm mt-1">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{activity.growName}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content Grid - Active Grows & Recent Plants */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Grows */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Grows</CardTitle>
                      <CardDescription>
                        Your currently active grow cycles
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/grows')}
                    >
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.activeGrowsList.length === 0 ? (
                    <div className="text-center py-8">
                      <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No active grows yet
                      </p>
                      <Button size="sm" onClick={() => navigate('/grows')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Start Your First Grow
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.activeGrowsList.map((grow) => (
                        <div
                          key={grow.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate(`/grows/${grow.id}`)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{grow.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Started {new Date(grow.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {plants?.filter((p) => p.growId === grow.id).length || 0} plants
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Plants */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Plants</CardTitle>
                      <CardDescription>
                        Recently added plants
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/plants')}
                    >
                      View All
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.recentPlants.length === 0 ? (
                    <div className="text-center py-8">
                      <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        No plants yet
                      </p>
                      <Button size="sm" onClick={() => navigate('/plants')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Plant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentPlants.map((plant) => (
                        <div
                          key={plant.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => navigate(`/plants/${plant.id}`)}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{plant.plantTag}</h4>
                            <p className="text-sm text-muted-foreground">
                              {plant.cultivarName || 'Unknown cultivar'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStageColor(plant.stage)} className="capitalize text-xs">
                              {plant.stage}
                            </Badge>
                            <Badge variant={getHealthStatusColor(plant.healthStatus)} className="capitalize text-xs">
                              {plant.healthStatus}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks to manage your grows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/grows')}
                  >
                    <Sprout className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold">Create New Grow</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Start tracking a new grow cycle
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/plants')}
                  >
                    <Leaf className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold">Add New Plant</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Add a plant to an existing grow
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/cultivars')}
                  >
                    <Activity className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold">Manage Cultivars</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      View and add strain information
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto flex-col items-start p-4"
                    onClick={() => navigate('/analytics')}
                  >
                    <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold">View Analytics</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Explore detailed analytics and charts
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}