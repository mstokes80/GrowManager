import { PageHeader } from '@/components/layouts/PageHeader';
import { useAuthStore } from '@/stores/authStore';

/**
 * ProfilePage - User profile and account settings
 */
export function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle={user?.email || 'Manage your account'}
      />
      <div className="container mx-auto p-4">
        <p className="text-muted-foreground">
          Profile settings will be implemented in future task groups
        </p>
      </div>
    </div>
  );
}