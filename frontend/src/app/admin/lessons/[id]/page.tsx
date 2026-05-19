'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import api from '@/lib/api';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function LessonEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();

    if (!isNew) {
      const fetchLesson = async () => {
        try {
          const response = await api.get(`/lessons/${id}`);
          const lesson = response.data;
          setTitle(lesson.title);
          setContent(lesson.content);
          setModelAnswer(lesson.model_answer || '');
          setSelectedCategoryIds(lesson.categories?.map((c: any) => c.id) || []);
        } catch (error) {
          console.error('Failed to fetch lesson', error);
          alert('レッスンの取得に失敗しました。');
          router.push('/admin');
        } finally {
          setIsLoading(false);
        }
      };
      fetchLesson();
    }
  }, [id, isNew, user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      title,
      content,
      model_answer: modelAnswer,
      category_ids: selectedCategoryIds,
    };

    try {
      if (isNew) {
        await api.post('/lessons', payload);
      } else {
        await api.put(`/lessons/${id}`, payload);
      }
      router.push('/admin');
    } catch (error) {
      console.error('Save failed', error);
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
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">
            {isNew ? '新規レッスン作成' : 'レッスン編集'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin')} disabled={isSaving}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2">
            <Save size={18} />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                レッスンタイトル
              </label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: JavaScriptの基礎"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                カテゴリ (複数選択可)
              </label>
              <div className="flex flex-wrap gap-2 p-3 border border-slate-200 rounded-md bg-slate-50/50 min-h-[42px]">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                        } else {
                          setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                        }
                      }}
                      className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-950"
                    />
                    <span className="text-xs font-medium text-slate-700">{category.name}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <span className="text-xs text-slate-500 italic">カテゴリ未登録</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                本文 (Markdown)
              </label>
              <div className="border border-slate-200 rounded-md overflow-hidden h-[500px]">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  theme="light"
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    wordWrap: 'on',
                    padding: { top: 16 }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                模範解答 (JavaScript)
              </label>
              <div className="border border-slate-200 rounded-md overflow-hidden h-[500px]">
                <Editor
                  height="100%"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={modelAnswer}
                  onChange={(value) => setModelAnswer(value || '')}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    padding: { top: 16 }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
