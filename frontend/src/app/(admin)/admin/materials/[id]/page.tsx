'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input, Select } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import Editor from '@monaco-editor/react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ArrowLeft, Save } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Lesson {
  id: number;
  title: string;
  categories: Category[];
}

export default function MaterialEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const { admin, loading: authLoading } = useAdminAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [order, setOrder] = useState(0);
  const [lessonId, setLessonId] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilterId, setCategoryFilterId] = useState<string>('');
  const [allMaterials, setAllMaterials] = useState<{ id: number; lesson_id: number; order: number }[]>([]);
  const [orderError, setOrderError] = useState('');
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!admin) return;

    const fetchLessons = async () => {
      try {
        const response = await adminApi.get('/lessons');
        setLessons(response.data);
      } catch {
        console.error('Failed to fetch lessons');
      }
    };
    fetchLessons();

    const fetchCategories = async () => {
      try {
        const response = await adminApi.get('/categories');
        setCategories(response.data);
      } catch {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();

    const fetchMaterials = async () => {
      try {
        const response = await adminApi.get('/materials');
        setAllMaterials(response.data);
      } catch {
        console.error('Failed to fetch materials');
      }
    };
    fetchMaterials();

    if (!isNew) {
      const fetchMaterial = async () => {
        try {
          const response = await adminApi.get(`/materials/${id}`);
          const { material } = response.data;
          setTitle(material.title);
          setContent(material.content);
          setOrder(material.order);
          setLessonId(material.lesson_id ? String(material.lesson_id) : '');
        } catch {
          alert('資料の取得に失敗しました。');
          router.push('/admin/materials');
        } finally {
          setIsLoading(false);
        }
      };
      fetchMaterial();
    }
  }, [id, isNew, admin, router]);

  const filteredLessons = categoryFilterId
    ? lessons.filter((l) => l.categories.some((c) => String(c.id) === categoryFilterId))
    : lessons;

  const handleCategoryFilterChange = (newCategoryFilterId: string) => {
    setCategoryFilterId(newCategoryFilterId);
    const newFilteredLessons = newCategoryFilterId
      ? lessons.filter((l) => l.categories.some((c) => String(c.id) === newCategoryFilterId))
      : lessons;
    if (lessonId && !newFilteredLessons.some((l) => String(l.id) === lessonId)) {
      setLessonId('');
    }
  };

  const siblingOrders = allMaterials
    .filter((m) => String(m.lesson_id) === lessonId && (isNew || m.id !== Number(id)))
    .map((m) => m.order)
    .sort((a, b) => a - b);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId) {
      alert('レッスンを選択してください');
      return;
    }
    if (siblingOrders.includes(order)) {
      setOrderError(`表示順 ${order} は同じレッスン内の他の資料と重複しています。`);
      return;
    }
    setOrderError('');
    setIsSaving(true);

    const payload = {
      title,
      content,
      order,
      lesson_id: Number(lessonId),
    };

    try {
      if (isNew) {
        await adminApi.post('/admin/materials', payload);
      } else {
        await adminApi.put(`/admin/materials/${id}`, payload);
      }
      router.push('/admin/materials');
    } catch {
      alert('保存に失敗しました。内容を確認してください。');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/materials"
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">
            {isNew ? '新規学習資料作成' : '学習資料編集'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/materials')}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2">
            <Save size={18} />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-6">
        {/* メタ情報 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">タイトル</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: JavaScriptとは？"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                カテゴリで絞り込む
              </label>
              <Select value={categoryFilterId} onChange={(e) => handleCategoryFilterChange(e.target.value)}>
                <option value="">— すべて —</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                レッスン <span className="text-red-500">*</span>
              </label>
              <Select value={lessonId} onChange={(e) => setLessonId(e.target.value)} required>
                <option value="" disabled>— レッスンを選択 —</option>
                {filteredLessons.map((lesson) => (
                  <option key={lesson.id} value={String(lesson.id)}>
                    {lesson.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">表示順</label>
              <Input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
              {lessonId && (
                <p className="mt-1 text-xs text-slate-500">
                  このレッスン内の既存の表示順: {siblingOrders.length ? siblingOrders.join(', ') : 'なし'}
                </p>
              )}
              {orderError && (
                <p className="mt-1 text-xs text-red-500">{orderError}</p>
              )}
            </div>
          </div>
        </div>

        {/* エディタ + プレビュー */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">Markdownエディタ</p>
            </div>
            <Editor
              height="70vh"
              language="markdown"
              value={content}
              onChange={(val) => setContent(val ?? '')}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 14,
              }}
              theme="vs"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-700">プレビュー</p>
            </div>
            <div className="p-6 overflow-auto h-[70vh]">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-slate-400 text-sm">左のエディタに Markdown を入力すると、ここにプレビューが表示されます。</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
