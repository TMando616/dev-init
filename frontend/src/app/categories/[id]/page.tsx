'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ChevronRight, BookOpen, ArrowLeft, Tag } from 'lucide-react';

interface Lesson {
  id: number;
  title: string;
  categories: { id: number; name: string }[];
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  lessons: Lesson[];
}

export default function CategoryLessons({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await api.get(`/categories/${id}`);
        setCategory(response.data);
      } catch (error) {
        console.error('Failed to fetch category', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchCategory();
    }
  }, [id, authLoading, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-slate-600 animate-pulse font-medium">読み込み中...</p>
      </div>
    );
  }

  if (!category) return null;

  return (
    <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Tag size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">カテゴリ</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">{category.name}</h2>
          {category.description && (
            <p className="text-slate-600 mt-2">{category.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {category.lessons && category.lessons.length > 0 ? (
          category.lessons.map((lesson) => (
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
                      <span 
                        key={cat.id} 
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          cat.id === category.id 
                            ? "bg-slate-900 text-white" 
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
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
            <p className="text-slate-500">このカテゴリにはまだレッスンが登録されていません。</p>
            <Link href="/" className="text-slate-900 font-bold underline mt-4 inline-block">
              ダッシュボードへ戻る
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
