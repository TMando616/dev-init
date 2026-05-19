'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  categories: { id: number; name: string }[];
}

export default function LessonsList() {
  const { user, loading: authLoading } = useAuth();
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-slate-600 animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-900">すべてのレッスン</h2>
          <p className="text-slate-600 mt-1">学習したいレッスンを選択してください。</p>
        </div>
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
                  <div className="flex flex-wrap gap-2 mt-1">
                    {lesson.categories?.map(cat => (
                      <span key={cat.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {cat.name}
                      </span>
                    ))}
                  </div>
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
