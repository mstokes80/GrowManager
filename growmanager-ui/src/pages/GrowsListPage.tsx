import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrows, useCreateGrow, useUpdateGrowSortOrder } from '@/services/growsApi';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GrowCard } from '@/components/grows/GrowCard';
import { SortableGrowCard } from '@/components/grows/SortableGrowCard';
import { GrowForm, GrowFormData } from '@/components/grows/GrowForm';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

/**
 * GrowsListPage - Display list of user's grows (active and archived)
 * Implements Task Group 5.2.3
 */
export default function GrowsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: grows, isLoading, error, refetch } = useGrows();
  const createGrowMutation = useCreateGrow();
  const updateSortOrderMutation = useUpdateGrowSortOrder();

  // Configure drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Separate active and archived grows, sorted by sortOrder
  const { activeGrows, archivedGrows } = useMemo(() => {
    if (!grows) return { activeGrows: [], archivedGrows: [] };

    const active = grows
      .filter((grow) => !grow.isArchived)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const archived = grows
      .filter((grow) => grow.isArchived)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return { activeGrows: active, archivedGrows: archived };
  }, [grows]);

  const handleCreateGrow = async (data: GrowFormData) => {
    try {
      // Transform tags from comma-separated string to array
      const tags = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : undefined;

      const newGrow = await createGrowMutation.mutateAsync({
        name: data.name,
        startDate: data.startDate,
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
        tags,
      });

      toast({
        title: 'Success!',
        description: `Grow "${data.name}" has been created.`,
      });

      setIsCreateDialogOpen(false);
      navigate(`/grows/${newGrow.id}`);
    } catch (error) {
      console.error('Failed to create grow:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create grow',
        description: 'An error occurred while creating the grow. Please try again.',
      });
    }
  };

  const handleCardClick = (growId: string) => {
    navigate(`/grows/${growId}`);
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Refreshed',
      description: 'Grows list has been updated.',
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = activeGrows.findIndex((grow) => grow.id === active.id);
    const newIndex = activeGrows.findIndex((grow) => grow.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update the UI
    const newOrder = arrayMove(activeGrows, oldIndex, newIndex);

    try {
      // Update sort order in the database
      await updateSortOrderMutation.mutateAsync({
        items: newOrder.map((grow, index) => ({
          id: grow.id,
          sortOrder: index,
        })),
      });

      toast({
        title: 'Sort order updated',
        description: 'Grows have been reordered.',
      });
    } catch (error) {
      console.error('Failed to update sort order:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update sort order',
        description: 'An error occurred while reordering grows. Please try again.',
      });
      // Refetch to restore original order on error
      refetch();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Grows"
        subtitle="Track your cultivation cycles"
        actions={
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
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

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load grows</p>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading your grows.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {/* Empty State - No grows at all */}
        {!isLoading && !error && activeGrows.length === 0 && archivedGrows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No grows yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Create your first grow to start tracking your cultivation cycle.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Grow
            </Button>
          </div>
        )}

        {/* Active Grows Section */}
        {!isLoading && !error && (activeGrows.length > 0 || archivedGrows.length > 0) && (
          <div className="space-y-6">
            {/* Active Grows */}
            {activeGrows.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Active Grows</h2>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeGrows.map((g) => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      {activeGrows.map((grow) => (
                        <SortableGrowCard
                          key={grow.id}
                          grow={grow}
                          onClick={() => handleCardClick(grow.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* Empty state for active grows */}
            {activeGrows.length === 0 && archivedGrows.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Active Grows</h2>
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No active grows</p>
                  <Button
                    variant="link"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="mt-2"
                  >
                    Create a new grow
                  </Button>
                </div>
              </div>
            )}

            {/* Archived Grows Section - Collapsible */}
            {archivedGrows.length > 0 && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="archived">
                  <AccordionTrigger className="text-lg font-semibold">
                    Archived Grows ({archivedGrows.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-4 pt-4">
                      {archivedGrows.map((grow) => (
                        <GrowCard
                          key={grow.id}
                          grow={grow}
                          onClick={() => handleCardClick(grow.id)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Pull to Refresh */}
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={handleRefresh}>
                Refresh List
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Grow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Grow</DialogTitle>
          </DialogHeader>
          <GrowForm
            onSubmit={handleCreateGrow}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createGrowMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}