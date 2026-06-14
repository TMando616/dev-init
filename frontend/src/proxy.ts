import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge gate for the admin area. localStorage is unreadable here, so we check the
// `admin_token` cookie mirror only as a coarse UX guard — the real authorization
// boundary is the backend auth:admin guard. /admin/login stays public.
//
// Note: Next.js 16 renamed the `middleware` convention to `proxy`.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';

  if (isAdminArea && !request.cookies.get('admin_token')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
