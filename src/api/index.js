import * as SecureStore from 'expo-secure-store';

// Uses EXPO_PUBLIC_API_URL from .env if available.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-deployed-backend-url.com';

export const apiClient = async (endpoint, options = {}) => {
  const token = await SecureStore.getItemAsync('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Something went wrong');
  }

  return data;
};

// ─── Auth ────────────────────────────────────────────────────────────
export const login = (email, password) => apiClient('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

export const getMe = () => apiClient('/api/auth/me', {
  method: 'GET',
});

export const updateMe = (updates) => apiClient('/api/auth/me', {
  method: 'PUT',
  body: JSON.stringify(updates),
});

// ─── Habits ──────────────────────────────────────────────────────────
export const getHabits = () => apiClient('/api/habits', {
  method: 'GET',
});

export const createHabit = (habitData) => apiClient('/api/habits', {
  method: 'POST',
  body: JSON.stringify(habitData),
});

export const updateHabit = (id, habitData) => apiClient(`/api/habits/${id}`, {
  method: 'PUT',
  body: JSON.stringify(habitData),
});

export const deleteHabit = (id) => apiClient(`/api/habits/${id}`, {
  method: 'DELETE',
});

// ─── Habit Logs ──────────────────────────────────────────────────────
export const getHabitLogs = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient(`/api/habit-logs?${query}`, {
    method: 'GET',
  });
};

export const createHabitLog = (logData) => apiClient('/api/habit-logs', {
  method: 'POST',
  body: JSON.stringify(logData),
});

export const deleteHabitLog = (habitId, dateString) => apiClient('/api/habit-logs', {
  method: 'DELETE',
  body: JSON.stringify({ habitId, dateString }),
});

export const useStreakToken = (dateString) => apiClient('/api/habit-logs/token', {
  method: 'PUT',
  body: JSON.stringify({ dateString }),
});

// ─── Analytics ───────────────────────────────────────────────────────
export const getAnalytics = () => apiClient('/api/analytics', {
  method: 'GET',
});

export const getHistory = () => apiClient('/api/analytics/history', {
  method: 'GET',
});

// ─── Categories ──────────────────────────────────────────────────────
export const getCategories = () => apiClient('/api/categories', {
  method: 'GET',
});

export const createCategory = (name) => apiClient('/api/categories', {
  method: 'POST',
  body: JSON.stringify({ name }),
});
