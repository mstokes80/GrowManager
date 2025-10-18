import { useState } from 'react';
import {
  useEnvironmentalSnapshotsByGrow,
  useCreateSnapshotForGrow,
  useDeleteSnapshot,
} from '@/services/environmentalSnapshotsApi';
import { EnvironmentalSnapshotCard } from './EnvironmentalSnapshotCard';
import {
  EnvironmentalSnapshotForm,
  EnvironmentalSnapshotFormData,
} from './EnvironmentalSnapshotForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnvironmentTabProps {
  growId: string;
}

/**
 * EnvironmentTab - Display and manage environmental snapshots for a grow
 * Used in the GrowDetailPage tabs
 */
export function EnvironmentTab({ growId }: EnvironmentTabProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: snapshots, isLoading, error, refetch } = useEnvironmentalSnapshotsByGrow(growId);
  const createSnapshotMutation = useCreateSnapshotForGrow();
  const deleteSnapshotMutation = useDeleteSnapshot();

  const handleCreateSnapshot = async (data: EnvironmentalSnapshotFormData) => {
    try {
      await createSnapshotMutation.mutateAsync({
        growId,
        data: {
          timestamp: data.timestamp,
          temperature: data.temperature,
          humidity: data.humidity,
          co2: data.co2,
          lightIntensity: data.lightIntensity,
          notes: data.notes,
        },
      });

      toast({
        title: 'Success!',
        description: 'Environmental snapshot has been recorded.',
      });

      setIsCreateDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to create environmental snapshot:', error);

      // Check if it's a 4-hour minimum interval error
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred while recording the snapshot.';

      toast({
        variant: 'destructive',
        title: 'Failed to record snapshot',
        description: errorMessage,
      });
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environmental snapshot?')) {
      return;
    }

    try {
      await deleteSnapshotMutation.mutateAsync(id);

      toast({
        title: 'Deleted',
        description: 'Environmental snapshot has been deleted.',
      });
    } catch (error) {
      console.error('Failed to delete environmental snapshot:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete snapshot',
        description: 'An error occurred while deleting the snapshot. Please try again.',
      });
    }
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
            <p className="text-lg font-medium">Failed to load environmental data</p>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading environmental snapshots.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty State
  if (!snapshots || snapshots.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">No environmental data yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Start tracking environmental conditions by recording your first snapshot.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Snapshot
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Snapshot Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Environmental Snapshot</DialogTitle>
            </DialogHeader>
            <EnvironmentalSnapshotForm
              onSubmit={handleCreateSnapshot}
              onCancel={() => setIsCreateDialogOpen(false)}
              isSubmitting={createSnapshotMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Snapshots List
  return (
    <>
      <div className="space-y-6">
        {/* Add Snapshot Button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {snapshots.length} {snapshots.length === 1 ? 'snapshot' : 'snapshots'} recorded
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Snapshot
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            Environmental snapshots help you track temperature, humidity, CO₂, and light levels over
            time. VPD (Vapor Pressure Deficit) is automatically calculated when you provide both
            temperature and humidity.
          </p>
        </div>

        {/* Snapshots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshots.map((snapshot) => (
            <EnvironmentalSnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              onDelete={handleDeleteSnapshot}
            />
          ))}
        </div>
      </div>

      {/* Create Snapshot Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Environmental Snapshot</DialogTitle>
          </DialogHeader>
          <EnvironmentalSnapshotForm
            onSubmit={handleCreateSnapshot}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createSnapshotMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}