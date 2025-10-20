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
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Main Content Area - grows to fill available space */}
      <main id="main-content" className="flex-1 pb-20" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Bottom Navigation - fixed at bottom on mobile */}
      <BottomNav />
    </div>
  );
}