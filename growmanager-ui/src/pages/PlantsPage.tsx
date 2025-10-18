import { PageHeader } from '@/components/layouts/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * PlantsPage - List of plants in current/selected grow
 */
export default function PlantsPage() {
  return (
    <div>
      <PageHeader
        title="Plants"
        subtitle="Manage plants in your current grow"
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Plant
          </Button>
        }
      />
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">
          Plants list will be implemented in future task groups
        </p>
      </div>
    </div>
  );
}