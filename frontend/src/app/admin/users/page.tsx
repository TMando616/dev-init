'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeft, Mail, Shield } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser, authLoading, router]);

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">ユーザー管理</h1>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">ユーザー名</th>
                <th className="px-6 py-4 font-semibold text-slate-700">メールアドレス</th>
                <th className="px-6 py-4 font-semibold text-slate-700">権限</th>
                <th className="px-6 py-4 font-semibold text-slate-700">登録日</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">自分</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={14} className={u.role === 'admin' ? 'text-amber-500' : 'text-slate-400'} />
                        <span className={`text-sm ${u.role === 'admin' ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                          {u.role === 'admin' ? '管理者' : 'ユーザー'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(u.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    ユーザーが見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
