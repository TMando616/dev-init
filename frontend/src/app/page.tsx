'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

export default function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600 animate-pulse">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">DevInit</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.name} さん</span>
          <Button variant="outline" size="sm" onClick={logout}>
            ログアウト
          </Button>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold mb-4">学習を開始しましょう</h2>
          <p className="text-slate-600 mb-8">
            DevInitへようこそ！ここではブラウザだけでプログラミングを学習できます。
            左側のメニューからレッスンを選択して、演習を開始してください（※レッスン一覧は次のタスクで実装予定です）。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <h3 className="font-bold text-lg mb-2">最近の学習</h3>
              <p className="text-sm text-slate-500">まだ学習記録がありません。</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors">
              <h3 className="font-bold text-lg mb-2">おすすめのレッスン</h3>
              <p className="text-sm text-slate-500">基本のJavaScript演習</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; 2026 DevInit.
      </footer>
    </div>
  );
}
