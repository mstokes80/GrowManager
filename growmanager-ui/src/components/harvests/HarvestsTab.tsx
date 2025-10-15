import { useHarvestSummary } from '@/services/harvestsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Scale, Droplet, Star, Calendar, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Harvest } from '@/types/harvest';

interface HarvestsTabProps {
  growId: string;
}

/**
 * HarvestsTab - Displays harvest summary and list for a grow
 * Implements Task Group 8.3.5
 */
export function HarvestsTab({ growId }: HarvestsTabProps) {
  const { data: summary, isLoading, error } = useHarvestSummary(growId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load harvest data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalPlantsHarvested === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Harvests</CardTitle>
          <CardDescription>Track harvest data for your plants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No harvests yet</h3>
            <p className="text-muted-foreground mb-6">
              Mark plants as harvested to see harvest data and statistics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Harvest Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Summary</CardTitle>
          <CardDescription>Aggregate statistics for this grow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Leaf className="h-4 w-4" />
                <span className="text-sm">Plants Harvested</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalPlantsHarvested}</p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Droplet className="h-4 w-4" />
                <span className="text-sm">Total Wet Weight</span>
              </div>
              <p className="text-2xl font-bold">
                {summary.totalWetWeight.toFixed(2)} g
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Scale className="h-4 w-4" />
                <span className="text-sm">Total Dry Weight</span>
              </div>
              <p className="text-2xl font-bold">
                {summary.totalDryWeight > 0 ? `${summary.totalDryWeight.toFixed(2)} g` : 'N/A'}
              </p>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                <span className="text-sm">Average Quality</span>
              </div>
              <p className="text-2xl font-bold">
                {summary.averageQuality > 0 ? `${summary.averageQuality.toFixed(1)}/10` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Harvests List */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Log</CardTitle>
          <CardDescription>All harvests for this grow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary.harvests.map((harvest) => (
              <HarvestCard key={harvest.id} harvest={harvest} onView={() => navigate(`/harvests/${harvest.id}`)} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface HarvestCardProps {
  harvest: Harvest;
  onView: () => void;
}

function HarvestCard({ harvest, onView }: HarvestCardProps) {
  const weightUnitLabel = harvest.weightUnit === 'GRAMS' ? 'g' : 'oz';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold">{harvest.plantTag}</h4>
          {harvest.cultivarName && (
            <Badge variant="outline" className="text-xs">
              {harvest.cultivarName}
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(harvest.harvestDate).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1">
            <Droplet className="h-4 w-4" />
            <span>
              Wet: {harvest.wetWeight} {weightUnitLabel}
            </span>
          </div>

          {harvest.dryWeight && (
            <div className="flex items-center gap-1">
              <Scale className="h-4 w-4" />
              <span>
                Dry: {harvest.dryWeight} {weightUnitLabel}
              </span>
            </div>
          )}

          {harvest.qualityRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{harvest.qualityRating}/10</span>
            </div>
          )}
        </div>

        {(harvest.thcPercent || harvest.cbdPercent) && (
          <div className="flex gap-3 mt-2 text-xs">
            {harvest.thcPercent && (
              <span className="font-medium">THC: {harvest.thcPercent}%</span>
            )}
            {harvest.cbdPercent && (
              <span className="font-medium">CBD: {harvest.cbdPercent}%</span>
            )}
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" onClick={onView}>
        View Details
      </Button>
    </div>
  );
}