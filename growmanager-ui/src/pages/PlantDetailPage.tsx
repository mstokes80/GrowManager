import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlant, useUpdatePlant, useDeletePlant, useCreatePlant } from '@/services/plantsApi';
import {
  useFeedingEventsByPlant,
  useCreateFeedingEvent,
} from '@/services/feedingEventsApi';
import {
  useActivityLogsByPlant,
  useCreateActivityLog,
} from '@/services/activityLogsApi';
import {
  useObservationsByPlant,
  useCreateObservation,
  useUpdateObservation,
  useDeleteObservation,
} from '@/services/observationsApi';
import { useCreateHarvest } from '@/services/harvestsApi';
import { PageHeader } from '@/components/layouts/PageHeader';
import { PlantForm, PlantFormData } from '@/components/plants/PlantForm';
import { LogFeedingForm, LogFeedingFormData } from '@/components/plants/LogFeedingForm';
import { LogActivityForm, LogActivityFormData } from '@/components/plants/LogActivityForm';
import { ActivityTimeline } from '@/components/plants/ActivityTimeline';
import {
  CreateObservationForm,
  EditObservationForm,
  ObservationDetailModal,
  PhotoGallery,
} from '@/components/observations';
import { CreateHarvestForm, CreateHarvestFormData } from '@/components/harvests/CreateHarvestForm';
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
  Camera,
  Images,
  Copy,
  Scale,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Observation } from '@/types/observation';
import { parseLocalDate } from '@/utils/dateUtils';

/**
 * PlantDetailPage - Display detailed information about a specific plant
 * Implements Task Group 6.4.3 and integrates timeline and forms
 */
