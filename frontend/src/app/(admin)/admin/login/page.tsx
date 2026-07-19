'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import { isAxiosError } from 'axios';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await adminApi.post('/admin/login', { email, password });
      login(response.data.access_token, response.data.admin);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'ログインに失敗しました。');
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white dark:bg-slate-900 p-8 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-3xl font-bold">DevInit <span className="text-blue-600 dark:text-blue-400">Admin</span></h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">管理者専用ログイン</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/60">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </form>
      </div>
    </div>
  );
}
