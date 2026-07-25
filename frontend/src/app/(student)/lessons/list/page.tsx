'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getLanguageAsset } from '@/lib/languages';
import { ChevronRight, BookOpen, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  title: string;
  language: string;
  categories: { id: number; name: string }[];
}

export default function LessonsList() {
  return (
    <Suspense fallback={null}>
      <LessonsListContent />
    </Suspense>
  );
}

function LessonsListContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
    searchParams.get('language')
  );

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

  const languageCounts = Object.entries(
    lessons.reduce<Record<string, number>>((acc, l) => {
      acc[l.language] = (acc[l.language] ?? 0) + 1;
      return acc;
    }, {})
  );

  const visibleLessons = selectedLanguage
    ? lessons.filter(l => l.language === selectedLanguage)
    : lessons;

  const grouped = categories.map(cat => ({
    category: cat,
    lessons: visibleLessons.filter(l => l.categories.some(c => c.id === cat.id)),
  }));
  const uncategorized = visibleLessons.filter(l => l.categories.length === 0);

  const LessonCard = ({ lesson }: { lesson: Lesson }) => {
    const asset = getLanguageAsset(lesson.language);

    return (
    <Link
      href={`/lessons/${lesson.id}`}
      className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-slate-100 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
          {asset ? (
            <Image src={asset.image} alt={asset.label} fill sizes="48px" className="object-cover object-left" />
          ) : (
            <BookOpen size={24} />
          )}
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
  };

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

      {languageCounts.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">言語から探す</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {languageCounts.map(([language, count]) => {
              const asset = getLanguageAsset(language);
              const isSelected = selectedLanguage === language;
              return (
                <button
                  key={language}
                  onClick={() => setSelectedLanguage(isSelected ? null : language)}
                  className={`shrink-0 flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-colors ${
                    isSelected
                      ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {asset && (
                    <span className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                      <Image src={asset.image} alt="" fill sizes="20px" className="object-cover object-left" />
                    </span>
                  )}
                  <span className="text-sm font-bold">{asset?.label ?? language}</span>
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          {visibleLessons.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
              <p className="text-slate-500">該当するレッスンがありません。</p>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visibleLessons.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </main>
  );
}
