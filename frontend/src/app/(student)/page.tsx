'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { 
  ChevronRight, 
  BookOpen, 
  BarChart2, 
  Clock, 
  ArrowRight,
  Tag
} from 'lucide-react';

interface DashboardData {
  overall_progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  category_progress: {
    category_id: number;
    name: string;
    completed: number;
    total: number;
  }[];
  recent_lesson: {
    id: number;
    title: string;
    last_accessed: string;
  } | null;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchDashboard();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-slate-600 animate-pulse font-medium">読み込み中...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">ダッシュボード</h2>
        <p className="text-slate-600 mt-2">ようこそ {user?.name} さん。学習を続けましょう。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overall Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 size={20} className="text-slate-500" />
              全体の進捗
            </h3>
            <span className="text-2xl font-black text-slate-900">{data.overall_progress.percentage}%</span>
          </div>

          <div className="space-y-6">
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-slate-900 h-full transition-all duration-1000 ease-out"
                style={{ width: `${data.overall_progress.percentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">完了済みレッスン</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{data.overall_progress.completed}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">全レッスン数</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{data.overall_progress.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Lesson / Continue */}
        <div className="bg-slate-900 rounded-2xl p-8 shadow-sm text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-slate-400" />
              <h3 className="text-lg font-bold">学習を再開</h3>
            </div>
            
            {data.recent_lesson ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">前回のレッスン</p>
                <h4 className="text-xl font-bold">{data.recent_lesson.title}</h4>
                <p className="text-slate-400 text-sm">
                  {new Date(data.recent_lesson.last_accessed).toLocaleDateString('ja-JP')} に学習
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">始めましょう</p>
                <h4 className="text-xl font-bold">最初のレッスンを選択してください</h4>
              </div>
            )}
          </div>

          <Link 
            href={data.recent_lesson ? `/lessons/${data.recent_lesson.id}` : '/lessons/list'} 
            className="mt-8 bg-white text-slate-900 py-3 px-6 rounded-xl font-bold flex items-center justify-between hover:bg-slate-100 transition-colors group"
          >
            {data.recent_lesson ? '学習に戻る' : 'レッスン一覧へ'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Category Progress */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Tag size={20} className="text-slate-500" />
          <h3 className="text-xl font-bold text-slate-900">カテゴリ別進捗</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.category_progress.length > 0 ? (
            data.category_progress.map((cat) => {
              const percentage = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <Link 
                  key={cat.category_id}
                  href={`/categories/${cat.category_id}`}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                      {cat.name}
                    </h4>
                    <span className="text-sm font-bold text-slate-500">{percentage}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-slate-900 h-full transition-all duration-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">{cat.completed} / {cat.total} レッスン</span>
                    <span className="text-slate-400 flex items-center gap-1 group-hover:text-slate-900 transition-colors">
                      詳細 <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <p className="text-slate-500">カテゴリがまだ登録されていません。</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access All Lessons Link */}
      <div className="flex justify-center pt-8">
        <Link href="/lessons/list" className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-2 transition-colors">
          <BookOpen size={20} />
          すべてのレッスンをブラウズする
        </Link>
      </div>
    </main>
  );
}
