import axios from 'axios';
import { isAdminPublicPath } from '@/lib/adminRoutes';

// Separate axios instance for the admin area. It uses its own token key
// (`admin_token`) so admin and student sessions never share credentials.
const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      if (typeof window !== 'undefined' && !isAdminPublicPath(window.location.pathname)) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
