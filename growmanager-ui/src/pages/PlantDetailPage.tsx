import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlant, useUpdatePlant, useDeletePlant } from '@/services/plantsApi';
import {
  useFeedingEventsByPlant,
  useCreateFeedingEvent,
} from '@/services/feedingEventsApi';
import {
  useActivityLogsByPlant,
  useCreateActivityLog,
} from '@/services/activityLogsApi';
import { PageHeader } from '@/components/layouts/PageHeader';
import { PlantForm, PlantFormData } from '@/components/plants/PlantForm';
import { LogFeedingForm, LogFeedingFormData } from '@/components/plants/LogFeedingForm';
import { LogActivityForm, LogActivityFormData } from '@/components/plants/LogActivityForm';
import { ActivityTimeline } from '@/components/plants/ActivityTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Edit,
  MoreVertical,
  Trash2,
  Loader2,
  AlertCircle,
  Leaf,
  Droplets,
  Activity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

/**
 * PlantDetailPage - Display detailed information about a specific plant
 * Implements Task Group 6.4.3 and integrates timeline and forms
 */
export function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFeedingDialogOpen, setIsFeedingDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  const { data: plant, isLoading, error } = usePlant(id || '');
  const { data: feedingEvents = [], isLoading: feedingLoading } = useFeedingEventsByPlant(
    id || ''
  );
  const { data: activityLogs = [], isLoading: activityLoading } = useActivityLogsByPlant(
    id || ''
  );

  const updatePlantMutation = useUpdatePlant();
  const deletePlantMutation = useDeletePlant();
  const createFeedingEventMutation = useCreateFeedingEvent();
  const createActivityLogMutation = useCreateActivityLog();

  const handleUpdatePlant = async (data: PlantFormData) => {
    if (!id) return;

    try {
      await updatePlantMutation.mutateAsync({
        id,
        data: {
          plantTag: data.plantTag,
          cultivarId: data.cultivarId || undefined,
          stage: data.stage,
          healthStatus: data.healthStatus,
          notes: data.notes || undefined,
        },
      });

      toast({
        title: 'Success!',
        description: `Plant "${data.plantTag}" has been updated.`,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update plant:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update plant',
        description: 'An error occurred while updating the plant. Please try again.',
      });
    }
  };

  const handleDeletePlant = async () => {
    if (!id) return;

    try {
      await deletePlantMutation.mutateAsync(id);

      toast({
        title: 'Deleted',
        description: 'Plant has been deleted successfully.',
      });

      navigate('/plants');
    } catch (error) {
      console.error('Failed to delete plant:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete plant',
        description: 'An error occurred while deleting the plant. Please try again.',
      });
    }
  };

  const handleLogFeeding = async (data: LogFeedingFormData) => {
    if (!id) return;

    try {
      await createFeedingEventMutation.mutateAsync({
        plantId: id,
        feedingType: data.feedingType,
        amountMl: data.amountMl,
        ecLevel: data.ecLevel || undefined,
        phLevel: data.phLevel || undefined,
        nutrientMix: data.nutrientMix || undefined,
        notes: data.notes || undefined,
        fedAt: data.fedAt,
      });

      toast({
        title: 'Success!',
        description: 'Feeding event has been logged.',
      });

      setIsFeedingDialogOpen(false);
    } catch (error) {
      console.error('Failed to log feeding:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to log feeding',
        description: 'An error occurred while logging the feeding. Please try again.',
      });
    }
  };

  const handleLogActivity = async (data: LogActivityFormData) => {
    if (!id) return;

    try {
      await createActivityLogMutation.mutateAsync({
        plantId: id,
        activityType: data.activityType,
        description: data.description,
        notes: data.notes || undefined,
        loggedAt: data.loggedAt,
        applyToAllPlants: data.applyToAllPlants,
      });

      toast({
        title: 'Success!',
        description: 'Activity has been logged.',
      });

      setIsActivityDialogOpen(false);
    } catch (error) {
      console.error('Failed to log activity:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to log activity',
        description: 'An error occurred while logging the activity. Please try again.',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Loading..." showBackButton />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !plant) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Error" showBackButton />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load plant</p>
            <p className="text-sm text-muted-foreground">
              The plant you're looking for could not be found.
            </p>
            <Button onClick={() => navigate('/plants')}>Back to Plants</Button>
          </div>
        </div>
      </div>
    );
  }

  const getStageColor = (stage: string) => {
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

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'stressed':
        return 'warning';
      case 'sick':
      case 'dead':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Date unavailable';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={plant.plantTag}
        showBackButton
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFeedingDialogOpen(true)}
            >
              <Droplets className="h-4 w-4 mr-2" />
              Log Feeding
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsActivityDialogOpen(true)}
            >
              <Activity className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                {/* Basic Information Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Leaf className="h-6 w-6 text-green-600" />
                      <CardTitle>Plant Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Plant Tag</p>
                      <p className="text-lg font-semibold">{plant.plantTag}</p>
                    </div>

                    {plant.cultivarName && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Cultivar</p>
                        <p>{plant.cultivarName}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Stage</p>
                      <Badge variant={getStageColor(plant.stage) as any} className="capitalize">
                        {plant.stage}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Health Status
                      </p>
                      <Badge
                        variant={getHealthStatusColor(plant.healthStatus) as any}
                        className="capitalize"
                      >
                        {plant.healthStatus}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Planted Date
                      </p>
                      <p>{formatDate(plant.plantedDate)}</p>
                    </div>

                    {plant.harvestedDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Harvested Date
                        </p>
                        <p>{formatDate(plant.harvestedDate)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes Card */}
                {plant.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{plant.notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {new Date(plant.createdAt).toLocaleString()}</p>
                  <p>Last updated: {new Date(plant.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <ActivityTimeline
                feedingEvents={feedingEvents}
                activityLogs={activityLogs}
                isLoading={feedingLoading || activityLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Plant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
          </DialogHeader>
          <PlantForm
            plant={plant}
            growId={plant.growId}
            onSubmit={handleUpdatePlant}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={updatePlantMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Log Feeding Dialog */}
      <Dialog open={isFeedingDialogOpen} onOpenChange={setIsFeedingDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Feeding/Watering</DialogTitle>
          </DialogHeader>
          <LogFeedingForm
            plantId={id || ''}
            onSubmit={handleLogFeeding}
            onCancel={() => setIsFeedingDialogOpen(false)}
            isSubmitting={createFeedingEventMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Log Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Training/Maintenance</DialogTitle>
          </DialogHeader>
          <LogActivityForm
            plantId={id || ''}
            onSubmit={handleLogActivity}
            onCancel={() => setIsActivityDialogOpen(false)}
            isSubmitting={createActivityLogMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete plant "{plant.plantTag}" and all associated feeding
              events and activity logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePlantMutation.isPending}
            >
              {deletePlantMutation.isPending ? 'Deleting...' : 'Delete Plant'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}