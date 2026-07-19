'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Home,
  BookOpen,
  LogOut,
  Code2,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';

// Since I don't see a lib/utils.ts, I'll use a simple conditional class joiner
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [categories, setCategories] = React.useState<{ id: number; name: string }[]>([]);

  React.useEffect(() => {
    if (!user) return;
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const navItems = [
    { name: 'ダッシュボード', href: '/', icon: Home },
    { name: 'レッスン一覧', href: '/lessons/list', icon: BookOpen },
  ];

  // A nav item is active when its href is the most specific (longest) one matching
  // the current path. This avoids per-item exclusion lists.
  const categoryHrefs = categories.map((c) => `/categories/${c.id}`);
  const allHrefs = [...navItems.map((item) => item.href), ...categoryHrefs];

  const matchesSegment = (href: string, path: string) =>
    path === href || path.startsWith(`${href}/`);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';

    const best = allHrefs
      .filter((h) => h !== '/' && matchesSegment(h, pathname))
      .sort((a, b) => b.length - a.length)[0];

    return href === best;
  };

  return (
    <aside
      className={classNames(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 h-screen sticky top-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Code2 size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">DevInit</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white mx-auto">
            <Code2 size={20} />
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                isActive(item.href)
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <item.icon size={20} className={classNames(
                isActive(item.href) ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
              )} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="space-y-1 mt-4">
            {!isCollapsed && (
              <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">カテゴリ</p>
            )}
            {categories.map((cat) => {
              const href = `/categories/${cat.id}`;
              return (
                <Link
                  key={cat.id}
                  href={href}
                  className={classNames(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                    isActive(href)
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <Tag size={20} className={classNames(
                    isActive(href) ? "text-white dark:text-slate-900" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                  )} />
                  {!isCollapsed && <span className="font-medium">{cat.name}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        <div className={classNames(
          "flex items-center gap-3 px-3 py-2",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={classNames(
            "w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors group",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
          {!isCollapsed && <span className="font-medium">ログアウト</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
