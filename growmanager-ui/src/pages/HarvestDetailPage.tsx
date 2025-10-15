import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useHarvest, useUpdateHarvest, useDeleteHarvest } from '@/services/harvestsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  ArrowLeft,
  Scale,
  Droplet,
  Star,
  Calendar,
  Leaf,
  Edit,
  Trash2,
  Activity,
} from 'lucide-react';
import { UpdateHarvestForm, UpdateHarvestFormData } from '@/components/harvests/UpdateHarvestForm';
import { useToast } from '@/hooks/use-toast';

/**
 * HarvestDetailPage - Displays full harvest details with edit capability
 * Implements Task Group 8.3.6
 */
export function HarvestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: harvest, isLoading, error } = useHarvest(id || '');
  const updateMutation = useUpdateHarvest();
  const deleteMutation = useDeleteHarvest();

  const handleUpdate = async (data: UpdateHarvestFormData) => {
    try {
      await updateMutation.mutateAsync({ id: id!, data });
      toast({
        title: 'Success!',
        description: 'Harvest updated successfully',
      });
      setIsEditDialogOpen(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update harvest',
      });
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id!);
      toast({
        title: 'Deleted',
        description: 'Harvest deleted successfully',
      });
      navigate(`/grows/${harvest?.growId}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete harvest',
      });
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !harvest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load harvest details</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weightUnitLabel = harvest.weightUnit === 'GRAMS' ? 'g' : 'oz';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Harvest Details</h1>
            <div className="flex items-center gap-2">
              <Link
                to={`/plants/${harvest.plantId}`}
                className="text-lg text-muted-foreground hover:text-primary transition-colors"
              >
                {harvest.plantTag}
              </Link>
              {harvest.cultivarName && (
                <Badge variant="outline">{harvest.cultivarName}</Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Harvest Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Harvest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Harvest Date</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {new Date(harvest.harvestDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Leaf className="h-4 w-4" />
                    <span className="text-sm">Plant</span>
                  </div>
                  <Link
                    to={`/plants/${harvest.plantId}`}
                    className="text-lg font-semibold hover:text-primary transition-colors"
                  >
                    {harvest.plantTag}
                  </Link>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Droplet className="h-4 w-4" />
                    <span className="text-sm">Wet Weight</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {harvest.wetWeight} {weightUnitLabel}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Scale className="h-4 w-4" />
                    <span className="text-sm">Dry Weight</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {harvest.dryWeight ? `${harvest.dryWeight} ${weightUnitLabel}` : 'Not yet recorded'}
                  </p>
                </div>
              </div>

              {harvest.dryWeight && harvest.wetWeight && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Moisture Loss</div>
                  <p className="text-lg font-semibold">
                    {((1 - harvest.dryWeight / harvest.wetWeight) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Potency Information */}
          {(harvest.thcPercent || harvest.cbdPercent) && (
            <Card>
              <CardHeader>
                <CardTitle>Potency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {harvest.thcPercent && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm">THC</span>
                      </div>
                      <p className="text-2xl font-bold">{harvest.thcPercent}%</p>
                    </div>
                  )}

                  {harvest.cbdPercent && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Activity className="h-4 w-4" />
                        <span className="text-sm">CBD</span>
                      </div>
                      <p className="text-2xl font-bold">{harvest.cbdPercent}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {harvest.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{harvest.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quality Rating */}
          {harvest.qualityRating && (
            <Card>
              <CardHeader>
                <CardTitle>Quality Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(10)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < harvest.qualityRating!
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-2xl font-bold mt-2">{harvest.qualityRating}/10</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p>{new Date(harvest.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <p>{new Date(harvest.updatedAt).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Harvest</DialogTitle>
            <DialogDescription>
              Update harvest details. Harvest date and wet weight cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <UpdateHarvestForm
            harvest={harvest}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Harvest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this harvest record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}