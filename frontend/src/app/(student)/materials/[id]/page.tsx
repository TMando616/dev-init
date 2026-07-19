'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Material {
  id: number;
  title: string;
  content: string;
  category_id: number | null;
  order: number;
  category: { id: number; name: string } | null;
}

interface NavItem {
  id: number;
  title: string;
}

interface MaterialResponse {
  material: Material;
  prev: NavItem | null;
  next: NavItem | null;
}

export default function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<MaterialResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    const fetchMaterial = async () => {
      try {
        const response = await api.get(`/materials/${id}`);
        setData(response.data);
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterial();
  }, [id, authLoading, user, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-slate-600 dark:text-slate-400 animate-pulse font-medium">読み込み中...</p>
      </div>
    );
  }

  if (!data) return null;

  const { material, prev, next } = data;

  return (
    <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
      {/* パンくずリスト */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          ホーム
        </Link>
        {material.category && (
          <>
            <ChevronRight size={14} />
            <Link
              href={`/categories/${material.category.id}`}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              {material.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-slate-900 dark:text-slate-100 font-medium">{material.title}</span>
      </nav>

      {/* ヘッダー */}
      <div className="mb-8 flex items-start gap-4">
        <Link
          href={material.category ? `/categories/${material.category.id}` : '/'}
          className="mt-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{material.title}</h1>
      </div>

      {/* 本文 */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm mb-8">
        <MarkdownRenderer content={material.content} />
      </div>

      {/* 演習へのCTAボタン */}
      {material.category && (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 rounded-lg flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">演習で試してみよう</p>
              <p className="text-sm text-slate-500">{material.category.name} の演習問題に挑戦する</p>
            </div>
          </div>
          <Link
            href={`/categories/${material.category.id}`}
            className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-700 dark:hover:bg-slate-100/90 transition-colors"
          >
            演習一覧へ
          </Link>
        </div>
      )}

      {/* 前後ナビゲーション */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {prev ? (
            <Link
              href={`/materials/${prev.id}`}
              className="group flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
            >
              <ChevronLeft
                size={20}
                className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">前の資料</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{prev.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
        <div>
          {next ? (
            <Link
              href={`/materials/${next.id}`}
              className="group flex items-center justify-end gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all text-right"
            >
              <div className="min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">次の資料</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{next.title}</p>
              </div>
              <ChevronRight
                size={20}
                className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors flex-shrink-0"
              />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </main>
  );
}
