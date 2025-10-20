import { useState, useRef, useEffect } from 'react';
import {
  useInfiniteEnvironmentalSnapshots,
  useCreateSnapshotForGrow,
  useDeleteSnapshot,
  useImportEnvironmentalCSV,
} from '@/services/environmentalSnapshotsApi';
import { EnvironmentalSnapshotCard } from './EnvironmentalSnapshotCard';
import {
  EnvironmentalSnapshotForm,
  EnvironmentalSnapshotFormData,
} from './EnvironmentalSnapshotForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Loader2, AlertCircle, Upload, FileUp, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { EnvironmentalImportResponse } from '@/types/environmentalSnapshot';

interface EnvironmentTabProps {
  growId: string;
}

/**
 * EnvironmentTab - Display and manage environmental snapshots for a grow
 * Uses infinite scrolling for performance with large datasets
 */
export function EnvironmentTab({ growId }: EnvironmentTabProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<EnvironmentalImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteEnvironmentalSnapshots(growId, 30); // Load 30 items per page

  const createSnapshotMutation = useCreateSnapshotForGrow();
  const deleteSnapshotMutation = useDeleteSnapshot();
  const importCSVMutation = useImportEnvironmentalCSV();

  // Flatten all pages into a single array of snapshots
  const snapshots = data?.pages.flatMap((page) => page.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  // Infinite scroll: Load more when the sentinel element is visible
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImportCSV = async () => {
    if (!selectedFile) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
      });
      return;
    }

    try {
      const result = await importCSVMutation.mutateAsync({
        growId,
        file: selectedFile,
      });

      setImportResult(result);

      toast({
        title: 'Import completed',
        description: `Successfully imported ${result.importedCount} of ${result.totalRecords} records.`,
      });
    } catch (error: any) {
      console.error('Failed to import CSV:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred while importing the CSV file.';

      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: errorMessage,
      });
    }
  };

  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
                Start tracking environmental conditions by recording your first snapshot or import data from a CSV file.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Snapshot
                </Button>
              </div>
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

        {/* Import CSV Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Environmental Data</DialogTitle>
              <DialogDescription>
                Import environmental data from an AC Infinity CSV file. The file should contain columns for Time, Temperature, Relative Humidity, and VPD.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Upload Section */}
              {!importResult && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <label
                      htmlFor="csv-file-input"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <FileUp className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium mb-1">
                        {selectedFile ? selectedFile.name : 'Click to select a CSV file'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported format: AC Infinity CSV
                      </p>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCloseImportDialog}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportCSV}
                      disabled={!selectedFile || importCSVMutation.isPending}
                    >
                      {importCSVMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Import Results Section */}
              {importResult && (
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium">Import Summary</h4>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Records:</span>
                        <span className="font-medium">{importResult.totalRecords}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Successfully Imported:</span>
                        <span className="font-medium text-green-600">{importResult.importedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Skipped:</span>
                        <span className="font-medium text-orange-600">{importResult.skippedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="font-medium">{importResult.source}</span>
                      </div>
                    </div>
                  </div>

                  {/* Error List */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 text-destructive" />
                        <h4 className="font-medium text-destructive">Errors</h4>
                      </div>
                      <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <li key={index} className="text-destructive/90">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={handleCloseImportDialog}>Close</Button>
                  </div>
                </div>
              )}
            </div>
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Snapshot
            </Button>
          </div>
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

        {/* Load More Sentinel & Loading Indicator */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading more...</span>
              </div>
            ) : (
              <Button variant="outline" onClick={() => fetchNextPage()}>
                Load More
              </Button>
            )}
          </div>
        )}

        {/* End of List Message */}
        {!hasNextPage && snapshots.length > 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Showing all {totalElements} {totalElements === 1 ? 'snapshot' : 'snapshots'}
          </div>
        )}
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

      {/* Import CSV Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Environmental Data</DialogTitle>
            <DialogDescription>
              Import environmental data from an AC Infinity CSV file. The file should contain columns for Time, Temperature, Relative Humidity, and VPD.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload Section */}
            {!importResult && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <FileUp className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">
                      {selectedFile ? selectedFile.name : 'Click to select a CSV file'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported format: AC Infinity CSV
                    </p>
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseImportDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportCSV}
                    disabled={!selectedFile || importCSVMutation.isPending}
                  >
                    {importCSVMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Import Results Section */}
            {importResult && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Import Summary</h4>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Records:</span>
                      <span className="font-medium">{importResult.totalRecords}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Successfully Imported:</span>
                      <span className="font-medium text-green-600">{importResult.importedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skipped:</span>
                      <span className="font-medium text-orange-600">{importResult.skippedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source:</span>
                      <span className="font-medium">{importResult.source}</span>
                    </div>
                  </div>
                </div>

                {/* Error List */}
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-destructive" />
                      <h4 className="font-medium text-destructive">Errors</h4>
                    </div>
                    <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                      {importResult.errors.map((error, index) => (
                        <li key={index} className="text-destructive/90">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleCloseImportDialog}>Close</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}