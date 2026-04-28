'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== passwordConfirmation) {
      setError('パスワードが一致しません。');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      login(response.data.token, response.data.user);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || '登録に失敗しました。');
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">DevInit</h1>
          <p className="mt-2 text-slate-600">新しいアカウントを作成して学習を始めましょう</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="name">
                お名前
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="password">
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
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="passwordConfirmation">
                パスワード（確認）
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
            {isLoading ? '登録中...' : '新規登録'}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" className="font-semibold text-slate-900 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
