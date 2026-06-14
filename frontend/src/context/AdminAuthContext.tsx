'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import adminApi from '@/lib/adminApi';

interface Admin {
  id: number;
  name: string;
  email: string;
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// The cookie mirrors the token presence so middleware.ts can gate /admin/* at
// the edge (localStorage is not readable there). It is not httpOnly; it is only
// a coarse UX gate — the real authorization boundary is the backend auth:admin guard.
const setAdminCookie = (token: string) => {
  document.cookie = `admin_token=${token}; path=/; SameSite=Lax`;
};
const clearAdminCookie = () => {
  document.cookie = 'admin_token=; path=/; Max-Age=0; SameSite=Lax';
};

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    try {
      const response = await adminApi.get('/admin/me');
      setAdmin(response.data);
    } catch (error) {
      console.error('Failed to fetch admin', error);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/admin/login'];
    if (!admin && !publicPaths.includes(pathname)) {
      router.push('/admin/login');
    }
  }, [admin, loading, pathname, router]);

  const login = (token: string, adminData: Admin) => {
    localStorage.setItem('admin_token', token);
    setAdminCookie(token);
    setAdmin(adminData);
    router.push('/admin');
  };

  const logout = async () => {
    try {
      await adminApi.post('/admin/logout');
    } catch (error) {
      console.error('Admin logout failed', error);
    } finally {
      localStorage.removeItem('admin_token');
      clearAdminCookie();
      setAdmin(null);
      router.push('/admin/login');
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, checkAuth }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
