import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/navigation/BottomNav';

/**
 * AppLayout wraps all authenticated app pages.
 * Provides the main app structure with bottom navigation on mobile
 * and includes space for the main content area.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content Area - grows to fill available space */}
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation - fixed at bottom on mobile */}
      <BottomNav />
    </div>
  );
}