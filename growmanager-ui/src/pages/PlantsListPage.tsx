import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlantsByGrow, useCreatePlant } from '@/services/plantsApi';
import { useGrows } from '@/services/growsApi';
import { PlantStage, HealthStatus } from '@/types/plant';
import { PageHeader } from '@/components/layouts/PageHeader';
import { PlantCard } from '@/components/plants/PlantCard';
import { PlantForm, PlantFormData } from '@/components/plants/PlantForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, AlertCircle, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * PlantsListPage - Display list of plants with filtering and sorting
 * Implements Task Group 6.4.1
 */
export function PlantsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get selected grow from URL or default to first active grow
  const { data: grows } = useGrows();
  const selectedGrowId = searchParams.get('grow') || grows?.find(g => !g.isArchived)?.id || '';

  const { data: plants, isLoading, error, refetch } = usePlantsByGrow(selectedGrowId);
  const createPlantMutation = useCreatePlant();

  // Filter and sort states
  const [stageFilter, setStageFilter] = useState<PlantStage | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<HealthStatus | 'all'>('all');
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

  const handleGrowChange = (growId: string) => {
    setSearchParams({ grow: growId });
  };

  const handleCreatePlant = async (data: PlantFormData) => {
    if (!selectedGrowId) {
      toast({
        variant: 'destructive',
        title: 'No Grow Selected',
        description: 'Please select a grow first.',
      });
      return;
    }

    try {
      const newPlant = await createPlantMutation.mutateAsync({
        growId: selectedGrowId,
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

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Plants"
        subtitle="Track your plants and their progress"
        actions={
          <Button
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={!selectedGrowId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Plant
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Grow Selector */}
        {grows && grows.length > 0 && (
          <div className="mb-6">
            <Label htmlFor="grow-select" className="text-sm font-medium mb-2 block">
              Select Grow
            </Label>
            <Select value={selectedGrowId} onValueChange={handleGrowChange}>
              <SelectTrigger id="grow-select" className="max-w-md">
                <SelectValue placeholder="Select a grow" />
              </SelectTrigger>
              <SelectContent>
                {grows
                  .filter(g => !g.isArchived)
                  .map(grow => (
                    <SelectItem key={grow.id} value={grow.id}>
                      {grow.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filters and Sorting */}
        {selectedGrowId && !isLoading && plants && plants.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-4">
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
                Filter by Health
              </Label>
              <Select
                value={healthFilter}
                onValueChange={(value) => setHealthFilter(value as any)}
              >
                <SelectTrigger id="health-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health Statuses</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="stressed">Stressed</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
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
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load plants</p>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading your plants.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {/* No Grow Selected */}
        {!selectedGrowId && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="rounded-full bg-muted p-4">
              <Leaf className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No grow selected</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Please select a grow to view its plants.
            </p>
          </div>
        )}

        {/* Empty State */}
        {selectedGrowId && !isLoading && !error && plants && plants.length === 0 && (
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
        )}

        {/* Plants Grid */}
        {!isLoading && !error && filteredAndSortedPlants.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAndSortedPlants.length} of {plants?.length || 0} plants
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedPlants.map(plant => (
                <PlantCard
                  key={plant.id}
                  plant={plant}
                  onClick={() => handleCardClick(plant.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Plant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Plant</DialogTitle>
          </DialogHeader>
          <PlantForm
            growId={selectedGrowId}
            onSubmit={handleCreatePlant}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createPlantMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import Label component
import { Label } from '@/components/ui/label';