import { PageHeader } from '@/components/layouts/PageHeader';

/**
 * LogActivityPage - Quick activity logging page
 * Allows users to quickly log feeding, watering, observations, etc.
 */
export function LogActivityPage() {
  return (
    <div>
      <PageHeader
        title="Log Activity"
        subtitle="Quick entry for plant activities"
      />
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">
          Activity logging forms will be implemented in future task groups
        </p>
      </div>
    </div>
  );
}