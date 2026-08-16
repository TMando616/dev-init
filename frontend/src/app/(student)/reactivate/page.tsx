'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import Logo from '@/components/Logo';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

export default function ReactivatePage() {
  return (
    <Suspense fallback={null}>
      <ReactivateForm />
    </Suspense>
  );
}

function ReactivateForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/reactivate', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage(response.data.message);
      setIsDone(true);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || '復会処理に失敗しました。');
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
            新しいパスワードを設定してアカウントを復元します。学習進捗はそのまま引き継がれます。
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/60">
            {error}
          </div>
        )}

        {isDone ? (
          <>
            <div className="rounded-md bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/60">
              {message}
            </div>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              <Link href="/login" className="font-semibold text-slate-900 dark:text-slate-100 hover:underline">
                ログイン画面へ
              </Link>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                  メールアドレス
                </label>
                <Input id="email" type="email" value={email} readOnly className="mt-1 bg-slate-50 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">
                  新しいパスワード
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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="passwordConfirmation">
                  新しいパスワード（確認）
                </label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '復元中...' : 'アカウントを復元する'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
