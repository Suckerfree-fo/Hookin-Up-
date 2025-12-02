import { Response, Request } from 'express';

export const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refresh_token';
const SECURE_COOKIES = process.env.SECURE_COOKIES !== 'false'; // default true
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export function setRefreshTokenCookie(res: Response, token: string, maxAgeSeconds: number) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: 'lax',
    domain: COOKIE_DOMAIN,
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: 'lax',
    domain: COOKIE_DOMAIN,
    path: '/'
  });
}

export function getRefreshTokenFromCookie(req: Request): string | null {
  return (req as any).cookies?.[REFRESH_COOKIE_NAME] || null;
}
