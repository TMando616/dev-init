export const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
] as const;

export const isAdminPublicPath = (pathname: string): boolean =>
  (ADMIN_PUBLIC_PATHS as readonly string[]).includes(pathname);
