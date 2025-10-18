import { api } from '@/lib/api-client';
import { useAuthStore, User } from '@/stores/authStore';

/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

/**
 * Register a new user account
 */
export const register = async (data: RegisterRequest): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/register', data);
  return response.data;
};

/**
 * Login with email and password
 * Stores tokens in authStore on success
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', data);

  // Store authentication data in the auth store
  const { setUser, setTokens } = useAuthStore.getState();
  setUser(response.data.user);
  setTokens(response.data.accessToken, response.data.refreshToken);

  return response.data;
};

/**
 * Verify email with token from email link
 */
export const verifyEmail = async (token: string): Promise<MessageResponse> => {
  const response = await api.get<MessageResponse>(`/api/auth/verify-email?token=${token}`);
  return response.data;
};

/**
 * Resend verification email
 */
export const resendVerification = async (email: string): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/resend-verification', { email });
  return response.data;
};

/**
 * Request password reset email
 */
export const forgotPassword = async (email: string): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with token from email link
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<MessageResponse> => {
  const response = await api.post<MessageResponse>('/api/auth/reset-password', data);
  return response.data;
};

/**
 * Logout current user
 * Clears tokens from authStore
 */
export const logout = (): void => {
  useAuthStore.getState().logout();
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (refreshToken: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/refresh', { refreshToken });

  // Update tokens in auth store
  const { setTokens } = useAuthStore.getState();
  setTokens(response.data.accessToken, response.data.refreshToken);

  return response.data;
};