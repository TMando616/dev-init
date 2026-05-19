'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import api from '@/lib/api';
import { Tag, Edit2, Trash2, X, Check, Plus, ArrowLeft } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export default function AdminCategories() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
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

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchCategoriesData = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchCategoriesData();
    }
  }, [currentUser, authLoading, router]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setIsLoading(false);
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
      await api.put(`/categories/${editingId}`, {
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
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
      alert('削除に失敗しました。レッスンが紐付いている可能性があります。');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories', {
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">カテゴリ管理</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center gap-2">
          <Plus size={18} />
          新規カテゴリ追加
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">カテゴリ名</th>
                <th className="px-6 py-4 font-semibold text-slate-700">説明</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.length > 0 ? (
                categories.map((c) => (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${editingId === c.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      {editingId === c.id ? (
                        <Input 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          className="h-9 bg-white"
                          placeholder="カテゴリ名"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Tag size={18} className="text-slate-400" />
                          <span className="font-medium text-slate-900">{c.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {editingId === c.id ? (
                        <Input 
                          value={editDescription} 
                          onChange={(e) => setEditDescription(e.target.value)} 
                          className="h-9 bg-white"
                          placeholder="説明 (任意)"
                        />
                      ) : (
                        <span className="text-slate-500">{c.description || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === c.id ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={handleUpdate}
                              disabled={isUpdating}
                            >
                              <Check size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-500 hover:text-slate-600 hover:bg-slate-100"
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
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEditStart(c)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(c.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-900 text-lg">新規カテゴリ追加</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">カテゴリ名</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="例: JavaScript基礎" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">説明</label>
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
