'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Code2,
  ChevronLeft,
  ChevronRight,
  Tag,
  PlusCircle,
  FileText
} from 'lucide-react';

// Since I don't see a lib/utils.ts, I'll use a simple conditional class joiner
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (!user) return null;

  const navItems = [
    { name: 'ダッシュボード', href: '/', icon: Home },
    { name: 'レッスン一覧', href: '/lessons/list', icon: BookOpen },
  ];

  const adminItems = [
    { name: 'レッスン管理', href: '/admin', icon: Settings },
    { name: '学習資料管理', href: '/admin/materials', icon: FileText },
    { name: 'カテゴリ管理', href: '/admin/categories', icon: Tag },
    { name: 'ユーザー管理', href: '/admin/users', icon: Users },
  ];

  // A nav item is active when its href is the most specific (longest) one matching
  // the current path. This avoids per-item exclusion lists: sibling /admin/* routes
  // light up their own item, not the parent /admin item, automatically as we add more.
  const allHrefs = [...navItems, ...adminItems].map((item) => item.href);

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
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-screen sticky top-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Code2 size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight">DevInit</span>
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
                  ? "bg-slate-900 text-white" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon size={20} className={classNames(
                isActive(item.href) ? "text-white" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </div>

        {user.role === 'admin' && (
          <div className="pt-6 space-y-4">
            {!isCollapsed && <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">管理者メニュー</p>}
            
            <Link 
              href="/admin/lessons/new"
              className={classNames(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group",
                pathname === '/admin/lessons/new'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                  : "bg-slate-50 text-blue-600 hover:bg-blue-50 border border-slate-100 hover:border-blue-100"
              )}
            >
              <PlusCircle size={20} className={classNames(
                pathname === '/admin/lessons/new' ? "text-white" : "text-blue-500"
              )} />
              {!isCollapsed && <span className="font-bold">新規レッスン作成</span>}
            </Link>

            <div className="space-y-1">
              {adminItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={classNames(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                    isActive(item.href) && pathname !== '/admin/lessons/new'
                      ? "bg-slate-900 text-white" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <item.icon size={20} className={classNames(
                    isActive(item.href) && pathname !== '/admin/lessons/new' ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {!isCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-4">
        <div className={classNames(
          "flex items-center gap-3 px-3 py-2",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={logout}
          className={classNames(
            "w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
          {!isCollapsed && <span className="font-medium">ログアウト</span>}
        </button>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