export default function PlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFeedingDialogOpen, setIsFeedingDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isObservationDialogOpen, setIsObservationDialogOpen] = useState(false);
  const [isEditObservationDialogOpen, setIsEditObservationDialogOpen] = useState(false);
  const [isHarvestDialogOpen, setIsHarvestDialogOpen] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  const { data: plant, isLoading, error } = usePlant(id || '');
  const { data: feedingEvents = [], isLoading: feedingLoading } = useFeedingEventsByPlant(
    id || ''
  );
  const { data: activityLogs = [], isLoading: activityLoading } = useActivityLogsByPlant(
    id || ''
  );
  const { data: observations = [], isLoading: observationsLoading } = useObservationsByPlant(
    id || ''
  );

  const updatePlantMutation = useUpdatePlant();
  const deletePlantMutation = useDeletePlant();
  const createPlantMutation = useCreatePlant();
  const createFeedingEventMutation = useCreateFeedingEvent();
  const createActivityLogMutation = useCreateActivityLog();
  const createObservationMutation = useCreateObservation();
  const updateObservationMutation = useUpdateObservation();
  const deleteObservationMutation = useDeleteObservation();
  const createHarvestMutation = useCreateHarvest();

  const handleUpdatePlant = async (data: PlantFormData) => {
    if (!id) return;

    try {
      await updatePlantMutation.mutateAsync({
        id,
        data: {
          plantTag: data.plantTag,
          cultivarId: data.cultivarId || undefined,
          stage: data.stage,
          healthStatus: data.healthStatus, // PlantStatus directly, no mapping needed
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

  const handleCopyPlant = async (data: PlantFormData) => {
    if (!plant) return;

    try {
      const newPlant = await createPlantMutation.mutateAsync({
        growId: plant.growId,
        plantTag: data.plantTag,
        cultivarId: data.cultivarId || undefined,
        plantedDate: data.plantedDate,
        stage: data.stage,
        healthStatus: data.healthStatus, // PlantStatus directly, no mapping needed
        notes: data.notes || undefined,
      });

      toast({
        title: 'Success!',
        description: `Plant "${data.plantTag}" has been created as a copy.`,
      });

      setIsCopyDialogOpen(false);
      navigate(`/plants/${newPlant.id}`);
    } catch (error) {
      console.error('Failed to copy plant:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to copy plant',
        description: 'An error occurred while copying the plant. Please try again.',
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
        amendments: data.amendments || undefined,
        notes: data.notes || undefined,
        fedAt: data.fedAt,
        applyToAllPlants: data.applyToAllPlants,
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

  const handleObservationClick = (observation: Observation) => {
    setSelectedObservation(observation);
  };

  const handleCreateObservation = async (formData: any, files: File[]) => {
    if (!id) return;

    try {
      // Parse tags from comma-separated string to array
      const tags = formData.tags
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];

      // Add :00 seconds to timestamp if not present
      const timestamp = formData.timestamp.includes(':')
        ? formData.timestamp.length === 16
          ? `${formData.timestamp}:00`
          : formData.timestamp
        : formData.timestamp;

      await createObservationMutation.mutateAsync({
        plantId: id,
        data: {
          timestamp,
          note: formData.note,
          observationType: formData.observationType,
          tags,
        },
        files,
      });

      toast({
        title: 'Success!',
        description: 'Observation has been created.',
      });

      setIsObservationDialogOpen(false);
    } catch (error) {
      console.error('Failed to create observation:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create observation',
        description: 'An error occurred while creating the observation. Please try again.',
      });
    }
  };

  const handleEditObservation = (observation: Observation) => {
    setSelectedObservation(observation);
    setIsEditObservationDialogOpen(true);
  };

  const handleUpdateObservation = async (
    formData: any,
    newFiles: File[],
    photosToRemove: string[]
  ) => {
    if (!selectedObservation) return;

    try {
      const tags = formData.tags
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];

      const timestamp = formData.timestamp.includes(':')
        ? formData.timestamp.length === 16
          ? `${formData.timestamp}:00`
          : formData.timestamp
        : formData.timestamp;

      await updateObservationMutation.mutateAsync({
        id: selectedObservation.id,
        data: {
          timestamp,
          note: formData.note,
          observationType: formData.observationType,
          tags,
        },
        files: newFiles.length > 0 ? newFiles : undefined,
        photosToRemove: photosToRemove.length > 0 ? photosToRemove : undefined,
      });

      toast({
        title: 'Success!',
        description: 'Observation has been updated.',
      });

      setIsEditObservationDialogOpen(false);
      setSelectedObservation(null);
    } catch (error) {
      console.error('Failed to update observation:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update observation',
        description: 'An error occurred while updating the observation. Please try again.',
      });
    }
  };

  const handleDeleteObservation = async () => {
    if (!selectedObservation) return;

    try {
      await deleteObservationMutation.mutateAsync(selectedObservation.id);

      toast({
        title: 'Deleted',
        description: 'Observation has been deleted successfully.',
      });

      setSelectedObservation(null);
    } catch (error) {
      console.error('Failed to delete observation:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete observation',
        description: 'An error occurred while deleting the observation. Please try again.',
      });
    }
  };

  const handleCreateHarvest = async (data: CreateHarvestFormData) => {
    if (!id) return;

    try {
      // Convert empty strings to undefined for optional numeric fields
      const harvestData = {
        ...data,
        dryWeight: data.dryWeight === '' ? undefined : data.dryWeight,
        thcPercent: data.thcPercent === '' ? undefined : data.thcPercent,
        cbdPercent: data.cbdPercent === '' ? undefined : data.cbdPercent,
        qualityRating: data.qualityRating === '' ? undefined : data.qualityRating,
      };

      await createHarvestMutation.mutateAsync({
        plantId: id,
        data: harvestData,
      });

      toast({
        title: 'Success!',
        description: 'Harvest has been logged. Plant status updated to "Harvested".',
      });

      setIsHarvestDialogOpen(false);
    } catch (error) {
      console.error('Failed to create harvest:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to log harvest',
        description: 'An error occurred while logging the harvest. Please try again.',
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

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    if (date) {
      return format(date, 'MMM dd, yyyy');
    }
    return 'Date unavailable';
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={plant.plantTag}
        showBackButton
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsObservationDialogOpen(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Observation</span>
              <span className="sm:hidden">Observe</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFeedingDialogOpen(true)}
            >
              <Droplets className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Log Feeding</span>
              <span className="sm:hidden">Feed</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsActivityDialogOpen(true)}
            >
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Log Activity</span>
              <span className="sm:hidden">Activity</span>
            </Button>
            {(plant.stage === 'flowering' || plant.stage === 'harvested') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsHarvestDialogOpen(true)}
              >
                <Scale className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Log Harvest</span>
                <span className="sm:hidden">Harvest</span>
              </Button>
            )}
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
                <DropdownMenuItem onClick={() => setIsCopyDialogOpen(true)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Plant
                </DropdownMenuItem>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="observations">Observations</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
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

            <TabsContent value="observations" className="mt-6">
              {observationsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : observations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No observations yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start documenting your plant's progress
                    </p>
                    <Button onClick={() => setIsObservationDialogOpen(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Add Observation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {observations.map((observation) => (
                    <Card
                      key={observation.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleObservationClick(observation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {observation.photos.length > 0 && observation.photos[0] && (
                            <div className="flex-shrink-0">
                              <img loading="lazy" decoding="async"
                                src={observation.photos[0].thumbnailUrl}
                                alt="Observation"
                                className="w-20 h-20 object-cover rounded"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="capitalize">
                                {observation.observationType.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(observation.timestamp), 'PPp')}
                              </span>
                            </div>
                            {observation.note && (
                              <p className="text-sm line-clamp-2">{observation.note}</p>
                            )}
                            {observation.photos.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                <Images className="h-3 w-3 inline mr-1" />
                                {observation.photos.length} photos
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-6">
              <PhotoGallery
                observations={observations}
                isLoading={observationsLoading}
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

      {/* Create Observation Dialog */}
      <Dialog open={isObservationDialogOpen} onOpenChange={setIsObservationDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Observation</DialogTitle>
          </DialogHeader>
          <CreateObservationForm
            plantId={id || ''}
            onSubmit={handleCreateObservation}
            onCancel={() => setIsObservationDialogOpen(false)}
            isSubmitting={createObservationMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Copy Plant Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Copy Plant</DialogTitle>
          </DialogHeader>
          <PlantForm
            plant={plant}
            growId={plant.growId}
            onSubmit={handleCopyPlant}
            onCancel={() => setIsCopyDialogOpen(false)}
            isSubmitting={createPlantMutation.isPending}
            isCopyMode={true}
          />
        </DialogContent>
      </Dialog>

      {/* Observation Detail Modal */}
      <ObservationDetailModal
        observation={selectedObservation}
        open={!!selectedObservation}
        onClose={() => setSelectedObservation(null)}
        onEdit={() => handleEditObservation(selectedObservation!)}
        onDelete={handleDeleteObservation}
        isDeletingObservation={deleteObservationMutation.isPending}
      />

      {/* Edit Observation Dialog */}
      {selectedObservation && (
        <Dialog open={isEditObservationDialogOpen} onOpenChange={setIsEditObservationDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Observation</DialogTitle>
            </DialogHeader>
            <EditObservationForm
              observation={selectedObservation}
              onSubmit={handleUpdateObservation}
              onCancel={() => setIsEditObservationDialogOpen(false)}
              isSubmitting={updateObservationMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Log Harvest Dialog */}
      <Dialog open={isHarvestDialogOpen} onOpenChange={setIsHarvestDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Harvest</DialogTitle>
          </DialogHeader>
          <CreateHarvestForm
            plantId={id || ''}
            onSubmit={handleCreateHarvest}
            onCancel={() => setIsHarvestDialogOpen(false)}
            isSubmitting={createHarvestMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}