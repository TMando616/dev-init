'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import { Tag, Edit2, Trash2, X, Check, Plus, ArrowLeft, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  lessons_count: number;
  created_at: string;
}

interface Lesson {
  id: number;
  title: string;
}

export default function AdminCategories() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New Category State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Expand State
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedLessons, setExpandedLessons] = useState<Lesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  useEffect(() => {
    if (!admin) return;

    const loadCategories = async () => {
      try {
        const response = await adminApi.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, [admin]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = async (categoryId: number) => {
    if (expandedId === categoryId) {
      setExpandedId(null);
      setExpandedLessons([]);
      return;
    }
    setExpandedId(categoryId);
    setIsLoadingLessons(true);
    try {
      const response = await adminApi.get(`/categories/${categoryId}`);
      setExpandedLessons(response.data.lessons ?? []);
    } catch (error) {
      console.error('Failed to fetch category lessons', error);
      setExpandedLessons([]);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleEditStart = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setIsUpdating(true);
    try {
      await adminApi.put(`/admin/categories/${editingId}`, {
        name: editName,
        description: editDescription,
      });
      setEditingId(null);
      await fetchCategories();
    } catch (error) {
      console.error('Update failed', error);
      alert('更新に失敗しました。');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('このカテゴリを削除してもよろしいですか？')) return;

    try {
      await adminApi.delete(`/admin/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedLessons([]);
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert('削除に失敗しました。レッスンが紐付いている可能性があります。');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post('/admin/categories', {
        name: newName,
        description: newDescription,
      });
      setShowAddModal(false);
      setNewName('');
      setNewDescription('');
      await fetchCategories();
    } catch (error) {
      console.error('Add category failed', error);
      alert('カテゴリの作成に失敗しました。');
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">カテゴリ管理</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center gap-2">
          <Plus size={18} />
          新規カテゴリ追加
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">カテゴリ名</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">説明</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">レッスン数</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.length > 0 ? (
                categories.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${editingId === c.id ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}>
                      <td className="px-6 py-4">
                        {editingId === c.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-9"
                            placeholder="カテゴリ名"
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <Tag size={18} className="text-slate-400 dark:text-slate-500" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {editingId === c.id ? (
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="h-9"
                            placeholder="説明 (任意)"
                          />
                        ) : (
                          <span className="text-slate-500">{c.description || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleExpand(c.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <BookOpen size={12} />
                            {c.lessons_count}
                          </span>
                          {expandedId === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {editingId === c.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                onClick={handleUpdate}
                                disabled={isUpdating}
                              >
                                <Check size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => setEditingId(null)}
                                disabled={isUpdating}
                              >
                                <X size={16} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                onClick={() => handleEditStart(c)}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                                onClick={() => handleDelete(c.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr>
                        <td colSpan={4} className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                          {isLoadingLessons ? (
                            <p className="text-sm text-slate-400 dark:text-slate-500">読み込み中...</p>
                          ) : expandedLessons.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {expandedLessons.map((lesson) => (
                                <Link
                                  key={lesson.id}
                                  href={`/admin/lessons/${lesson.id}`}
                                  className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                                >
                                  <BookOpen size={12} className="text-slate-400 dark:text-slate-500" />
                                  {lesson.title}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 dark:text-slate-500">このカテゴリにはレッスンが登録されていません。</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    カテゴリが登録されていません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">新規カテゴリ追加</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">カテゴリ名</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="例: JavaScript基礎" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">説明</label>
                <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="例: プログラミングの基本を学びます" />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1">
                  カテゴリ作成
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
