'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input, Select } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import { Edit2, Trash2, FileText, PlusCircle } from 'lucide-react';

interface Material {
  id: number;
  title: string;
  order: number;
  lesson: { id: number; title: string; categories: { id: number; name: string }[] } | null;
  created_at: string;
}

export default function AdminMaterials() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [titleQuery, setTitleQuery] = useState('');
  const [lessonFilterId, setLessonFilterId] = useState<string>('');
  const [categoryFilterId, setCategoryFilterId] = useState<string>('');

  useEffect(() => {
    if (!admin) return;

    const fetchMaterials = async () => {
      try {
        const response = await adminApi.get('/materials');
        setMaterials(response.data);
      } catch (error) {
        console.error('Failed to fetch materials', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [admin]);

  const lessonOptions = Array.from(
    new Map(materials.filter((m) => m.lesson).map((m) => [m.lesson!.id, m.lesson!])).values()
  );
  const categoryOptions = Array.from(
    new Map(materials.flatMap((m) => m.lesson?.categories ?? []).map((c) => [c.id, c])).values()
  );

  const filteredMaterials = materials.filter((m) =>
    (!titleQuery || m.title.includes(titleQuery)) &&
    (!lessonFilterId || String(m.lesson?.id) === lessonFilterId) &&
    (!categoryFilterId || (m.lesson?.categories ?? []).some((c) => String(c.id) === categoryFilterId))
  );

  const handleDelete = async (id: number) => {
    if (!confirm('この学習資料を削除してもよろしいですか？')) return;

    try {
      await adminApi.delete(`/admin/materials/${id}`);
      setMaterials(materials.filter((m) => m.id !== id));
    } catch {
      alert('削除に失敗しました。');
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">学習資料管理</h1>
        </div>
        <Link href="/admin/materials/new">
          <Button className="flex items-center gap-2">
            <PlusCircle size={16} />
            新規作成
          </Button>
        </Link>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="タイトルで検索"
            className="max-w-xs"
          />
          <Select
            value={lessonFilterId}
            onChange={(e) => setLessonFilterId(e.target.value)}
            className="max-w-xs"
          >
            <option value="">— レッスン: すべて —</option>
            {lessonOptions.map((lesson) => (
              <option key={lesson.id} value={String(lesson.id)}>
                {lesson.title}
              </option>
            ))}
          </Select>
          <Select
            value={categoryFilterId}
            onChange={(e) => setCategoryFilterId(e.target.value)}
            className="max-w-xs"
          >
            <option value="">— カテゴリ: すべて —</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">タイトル</th>
                <th className="px-6 py-4 font-semibold text-slate-700">レッスン</th>
                <th className="px-6 py-4 font-semibold text-slate-700">カテゴリ</th>
                <th className="px-6 py-4 font-semibold text-slate-700">順序</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <span className="font-medium text-slate-900">{material.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {material.lesson?.title ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {material.lesson?.categories.length ? (
                          material.lesson.categories.map((c) => (
                            <span
                              key={c.id}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{material.order}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/materials/${material.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 size={16} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(material.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {materials.length === 0
                      ? '学習資料が登録されていません。'
                      : '条件に一致する学習資料がありません。'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
