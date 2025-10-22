import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid3x3, User, Sprout, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/grows', icon: Grid3x3, label: 'Grows' },
  { to: '/cultivars', icon: Sprout, label: 'Cultivars' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/profile', icon: User, label: 'Profile' },
];

/**
 * BottomNav component provides the main navigation for the app.
 * On mobile: Fixed bottom bar with icons only, hides when keyboard is open
 * On tablet/desktop: Shows icons + labels with more spacing
 * Minimum 44px touch targets for accessibility
 */
export function BottomNav() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Only run keyboard detection on mobile devices
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    if (!isMobile) return;

    // Store the initial viewport height
    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleResize = () => {
      // Get current viewport height
      const currentViewportHeight = window.visualViewport?.height || window.innerHeight;

      // If viewport height is significantly smaller, keyboard is likely open
      // Using 150px threshold to avoid false positives from browser UI changes
      const keyboardThreshold = 150;
      const heightDifference = initialViewportHeight - currentViewportHeight;

      setIsKeyboardOpen(heightDifference > keyboardThreshold);
    };

    // Use visualViewport API if available (better for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50',
        'transition-transform duration-300',
        'shadow-lg md:shadow-md',
        // Hide on mobile when keyboard is open
        isKeyboardOpen && 'translate-y-full md:translate-y-0'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-2 md:px-4">
        <ul className="flex items-center justify-around md:justify-center md:gap-8 h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1 md:flex-initial">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2',
                      'h-14 md:h-12 px-2 md:px-4',
                      'transition-colors duration-200',
                      'rounded-md',
                      // Ensure minimum touch target size
                      'min-w-[44px] min-h-[44px]',
                      isActive
                        ? 'text-grow-dark bg-grow-light/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )
                  }
                  aria-label={item.label}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-6 w-6 md:h-5 md:w-5',
                          isActive && 'fill-current'
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-xs md:text-sm font-medium">
                        {/* Show label on mobile in small text, normal on desktop */}
                        <span className="md:hidden">{item.label.slice(0, 1)}</span>
                        <span className="hidden md:inline">{item.label}</span>
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}