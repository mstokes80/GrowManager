import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layouts/PageHeader';
import { useGrows } from '@/services/growsApi';
import { usePlants } from '@/services/plantsApi';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';

/**
 * DashboardPage - Main dashboard/home page
 * Shows overview of active grows, recent activity, and quick actions
 */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: grows, isLoading: growsLoading } = useGrows();
  const { data: plants, isLoading: plantsLoading } = usePlants();

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

  const isLoading = growsLoading || plantsLoading;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your grows and recent activity"
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Grows */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Grows
                  </CardTitle>
                  <Sprout className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalGrows}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeGrows} active
                  </p>
                </CardContent>
              </Card>

              {/* Total Plants */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Plants
                  </CardTitle>
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPlants}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all grows
                  </p>
                </CardContent>
              </Card>

              {/* Active Plants */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Plants
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activePlants}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently growing
                  </p>
                </CardContent>
              </Card>

              {/* Growth Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    This Month
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.recentPlants.filter((p) => {
                      const oneMonthAgo = new Date();
                      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                      return new Date(p.createdAt) > oneMonthAgo;
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Plants added
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
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
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                              {plant.stage}
                            </span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}