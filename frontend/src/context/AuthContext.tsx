'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/user');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      // api.interceptors.response already handles 401, but we ensure state is cleared
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      await checkAuth();
      if (isMounted) {
        // Any additional logic after checkAuth if needed
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/register'];
    if (!user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = (token: string, userData: User) => {
    console.log('Login function called with token:', token);
    localStorage.setItem('token', token);
    setUser(userData);
    router.push('/');
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
