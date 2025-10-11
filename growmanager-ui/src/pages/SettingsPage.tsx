import { PageHeader } from '@/components/layouts/PageHeader';

/**
 * SettingsPage - App settings and preferences
 */
export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage app preferences"
      />
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">
          Settings page will be implemented in future task groups
        </p>
      </div>
    </div>
  );
}