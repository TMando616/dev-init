'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import api from '@/lib/api';
import { isAxiosError } from 'axios';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">設定</h1>
      <ProfileCard />
      <PasswordCard />
      <DeleteAccountCard />
    </div>
  );
}

function ProfileCard() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await api.put('/account/profile', { name, email });
      await refreshUser();
      setSuccess('プロフィールを更新しました。');
    } catch (err) {
      if (isAxiosError(err)) {
        const fieldError = err.response?.data?.errors?.email?.[0];
        if (fieldError) {
          setEmailError(fieldError);
        } else {
          setError(err.response?.data?.message || 'プロフィールの更新に失敗しました。');
        }
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">プロフィール</h2>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/60">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/60">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
            お名前
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1"
          />
        </div>
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
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{emailError}</p>
          )}
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : '保存する'}
        </Button>
      </form>
    </section>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await api.put('/account/password', {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
      setSuccess(response.data.message || 'パスワードを変更しました。他の端末は再ログインが必要です。');
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'パスワードの変更に失敗しました。');
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">パスワード変更</h2>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/60">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/40 p-3 text-sm text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/60">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="current_password">
            現在のパスワード
          </label>
          <Input
            id="current_password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="new_password">
            新しいパスワード
          </label>
          <Input
            id="new_password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="new_password_confirmation">
            新しいパスワード（確認）
          </label>
          <Input
            id="new_password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '変更中...' : 'パスワードを変更する'}
        </Button>
      </form>
    </section>
  );
}

function DeleteAccountCard() {
  const { clearSession } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!window.confirm('本当に退会しますか？この操作は取り消せません（30日以内なら復会できます）。')) {
      return;
    }

    setIsLoading(true);
    try {
      await api.delete('/account', { data: { password } });
      clearSession();
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || '退会処理に失敗しました。');
      } else {
        setError('予期せぬエラーが発生しました。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">退会</h2>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        30日以内なら同じメールアドレスで復会でき、学習進捗も引き継げます。30日を過ぎるとデータは完全に削除されます。
      </p>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/60">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="delete_password">
            パスワード
          </label>
          <Input
            id="delete_password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : '退会する'}
        </Button>
      </form>
    </section>
  );
}
