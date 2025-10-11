import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  duration?: number;
  timestamp: number;
}

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Global loading state
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Modal states
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  isModalOpen: (modalId: string) => boolean;

  // Forms state
  formErrors: Record<string, string[]>;
  setFormErrors: (formId: string, errors: string[]) => void;
  clearFormErrors: (formId: string) => void;

  // Navigation
  activeNavItem: string | null;
  setActiveNavItem: (item: string | null) => void;

  // Preferences
  preferences: {
    temperatureUnit: 'celsius' | 'fahrenheit';
    dateFormat: string;
    timeFormat: '12h' | '24h';
    compactView: boolean;
    showTutorials: boolean;
  };
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => {
        set({ theme });

        // Apply theme to document
        const root = document.documentElement;
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          root.classList.remove('light', 'dark');
          root.classList.add(systemTheme);
        } else {
          root.classList.remove('light', 'dark');
          root.classList.add(theme);
        }
      },

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Mobile menu
      mobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          duration: notification.duration ?? 5000,
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after duration
        if (newNotification.duration && newNotification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, newNotification.duration);
        }
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Global loading
      isGlobalLoading: false,
      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

      // Modals
      modals: {},
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),
      closeModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        })),
      isModalOpen: (modalId) => get().modals[modalId] ?? false,

      // Form errors
      formErrors: {},
      setFormErrors: (formId, errors) =>
        set((state) => ({
          formErrors: { ...state.formErrors, [formId]: errors },
        })),
      clearFormErrors: (formId) =>
        set((state) => {
          const { [formId]: _, ...rest } = state.formErrors;
          return { formErrors: rest };
        }),

      // Navigation
      activeNavItem: null,
      setActiveNavItem: (item) => set({ activeNavItem: item }),

      // Preferences
      preferences: {
        temperatureUnit: 'fahrenheit',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        compactView: false,
        showTutorials: true,
      },
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        preferences: state.preferences,
      }),
    }
  )
);

// Selector hooks
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen);
export const useNotifications = () => useUIStore((state) => state.notifications);
export const usePreferences = () => useUIStore((state) => state.preferences);
export const useIsGlobalLoading = () => useUIStore((state) => state.isGlobalLoading);

// Helper hooks
export const useNotification = () => {
  const addNotification = useUIStore((state) => state.addNotification);

  return {
    success: (title: string, description?: string) =>
      addNotification({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addNotification({ type: 'error', title, description }),
    warning: (title: string, description?: string) =>
      addNotification({ type: 'warning', title, description }),
    info: (title: string, description?: string) =>
      addNotification({ type: 'info', title, description }),
  };
};