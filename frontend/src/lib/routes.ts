export const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/reactivate',
] as const;

export const isPublicPath = (pathname: string): boolean =>
  (PUBLIC_PATHS as readonly string[]).includes(pathname);
