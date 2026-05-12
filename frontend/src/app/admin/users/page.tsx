'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Input } from '@/components/ui';
import api from '@/lib/api';
import { Mail, Shield, Edit2, Trash2, X, Check, UserPlus } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // New User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.push('/');
      return;
    }

    const fetchUsersData = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser?.role === 'admin') {
      fetchUsersData();
    }
  }, [currentUser, authLoading, router]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStart = (user: User) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setIsUpdating(true);
    try {
      await api.put(`/users/${editingId}`, {
        name: editName,
        email: editEmail,
        role: editRole,
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
    if (id === currentUser?.id) {
      alert('自分自身を削除することはできません。');
      return;
    }
    if (!confirm('このユーザーを削除してもよろしいですか？この操作は取り消せません。')) return;

    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
      alert('削除に失敗しました。');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/register', {
        name: newName,
        email: newEmail,
        password: newPassword,
        password_confirmation: newPassword,
        role: newRole,
      });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await fetchUsers();
    } catch (error) {
      console.error('Add user failed', error);
      alert('ユーザーの作成に失敗しました。');
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">ユーザー管理</h1>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center gap-2">
          <UserPlus size={18} />
          新規ユーザー追加
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">ユーザー名</th>
                <th className="px-6 py-4 font-semibold text-slate-700">メールアドレス</th>
                <th className="px-6 py-4 font-semibold text-slate-700">権限</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${editingId === u.id ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <Input 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          className="h-9 bg-white"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-900">{u.name}</span>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">自分</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">
                      {editingId === u.id ? (
                        <Input 
                          value={editEmail} 
                          onChange={(e) => setEditEmail(e.target.value)} 
                          className="h-9 bg-white"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" />
                          {u.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === u.id ? (
                        <select 
                          value={editRole} 
                          onChange={(e) => setEditRole(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                        >
                          <option value="user">ユーザー</option>
                          <option value="admin">管理者</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield size={14} className={u.role === 'admin' ? 'text-amber-500' : 'text-slate-400'} />
                          <span className={`text-sm ${u.role === 'admin' ? 'text-amber-600 font-medium' : 'text-slate-600'}`}>
                            {u.role === 'admin' ? '管理者' : 'ユーザー'}
                          </span>
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
                              onClick={() => handleEditStart(u)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(u.id)}
                              disabled={u.id === currentUser?.id}
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
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    ユーザーが見つかりませんでした。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-900 text-lg">新規ユーザー追加</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">お名前</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="山田 太郎" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">メールアドレス</label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">初期パスワード</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">権限</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                >
                  <option value="user">ユーザー</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1">
                  ユーザー作成
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
