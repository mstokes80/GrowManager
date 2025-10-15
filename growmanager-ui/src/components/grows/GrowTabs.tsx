import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { HarvestsTab } from '@/components/harvests/HarvestsTab';
import { PlantsTab } from '@/components/plants/PlantsTab';

interface GrowTabsProps {
  overviewContent: React.ReactNode;
  growId: string;
}

/**
 * GrowTabs - Tab navigation for grow detail page
 * Implements tabs structure with plants, environment, and harvests
 * Implements Task Group 5.2.6
 */
export function GrowTabs({ overviewContent, growId }: GrowTabsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="plants">Plants</TabsTrigger>
        <TabsTrigger value="environment">Environment</TabsTrigger>
        <TabsTrigger value="harvests">Harvests</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        {overviewContent}
      </TabsContent>

      <TabsContent value="plants" className="mt-6">
        <PlantsTab growId={growId} />
      </TabsContent>

      <TabsContent value="environment" className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Environment tracking coming soon</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="harvests" className="mt-6">
        <HarvestsTab growId={growId} />
      </TabsContent>
    </Tabs>
  );
}