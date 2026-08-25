'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { isAdminPublicPath } from '@/lib/adminRoutes';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const pathname = usePathname();

  // Public pages (and any unauthenticated state) render without the admin shell.
  if (isAdminPublicPath(pathname) || loading || !admin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
