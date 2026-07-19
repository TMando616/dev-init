'use client';

import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button, Input } from '@/components/ui';
import adminApi from '@/lib/adminApi';
import { Mail, Trash2, X, ShieldCheck, UserPlus } from 'lucide-react';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminManagement() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite (create) State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!admin) return;

    const loadAdmins = async () => {
      try {
        const response = await adminApi.get('/admin/admins');
        setAdmins(response.data);
      } catch (error) {
        console.error('Failed to fetch admins', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdmins();
  }, [admin]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.get('/admin/admins');
      setAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch admins', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この管理者を削除してもよろしいですか？')) return;

    try {
      await adminApi.delete(`/admin/admins/${id}`);
      setAdmins(admins.filter(a => a.id !== id));
    } catch (error) {
      console.error('Delete failed', error);
      alert('削除に失敗しました。');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.post('/admin/admins', {
        name: newName,
        email: newEmail,
        password: newPassword,
        password_confirmation: newPassword,
      });
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      await fetchAdmins();
    } catch (error) {
      console.error('Add admin failed', error);
      alert('管理者の作成に失敗しました。');
    }
  };

  if (authLoading || isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">管理者管理</h1>
        <Button onClick={() => setShowAddModal(true)} size="sm" className="flex items-center gap-2">
          <UserPlus size={18} />
          管理者を招待
        </Button>
      </header>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">管理者名</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">メールアドレス</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{a.name}</span>
                      {a.id === admin?.id && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">自分</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 dark:text-slate-500" />
                      {a.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
                      onClick={() => handleDelete(a.id)}
                      disabled={a.id === admin?.id}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={14} />
          管理者は公開登録できません。既存の管理者からの招待でのみ追加されます。
        </p>
      </main>

      {/* Invite Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">管理者を招待</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">お名前</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="管理 太郎" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">メールアドレス</label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="admin@example.com" />
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
                  招待して作成
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
