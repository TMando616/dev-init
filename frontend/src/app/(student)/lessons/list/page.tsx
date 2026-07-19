'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ChevronRight, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  title: string;
  categories: { id: number; name: string }[];
}

export default function LessonsList() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, lessonsRes, completedRes] = await Promise.all([
          api.get('/categories'),
          api.get('/lessons'),
          api.get('/submissions/completed-lesson-ids'),
        ]);
        setCategories(categoriesRes.data);
        setLessons(lessonsRes.data);
        setCompletedLessonIds(new Set(completedRes.data.lesson_ids));
      } catch (error) {
        console.error('Failed to fetch lessons', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-slate-600 dark:text-slate-400 animate-pulse">読み込み中...</p>
      </div>
    );
  }

  const grouped = categories.map(cat => ({
    category: cat,
    lessons: lessons.filter(l => l.categories.some(c => c.id === cat.id)),
  }));
  const uncategorized = lessons.filter(l => l.categories.length === 0);

  const LessonCard = ({ lesson }: { lesson: Lesson }) => (
    <Link
      href={`/lessons/${lesson.id}`}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-slate-100 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
          <BookOpen size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{lesson.title}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {lesson.categories?.map(cat => (
              <span key={cat.id} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {completedLessonIds.has(lesson.id) && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={16} />
            完了
          </span>
        )}
        <ChevronRight className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
      </div>
    </Link>
  );

  const renderSection = (title: string, sectionLessons: Lesson[]) => (
    <div key={title} className="mb-8">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-1 gap-4">
        {sectionLessons.map(lesson => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </div>
  );

  const hasCategories = categories.length > 0;

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">すべてのレッスン</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">学習したいレッスンを選択してください。</p>
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
          <p className="text-slate-500">利用可能なレッスンがまだありません。</p>
        </div>
      ) : hasCategories ? (
        <>
          {grouped
            .filter(g => g.lessons.length > 0)
            .map(g => renderSection(g.category.name, g.lessons))}
          {uncategorized.length > 0 && renderSection('その他', uncategorized)}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {lessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </main>
  );
}
