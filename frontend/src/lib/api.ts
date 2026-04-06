import axios from 'axios';
import type { User } from './types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// Auth
export const getMe = () => api.get<User>('/auth/me').then(r => r.data);

export default api;
