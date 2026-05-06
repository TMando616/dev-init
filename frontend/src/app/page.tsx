'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';
import api from '@/lib/api';
import { ChevronRight, BookOpen, Settings } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  content: string;
}

export default function Home() {
  const { user, logout, loading: authLoading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await api.get('/lessons');
        setLessons(response.data);
      } catch (error) {
        console.error('Failed to fetch lessons', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchLessons();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600 animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">学習コース</h2>
        <p className="text-slate-600 mt-2">ステップバイステップでプログラミングを学びましょう。</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <Link 
              key={lesson.id} 
              href={`/lessons/${lesson.id}`}
              className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{lesson.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">演習を開始するにはクリックしてください</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-slate-900 transition-colors" />
            </Link>
          ))
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500">利用可能なレッスンがまだありません。</p>
          </div>
        )}
      </div>
    </main>
  );
}
