import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGrow,
  useUpdateGrow,
  useArchiveGrow,
  useUnarchiveGrow,
  useDeleteGrow,
  Grow,
} from '@/services/growsApi';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GrowForm, GrowFormData } from '@/components/grows/GrowForm';
import { DeleteGrowDialog } from '@/components/grows/DeleteGrowDialog';
import { GrowTabs } from '@/components/grows/GrowTabs';
import { Edit, MoreVertical, Archive, ArchiveRestore, Trash2, Loader2, AlertCircle, Sprout, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateUtils';

/**
 * GrowDetailPage - Display detailed information about a specific grow
 * Implements Task Group 5.2.6
 */
export default function GrowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: grow, isLoading, error } = useGrow(id || '');
  const updateGrowMutation = useUpdateGrow();
  const archiveGrowMutation = useArchiveGrow();
  const unarchiveGrowMutation = useUnarchiveGrow();
  const deleteGrowMutation = useDeleteGrow();

  const getStatusColor = (
    status: Grow['status']
  ): 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'destructive' => {
    switch (status) {
      case 'planning':
        return 'secondary';
      case 'active':
        return 'success';
      case 'flowering':
        return 'info';
      case 'drying':
        return 'warning';
      case 'completed':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getEnvironmentTypeBadgeColor = (
    type: Grow['environmentType']
  ): 'default' | 'secondary' | 'success' | 'warning' | 'info' => {
    switch (type) {
      case 'indoor':
        return 'info';
      case 'outdoor':
        return 'success';
      case 'greenhouse':
        return 'warning';
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

  const handleUpdateGrow = async (data: GrowFormData) => {
    if (!id) return;

    try {
      // Transform tags from comma-separated string to array
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : undefined;

      // Transform microbe inoculants from comma-separated string to array
      const microbeInoculants = data.microbeInoculants
        ? data.microbeInoculants.split(',').map((item) => item.trim()).filter((item) => item.length > 0)
        : undefined;

      await updateGrowMutation.mutateAsync({
        id,
        data: {
          name: data.name,
          status: data.status,
          environmentType: data.environmentType,
          notes: data.notes || undefined,
          lightingType: data.lightingType || undefined,
          mediumType: data.mediumType || undefined,
          location: data.location || undefined,
          targetTempMin: data.targetTempMin || undefined,
          targetTempMax: data.targetTempMax || undefined,
          targetHumidityMin: data.targetHumidityMin || undefined,
          targetHumidityMax: data.targetHumidityMax || undefined,
          expectedHarvestDate: data.expectedHarvestDate || undefined,
          canopySquareFt: data.canopySquareFt || undefined,
          vegetativeDate: data.vegetativeDate || undefined,
          flowerDate: data.flowerDate || undefined,
          lights: data.lights && data.lights.length > 0 ? data.lights : undefined,
          tempUom: data.tempUom || undefined,
          tags,
          // Organic growing fields
          isOrganic: data.isOrganic,
          soilSource: data.soilSource || undefined,
          soilTexture: data.soilTexture || undefined,
          organicMatterPercent: data.organicMatterPercent || undefined,
          baseNutrientProfile: data.baseNutrientProfile || undefined,
          soilReusedCycles: data.soilReusedCycles || undefined,
          mycorrhizaeAdded: data.mycorrhizaeAdded,
          microbeInoculants,
          coverCropType: data.coverCropType || undefined,
          mulchType: data.mulchType || undefined,
          compostReused: data.compostReused,
        },
      });

      toast({
        title: 'Success!',
        description: `Grow "${data.name}" has been updated.`,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update grow:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update grow',
        description: 'An error occurred while updating the grow. Please try again.',
      });
    }
  };

  const handleArchiveGrow = async () => {
    if (!id || !grow) return;

    try {
      await archiveGrowMutation.mutateAsync(id);

      toast({
        title: 'Archived',
        description: `Grow "${grow.name}" has been archived.`,
      });
    } catch (error) {
      console.error('Failed to archive grow:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to archive grow',
        description: 'An error occurred while archiving the grow. Please try again.',
      });
    }
  };

  const handleUnarchiveGrow = async () => {
    if (!id || !grow) return;

    try {
      await unarchiveGrowMutation.mutateAsync(id);

      toast({
        title: 'Unarchived',
        description: `Grow "${grow.name}" has been unarchived.`,
      });
    } catch (error) {
      console.error('Failed to unarchive grow:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to unarchive grow',
        description: 'An error occurred while unarchiving the grow. Please try again.',
      });
    }
  };

  const handleDeleteGrow = async () => {
    if (!id) return;

    try {
      await deleteGrowMutation.mutateAsync(id);

      toast({
        title: 'Deleted',
        description: 'Grow has been deleted successfully.',
      });

      navigate('/grows');
    } catch (error) {
      console.error('Failed to delete grow:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete grow',
        description: 'An error occurred while deleting the grow. Please try again.',
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
  if (error || !grow) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Error" showBackButton />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load grow</p>
            <p className="text-sm text-muted-foreground">
              The grow you're looking for could not be found.
            </p>
            <Button onClick={() => navigate('/grows')}>Back to Grows</Button>
          </div>
        </div>
      </div>
    );
  }

  const plantCount = grow.plantCount || 0;
  const plantCountText = plantCount === 0 ? 'No plants' : `${plantCount} ${plantCount === 1 ? 'plant' : 'plants'}`;

  // Overview content for tabs
  const overviewContent = (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sprout className="h-6 w-6 text-green-600" />
            <CardTitle>Basic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
            <p className="text-lg font-semibold">{grow.name}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
            <Badge variant={getStatusColor(grow.status)} className="capitalize">
              {grow.status}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Start Date</p>
            <p>{formatDate(grow.startDate)}</p>
          </div>

          {grow.endDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">End Date</p>
              <p>{formatDate(grow.endDate)}</p>
            </div>
          )}

          {grow.expectedHarvestDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Expected Harvest Date</p>
              <p>{formatDate(grow.expectedHarvestDate)}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Plant Count</p>
            <p>{plantCountText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Planning Card */}
      {(grow.canopySquareFt !== undefined || grow.vegetativeDate || grow.flowerDate) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <CardTitle>Planning</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {grow.canopySquareFt !== undefined && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Canopy Size</p>
                <p>{grow.canopySquareFt} sq ft</p>
              </div>
            )}

            {grow.vegetativeDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Vegetative Phase Start</p>
                <p>{formatDate(grow.vegetativeDate)}</p>
              </div>
            )}

            {grow.flowerDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Flowering Phase Start</p>
                <p>{formatDate(grow.flowerDate)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Environment Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Environment Type</p>
            <Badge variant={getEnvironmentTypeBadgeColor(grow.environmentType)} className="capitalize">
              {grow.environmentType}
            </Badge>
          </div>

          {grow.lightingType && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Lighting Type</p>
              <p className="capitalize">{grow.lightingType}</p>
            </div>
          )}

          {grow.lights && grow.lights.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Light Equipment</p>
              <div className="space-y-2 mt-2">
                {grow.lights.map((light, index) => (
                  <div key={index} className="flex justify-between items-center p-2 border rounded-md bg-muted/30">
                    <span className="font-medium">{light.name}</span>
                    <span className="text-sm text-muted-foreground">{light.wattage}W</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {grow.mediumType && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Growing Medium</p>
              <p className="capitalize">{grow.mediumType}</p>
            </div>
          )}

          {grow.location && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
              <p>{grow.location}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Environmental Ranges Card */}
      {(grow.targetTempMin !== undefined || grow.targetTempMax !== undefined ||
        grow.targetHumidityMin !== undefined || grow.targetHumidityMax !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle>Target Environmental Ranges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(grow.targetTempMin !== undefined || grow.targetTempMax !== undefined) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Temperature Range</p>
                <p>
                  {grow.targetTempMin !== undefined ? `${grow.targetTempMin}°${grow.tempUom || 'C'}` : '—'}
                  {' to '}
                  {grow.targetTempMax !== undefined ? `${grow.targetTempMax}°${grow.tempUom || 'C'}` : '—'}
                </p>
              </div>
            )}

            {(grow.targetHumidityMin !== undefined || grow.targetHumidityMax !== undefined) && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Humidity Range</p>
                <p>
                  {grow.targetHumidityMin !== undefined ? `${grow.targetHumidityMin}%` : '—'}
                  {' to '}
                  {grow.targetHumidityMax !== undefined ? `${grow.targetHumidityMax}%` : '—'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Organic Growing Card */}
      {grow.isOrganic && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Organic Growing</CardTitle>
              <Badge variant="success" className="ml-2">Organic</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Soil Characteristics */}
            {(grow.soilSource || grow.soilTexture || grow.organicMatterPercent !== undefined || grow.baseNutrientProfile) && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Soil Characteristics</p>

                {grow.soilSource && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Soil Source</p>
                    <p>{grow.soilSource}</p>
                  </div>
                )}

                {grow.soilTexture && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Soil Texture</p>
                    <p className="capitalize">{grow.soilTexture}</p>
                  </div>
                )}

                {grow.organicMatterPercent !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Organic Matter</p>
                    <p>{grow.organicMatterPercent}%</p>
                  </div>
                )}

                {grow.baseNutrientProfile && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Base Nutrient Profile</p>
                    <p>{grow.baseNutrientProfile}</p>
                  </div>
                )}
              </div>
            )}

            {/* Soil Reuse */}
            {grow.soilReusedCycles !== undefined && grow.soilReusedCycles > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Soil Reuse</p>
                <p>{grow.soilReusedCycles} {grow.soilReusedCycles === 1 ? 'cycle' : 'cycles'}</p>
              </div>
            )}

            {/* Beneficial Biology */}
            {(grow.mycorrhizaeAdded || (grow.microbeInoculants && grow.microbeInoculants.length > 0)) && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Beneficial Biology</p>

                {grow.mycorrhizaeAdded && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Mycorrhizae Added</Badge>
                  </div>
                )}

                {grow.microbeInoculants && grow.microbeInoculants.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Microbe Inoculants</p>
                    <div className="flex flex-wrap gap-2">
                      {grow.microbeInoculants.map((inoculant, index) => (
                        <Badge key={index} variant="secondary">
                          {inoculant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cover Crops & Mulching */}
            {(grow.coverCropType || grow.mulchType) && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Cover Crops & Mulching</p>

                {grow.coverCropType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Cover Crop</p>
                    <p className="capitalize">{grow.coverCropType}</p>
                  </div>
                )}

                {grow.mulchType && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Mulch Type</p>
                    <p className="capitalize">{grow.mulchType}</p>
                  </div>
                )}
              </div>
            )}

            {/* Compost Reuse */}
            {grow.compostReused && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Compost Reused</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tags Card */}
      {grow.tags && grow.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {grow.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Card */}
      {grow.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{grow.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>Created: {new Date(grow.createdAt).toLocaleString()}</p>
        <p>Last updated: {new Date(grow.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={grow.name}
        showBackButton
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/grows/${id}/timeline`)}>
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View Timeline</span>
              <span className="sm:hidden">Timeline</span>
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
                {grow.isArchived ? (
                  <DropdownMenuItem onClick={handleUnarchiveGrow}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Unarchive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleArchiveGrow}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                {grow.isArchived && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <GrowTabs overviewContent={overviewContent} growId={id || ''} />
        </div>
      </div>

      {/* Edit Grow Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Grow</DialogTitle>
          </DialogHeader>
          <GrowForm
            grow={grow}
            onSubmit={handleUpdateGrow}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={updateGrowMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteGrowDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteGrow}
        growName={grow.name}
        isDeleting={deleteGrowMutation.isPending}
      />
    </div>
  );
}