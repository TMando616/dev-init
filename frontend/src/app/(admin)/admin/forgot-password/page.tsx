'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input } from '@/components/ui';
import Logo from '@/components/Logo';
import adminApi from '@/lib/adminApi';
import { isAxiosError } from 'axios';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await adminApi.post('/admin/forgot-password', { email });
      setMessage(response.data.message);
      setIsSent(true);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || '送信に失敗しました。');
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
          <Logo className="mx-auto h-10" />
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            登録済みの管理者メールアドレスにパスワード再設定用のリンクを送信します
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/60">
            {error}
          </div>
        )}

        {isSent ? (
          <div className="rounded-md bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/60">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '送信中...' : 'リンクを送信する'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          <Link href="/admin/login" className="font-semibold text-slate-900 dark:text-slate-100 hover:underline">
            ログイン画面に戻る
          </Link>
        </p>
      </div>
    </div>
  );
}
