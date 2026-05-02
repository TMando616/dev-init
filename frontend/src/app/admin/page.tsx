'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, ArrowLeft, BookOpen, Users } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchLessons = async () => {
      try {
        const response = await api.get('/api/lessons');
        setLessons(response.data);
      } catch (error) {
        console.error('Failed to fetch lessons', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchLessons();
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: number) => {
    if (!confirm('このレッスンを削除してもよろしいですか？')) return;

    try {
      await api.delete(`/api/lessons/${id}`);
      setLessons(lessons.filter(l => l.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
      alert('削除に失敗しました。');
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">管理者ダッシュボード</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="outline" className="flex items-center gap-2">
              <Users size={18} />
              ユーザー管理
            </Button>
          </Link>
          <Link href="/admin/lessons/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              新規レッスン作成
            </Button>
          </Link>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">タイトル</th>
                <th className="px-6 py-4 font-semibold text-slate-700">作成日</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} className="text-slate-400" />
                        <span className="font-medium text-slate-900">{lesson.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(lesson.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/lessons/${lesson.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Edit2 size={16} />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(lesson.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    レッスンが登録されていません。
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
