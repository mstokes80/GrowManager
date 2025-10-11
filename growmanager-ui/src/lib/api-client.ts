import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

// Get API URL from environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with cookies if needed
});

// Track if we're currently refreshing the token to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Process the queue of failed requests after token refresh
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;

    // Add auth header if we have a token
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't try to refresh on auth endpoints
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshSuccess = await useAuthStore.getState().refreshAccessToken();

        if (refreshSuccess) {
          const newAccessToken = useAuthStore.getState().accessToken;
          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return apiClient(originalRequest);
        } else {
          processQueue(error, null);
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(error, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden - likely email not verified
    if (error.response?.status === 403) {
      const errorData = error.response.data as { message?: string; code?: string };

      // Check if it's an email verification error
      if (errorData.code === 'EMAIL_NOT_VERIFIED' || errorData.message?.includes('email')) {
        useUIStore.getState().addNotification({
          type: 'warning',
          title: 'Email Verification Required',
          description: 'Please verify your email address to access this feature. Check your inbox for the verification link.',
          duration: 10000,
        });

        // Redirect to verification pending page if not already there
        if (!window.location.pathname.includes('/verify-email')) {
          window.location.href = '/verify-email';
        }
      } else {
        useUIStore.getState().addNotification({
          type: 'error',
          title: 'Access Denied',
          description: errorData.message || 'You do not have permission to access this resource.',
        });
      }

      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your internet connection.',
      });
      return Promise.reject(error);
    }

    // Handle 500 server errors
    if (error.response.status >= 500) {
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Server Error',
        description: 'An unexpected error occurred. Please try again later.',
      });
      return Promise.reject(error);
    }

    // Handle validation errors (422)
    if (error.response.status === 422) {
      const errorData = error.response.data as { errors?: Record<string, string[]>; message?: string };

      if (errorData.errors) {
        // Show first validation error as notification
        const firstError = Object.values(errorData.errors)[0]?.[0];
        if (firstError) {
          useUIStore.getState().addNotification({
            type: 'error',
            title: 'Validation Error',
            description: firstError,
          });
        }
      }
      return Promise.reject(error);
    }

    // Default error handling
    const errorData = error.response?.data as { message?: string };
    if (errorData?.message) {
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Error',
        description: errorData.message,
      });
    }

    return Promise.reject(error);
  }
);

// Export configured axios instance
export default apiClient;

// Export typed API methods
export const api = {
  get: <T = any>(url: string, config?: any) => apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any) => apiClient.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: any) => apiClient.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: any) => apiClient.delete<T>(url, config),
};