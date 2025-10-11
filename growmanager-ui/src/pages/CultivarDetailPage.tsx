import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useCultivar,
  useUpdateCultivar,
  useDeleteCultivar,
  Cultivar,
} from '@/services/cultivarsApi';
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
import { CultivarForm, CultivarFormData } from '@/components/cultivars/CultivarForm';
import { DeleteCultivarDialog } from '@/components/cultivars/DeleteCultivarDialog';
import { Edit, MoreVertical, Trash2, Loader2, AlertCircle, Leaf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * CultivarDetailPage - Display detailed information about a specific cultivar
 * Implements Task Group 5.1.5
 */
export function CultivarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: cultivar, isLoading, error } = useCultivar(id || '');
  const updateCultivarMutation = useUpdateCultivar();
  const deleteCultivarMutation = useDeleteCultivar();

  // Mock usage count - will be replaced when plants API is ready
  const usageCount: number = 0;

  const getTypeColor = (type: Cultivar['type']): 'success' | 'info' | 'warning' | 'secondary' => {
    switch (type) {
      case 'indica':
        return 'info';
      case 'sativa':
        return 'success';
      case 'hybrid':
        return 'warning';
      case 'auto':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleUpdateCultivar = async (data: CultivarFormData) => {
    if (!id) return;

    try {
      // Parse characteristics JSON if provided
      let characteristics;
      if (data.characteristics && data.characteristics.trim()) {
        try {
          characteristics = JSON.parse(data.characteristics);
        } catch (e) {
          toast({
            variant: 'destructive',
            title: 'Invalid JSON',
            description: 'Characteristics must be valid JSON format',
          });
          return;
        }
      }

      await updateCultivarMutation.mutateAsync({
        id,
        data: {
          name: data.name,
          breeder: data.breeder || undefined,
          genetics: data.genetics || undefined,
          type: data.type,
          characteristics,
          notes: data.notes || undefined,
        },
      });

      toast({
        title: 'Success!',
        description: `Cultivar "${data.name}" has been updated.`,
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update cultivar:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update cultivar',
        description: 'An error occurred while updating the cultivar. Please try again.',
      });
    }
  };

  const handleDeleteCultivar = async () => {
    if (!id) return;

    try {
      await deleteCultivarMutation.mutateAsync(id);

      toast({
        title: 'Deleted',
        description: 'Cultivar has been deleted successfully.',
      });

      navigate('/cultivars');
    } catch (error) {
      console.error('Failed to delete cultivar:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete cultivar',
        description: 'An error occurred while deleting the cultivar. Please try again.',
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
  if (error || !cultivar) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Error" showBackButton />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-lg font-medium">Failed to load cultivar</p>
            <p className="text-sm text-muted-foreground">
              The cultivar you're looking for could not be found.
            </p>
            <Button onClick={() => navigate('/cultivars')}>Back to Cultivars</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={cultivar.name}
        showBackButton
        actions={
          <div className="flex gap-2">
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
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Leaf className="h-6 w-6 text-green-600" />
                <CardTitle>Basic Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Name</p>
                <p className="text-lg font-semibold">{cultivar.name}</p>
              </div>

              {cultivar.breeder && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Breeder</p>
                  <p>{cultivar.breeder}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
                <Badge variant={getTypeColor(cultivar.type)}>{cultivar.type}</Badge>
              </div>

              {cultivar.genetics && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Genetics</p>
                  <p>{cultivar.genetics}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Characteristics Card */}
          {cultivar.characteristics && Object.keys(cultivar.characteristics).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Characteristics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(cultivar.characteristics).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-sm font-medium text-muted-foreground mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p>{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          {cultivar.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{cultivar.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Usage Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
            </CardHeader>
            <CardContent>
              {usageCount > 0 ? (
                <p>
                  Used by <span className="font-semibold">{usageCount}</span>{' '}
                  {usageCount === 1 ? 'plant' : 'plants'}
                </p>
              ) : (
                <p className="text-muted-foreground">Not used by any plants yet</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Created: {new Date(cultivar.createdAt).toLocaleString()}</p>
            <p>Last updated: {new Date(cultivar.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Edit Cultivar Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cultivar</DialogTitle>
          </DialogHeader>
          <CultivarForm
            cultivar={cultivar}
            onSubmit={handleUpdateCultivar}
            onCancel={() => setIsEditDialogOpen(false)}
            isSubmitting={updateCultivarMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteCultivarDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteCultivar}
        cultivarName={cultivar.name}
        usageCount={usageCount}
        isDeleting={deleteCultivarMutation.isPending}
      />
    </div>
  );
}