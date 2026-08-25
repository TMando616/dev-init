import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminPublicPath } from '@/lib/adminRoutes';

// Edge gate for the admin area. localStorage is unreadable here, so we check the
// `admin_token` cookie mirror only as a coarse UX guard — the real authorization
// boundary is the backend auth:admin guard. Public admin pages (login, and the
// unauthenticated password-reset flow) stay reachable.
//
// Note: Next.js 16 renamed the `middleware` convention to `proxy`.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith('/admin') && !isAdminPublicPath(pathname);

  if (isAdminArea && !request.cookies.get('admin_token')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
