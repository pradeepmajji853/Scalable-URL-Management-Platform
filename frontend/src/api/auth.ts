import client from './client';
import type { ApiResponse, AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    return data.data;
  },

  register: async (name: string, email: string, password: string, confirmPassword: string): Promise<AuthResponse> => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/register', { name, email, password, confirmPassword });
    return data.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    await client.post('/auth/logout', { refreshToken });
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await client.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
    return data.data;
  },

  verifyEmail: async (token: string): Promise<void> => {
    await client.get(`/auth/verify-email?token=${token}`);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await client.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await client.post('/auth/reset-password', { token, password });
  },

  getMe: async (): Promise<User> => {
    const { data } = await client.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await client.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
  },

  updateProfile: async (updates: Partial<Pick<User, 'name' | 'bio' | 'avatar'>>): Promise<User> => {
    // Map backend expected fields
    const { name, avatar } = updates;
    const { data } = await client.put<ApiResponse<User>>('/users/profile', { name, avatar_url: avatar });
    return data.data;
  },
};
