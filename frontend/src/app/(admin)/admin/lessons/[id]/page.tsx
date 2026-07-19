'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input, Select } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import Editor from '@monaco-editor/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

const SUPPORTED_LANGUAGES = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'PHP', value: 'php' },
  { label: 'Python', value: 'python' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Java', value: 'java' },
];

export default function LessonEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const { admin, loading: authLoading } = useAdminAuth();

  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [content, setContent] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    if (!admin) return;

    const fetchCategories = async () => {
      try {
        const response = await adminApi.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();

    if (!isNew) {
      const fetchLesson = async () => {
        try {
          const response = await adminApi.get(`/lessons/${id}`);
          const lesson = response.data;
          setTitle(lesson.title);
          setLanguage(lesson.language || 'javascript');
          setContent(lesson.content);
          setModelAnswer(lesson.model_answer || '');
          setExpectedOutput(lesson.expected_output || '');
          setSelectedCategoryIds(lesson.categories?.map((c: Category) => c.id) || []);
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
  }, [id, isNew, admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoryIds.length === 0) {
      setCategoryError('カテゴリを1つ以上選択してください');
      return;
    }
    setCategoryError('');
    setIsSaving(true);

    const payload = {
      title,
      language,
      content,
      model_answer: modelAnswer,
      expected_output: expectedOutput,
      category_ids: selectedCategoryIds,
    };

    try {
      if (isNew) {
        await adminApi.post('/admin/lessons', payload);
      } else {
        await adminApi.put(`/admin/lessons/${id}`, payload);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
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
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                実行言語
              </label>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <div className={`flex flex-wrap gap-2 p-3 border rounded-md bg-slate-50/50 dark:bg-slate-800/40 min-h-[42px] ${categoryError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'}`}>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
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
                      className="w-3.5 h-3.5 rounded text-slate-900 dark:text-slate-100 focus:ring-slate-950 dark:focus:ring-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{category.name}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <span className="text-xs text-slate-500 italic">カテゴリ未登録</span>
                )}
              </div>
              {categoryError && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{categoryError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                本文 (Markdown)
              </label>
              <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden h-[500px]">
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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  模範解答 ({SUPPORTED_LANGUAGES.find(l => l.value === language)?.label})
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden h-[360px]">
                  <Editor
                    height="100%"
                    language={language}
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  期待される出力 <span className="text-xs font-normal text-slate-500">(自動判定に使用。空白の場合は判定しない)</span>
                </label>
                <textarea
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  placeholder="例: Hello, World!"
                  rows={4}
                  className="w-full font-mono text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
