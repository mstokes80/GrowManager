import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlantsByGrow, useCreatePlant } from '@/services/plantsApi';
import { Plant, PlantStage, PlantStatus } from '@/types/plant';
import { PlantCard } from '@/components/plants/PlantCard';
import { PlantForm, PlantFormData } from '@/components/plants/PlantForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlantsTabProps {
  growId: string;
}

/**
 * PlantsTab - Display plants within a specific grow
 * Used in the GrowDetailPage tabs
 */
export function PlantsTab({ growId }: PlantsTabProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [plantToCopy, setPlantToCopy] = useState<Plant | null>(null);

  const { data: plants, isLoading, error, refetch } = usePlantsByGrow(growId);
  const createPlantMutation = useCreatePlant();

  // Filter and sort states
  const [stageFilter, setStageFilter] = useState<PlantStage | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<PlantStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'tag' | 'cultivar' | 'planted' | 'stage'>('planted');

  // Filter and sort plants
  const filteredAndSortedPlants = useMemo(() => {
    if (!plants) return [];

    let filtered = [...plants];

    // Apply stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(p => p.stage === stageFilter);
    }

    // Apply health filter
    if (healthFilter !== 'all') {
      filtered = filtered.filter(p => p.healthStatus === healthFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tag':
          return a.plantTag.localeCompare(b.plantTag);
        case 'cultivar':
          return (a.cultivarName || '').localeCompare(b.cultivarName || '');
        case 'planted':
          return new Date(b.plantedDate).getTime() - new Date(a.plantedDate).getTime();
        case 'stage':
          return a.stage.localeCompare(b.stage);
        default:
          return 0;
      }
    });

    return filtered;
  }, [plants, stageFilter, healthFilter, sortBy]);

  const handleCreatePlant = async (data: PlantFormData) => {
    try {
      const newPlant = await createPlantMutation.mutateAsync({
        growId,
        plantTag: data.plantTag,
        cultivarId: data.cultivarId || undefined,
        plantedDate: data.plantedDate,
        stage: data.stage,
        healthStatus: data.healthStatus,
        notes: data.notes || undefined,
      });

      toast({
        title: 'Success!',
        description: `Plant "${data.plantTag}" has been created.`,
      });

      setIsCreateDialogOpen(false);
      navigate(`/plants/${newPlant.id}`);
    } catch (error) {
      console.error('Failed to create plant:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create plant',
        description: 'An error occurred while creating the plant. Please try again.',
      });
    }
  };

  const handleCardClick = (plantId: string) => {
    navigate(`/plants/${plantId}`);
  };

  const handleCopyPlant = (plant: Plant) => {
    setPlantToCopy(plant);
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setPlantToCopy(null);
  };

  // Loading State
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load plants</p>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading plants.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (!plants || plants.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No plants yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Add your first plant to start tracking its progress.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Plant
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Plant Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Plant</DialogTitle>
            </DialogHeader>
            <PlantForm
              growId={growId}
              onSubmit={handleCreatePlant}
              onCancel={handleCloseDialog}
              isSubmitting={createPlantMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Plants List with Filters
  return (
    <>
      <div className="space-y-6">
        {/* Add Plant Button */}
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plant
          </Button>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="stage-filter" className="text-sm font-medium mb-2 block">
              Filter by Stage
            </Label>
            <Select
              value={stageFilter}
              onValueChange={(value) => setStageFilter(value as any)}
            >
              <SelectTrigger id="stage-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="seedling">Seedling</SelectItem>
                <SelectItem value="vegetative">Vegetative</SelectItem>
                <SelectItem value="flowering">Flowering</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="health-filter" className="text-sm font-medium mb-2 block">
              Filter by Status
            </Label>
            <Select
              value={healthFilter}
              onValueChange={(value) => setHealthFilter(value as any)}
            >
              <SelectTrigger id="health-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
                <SelectItem value="dead">Dead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="sort-by" className="text-sm font-medium mb-2 block">
              Sort By
            </Label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger id="sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planted">Planted Date</SelectItem>
                <SelectItem value="tag">Plant Tag</SelectItem>
                <SelectItem value="cultivar">Cultivar</SelectItem>
                <SelectItem value="stage">Stage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plants Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedPlants.length} of {plants.length} plants
        </p>

        {/* Plants Grid */}
        {filteredAndSortedPlants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPlants.map(plant => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onClick={() => handleCardClick(plant.id)}
                onCopy={handleCopyPlant}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">No plants match the current filters</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Copy Plant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{plantToCopy ? 'Copy Plant' : 'Add New Plant'}</DialogTitle>
          </DialogHeader>
          <PlantForm
            plant={plantToCopy || undefined}
            growId={growId}
            onSubmit={handleCreatePlant}
            onCancel={handleCloseDialog}
            isSubmitting={createPlantMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}