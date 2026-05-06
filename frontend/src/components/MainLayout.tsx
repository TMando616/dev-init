'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isPublicPath = ['/login', '/register'].includes(pathname);
  const isLessonPath = pathname.startsWith('/lessons/') && pathname.split('/').length > 2;
  
  // Don't show sidebar for public pages or if user is not loaded
  if (isPublicPath || loading || !user) {
    return <>{children}</>;
  }

  // For lesson (editor) pages, we might want to hide the sidebar by default or offer a different layout
  // But for now, let's keep it simple: if it's a lesson path, don't show the sidebar to maximize space
  if (isLessonPath) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
