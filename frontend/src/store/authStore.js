import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('pulse_token') || null,
  isAuthenticated: !!localStorage.getItem('pulse_token'),
  defaultWorkspace: JSON.parse(localStorage.getItem('pulse_default_workspace')) || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user, defaultWorkspace } = response.data;

      localStorage.setItem('pulse_token', token);
      localStorage.setItem('pulse_user', JSON.stringify(user));
      localStorage.setItem('pulse_default_workspace', JSON.stringify(defaultWorkspace));

      set({
        token,
        user,
        defaultWorkspace,
        isAuthenticated: true,
        isLoading: false
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, user, defaultWorkspace } = response.data;

      localStorage.setItem('pulse_token', token);
      localStorage.setItem('pulse_user', JSON.stringify(user));
      localStorage.setItem('pulse_default_workspace', JSON.stringify(defaultWorkspace));

      set({
        token,
        user,
        defaultWorkspace,
        isAuthenticated: true,
        isLoading: false
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('pulse_token');
    localStorage.removeItem('pulse_user');
    localStorage.removeItem('pulse_default_workspace');
    localStorage.removeItem('pulse_active_workspace');
    localStorage.removeItem('pulse_active_project');
    set({
      user: null,
      token: null,
      defaultWorkspace: null,
      isAuthenticated: false,
      error: null
    });
  },

  updateProfile: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/auth/profile', { name });
      const { user } = response.data;

      localStorage.setItem('pulse_user', JSON.stringify(user));
      set({ user, isLoading: false });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/auth/password', { currentPassword, newPassword });
      set({ isLoading: false });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Password update failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('pulse_token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      localStorage.setItem('pulse_user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch (err) {
      // Token is stale or invalid, logout
      localStorage.removeItem('pulse_token');
      localStorage.removeItem('pulse_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  }
}));
