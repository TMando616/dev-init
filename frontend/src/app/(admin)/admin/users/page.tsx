'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import { Mail, Edit2, Trash2, X, Check, UserPlus } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminUsers() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [users, setUsers] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!admin) return;

    const loadUsers = async () => {
      try {
        const response = await adminApi.get('/admin/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch students', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, [admin]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStart = (student: Student) => {
    setEditingId(student.id);
    setEditName(student.name);
    setEditEmail(student.email);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setIsUpdating(true);
    try {
      await adminApi.put(`/admin/users/${editingId}`, {
        name: editName,
        email: editEmail,
      });
      setEditingId(null);
      await fetchUsers();
    } catch (error) {
      console.error('Update failed', error);
      alert('更新に失敗しました。');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この生徒を削除してもよろしいですか？この操作は取り消せません。')) return;

    try {
      await adminApi.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
      alert('削除に失敗しました。');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post('/admin/users', {
        name: newName,
        email: newEmail,
        password: newPassword,
        password_confirmation: newPassword,
      });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await fetchUsers();
    } catch (error) {
      console.error('Add student failed', error);
      alert('生徒の作成に失敗しました。');
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">生徒管理</h1>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center gap-2">
          <UserPlus size={18} />
          新規生徒追加
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">生徒名</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">メールアドレス</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${editingId === u.id ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''}`}>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {editingId === u.id ? (
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="h-9"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400 dark:text-slate-500" />
                          {u.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === u.id ? (
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
                              onClick={() => handleEditStart(u)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                              onClick={() => handleDelete(u.id)}
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
                    生徒が見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">新規生徒追加</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">お名前</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="山田 太郎" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">メールアドレス</label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="student@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">初期パスワード</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1">
                  生徒作成
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
