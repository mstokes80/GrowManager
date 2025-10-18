import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HarvestsTab } from '@/components/harvests/HarvestsTab';
import { PlantsTab } from '@/components/plants/PlantsTab';
import { EnvironmentTab } from '@/components/environmental/EnvironmentTab';

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
        <EnvironmentTab growId={growId} />
      </TabsContent>

      <TabsContent value="harvests" className="mt-6">
        <HarvestsTab growId={growId} />
      </TabsContent>
    </Tabs>
  );
}