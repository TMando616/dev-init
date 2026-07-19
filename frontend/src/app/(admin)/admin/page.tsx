'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import { Edit2, Trash2, BookOpen } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  title: string;
  categories: Category[];
  created_at: string;
}

export default function AdminDashboard() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!admin) return;

    const fetchLessons = async () => {
      try {
        const response = await adminApi.get('/lessons');
        setLessons(response.data);
      } catch (error) {
        console.error('Failed to fetch lessons', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [admin]);

  const handleDelete = async (id: number) => {
    if (!confirm('このレッスンを削除してもよろしいですか？')) return;

    try {
      await adminApi.delete(`/admin/lessons/${id}`);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">レッスン管理</h1>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">タイトル</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">カテゴリ</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">作成日</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <BookOpen size={18} className="text-slate-400 dark:text-slate-500" />
                        <span className="font-medium text-slate-900 dark:text-slate-100">{lesson.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lesson.categories && lesson.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {lesson.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(lesson.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/lessons/${lesson.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                            <Edit2 size={16} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
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
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
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
