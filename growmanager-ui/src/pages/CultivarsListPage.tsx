import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCultivars, useCreateCultivar } from '@/services/cultivarsApi';
import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CultivarCard } from '@/components/cultivars/CultivarCard';
import { CultivarForm, CultivarFormData } from '@/components/cultivars/CultivarForm';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * CultivarsListPage - Display list of user's cultivars with search and create functionality
 * Implements Task Group 5.1.3
 */
export default function CultivarsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: cultivars, isLoading, error, refetch } = useCultivars();
  const createCultivarMutation = useCreateCultivar();

  // Filter cultivars based on search query
  const filteredCultivars = useMemo(() => {
    if (!cultivars) return [];

    if (!searchQuery.trim()) return cultivars;

    const query = searchQuery.toLowerCase();
    return cultivars.filter(
      (cultivar) =>
        cultivar.name.toLowerCase().includes(query) ||
        cultivar.breeder?.toLowerCase().includes(query)
    );
  }, [cultivars, searchQuery]);

  const handleCreateCultivar = async (data: CultivarFormData) => {
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

      await createCultivarMutation.mutateAsync({
        name: data.name,
        breeder: data.breeder || undefined,
        genetics: data.genetics || undefined,
        type: data.type,
        characteristics,
        notes: data.notes || undefined,
      });

      toast({
        title: 'Success!',
        description: `Cultivar "${data.name}" has been created.`,
      });

      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create cultivar:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create cultivar',
        description: 'An error occurred while creating the cultivar. Please try again.',
      });
    }
  };

  const handleCardClick = (cultivarId: string) => {
    navigate(`/cultivars/${cultivarId}`);
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Refreshed',
      description: 'Cultivars list has been updated.',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Cultivars"
        subtitle="Your personal strain library"
        actions={
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Cultivar
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or breeder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

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
            <p className="text-lg font-medium">Failed to load cultivars</p>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading your cultivars.
            </p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCultivars.length === 0 && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="rounded-full bg-muted p-4">
              <Plus className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No cultivars yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Add your first strain to start tracking cultivars in your grow journal.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Cultivar
            </Button>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && !error && filteredCultivars.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Search className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold">No results found</h3>
            <p className="text-sm text-muted-foreground">
              No cultivars match your search for "{searchQuery}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        )}

        {/* Cultivars Grid */}
        {!isLoading && !error && filteredCultivars.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCultivars.map((cultivar) => (
                <CultivarCard
                  key={cultivar.id}
                  cultivar={cultivar}
                  onClick={() => handleCardClick(cultivar.id)}
                  usageCount={cultivar.plantCount || 0}
                />
              ))}
            </div>

            {/* Pull to Refresh */}
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={handleRefresh}>
                Refresh List
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Create Cultivar Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cultivar</DialogTitle>
          </DialogHeader>
          <CultivarForm
            onSubmit={handleCreateCultivar}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={createCultivarMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}