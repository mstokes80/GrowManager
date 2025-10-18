import { Outlet } from 'react-router-dom';
import { Leaf } from 'lucide-react';

/**
 * AuthLayout wraps authentication pages (login, register, etc.)
 * Provides a centered layout with app branding for auth flows.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-grow-light to-grow">
      {/* Header with Logo */}
      <header className="p-4 md:p-6">
        <div className="flex items-center justify-center gap-2">
          <Leaf className="h-8 w-8 text-grow-dark" />
          <h1 className="text-2xl md:text-3xl font-bold text-grow-dark">GrowManager</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-grow-dark/70">
        <p>&copy; {new Date().getFullYear()} GrowManager. All rights reserved.</p>
      </footer>
    </div>
  );
}