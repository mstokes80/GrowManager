import { PageHeader } from '@/components/layouts/PageHeader';

/**
 * DashboardPage - Main dashboard/home page
 * Shows overview of active grows, recent activity, and quick actions
 */
export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your grows and recent activity"
      />
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">
          Dashboard content will be implemented in future task groups
        </p>
      </div>
    </div>
  );
}