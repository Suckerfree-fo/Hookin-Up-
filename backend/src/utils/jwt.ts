import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';

const RAW_JWT_SECRET = process.env.JWT_SECRET || '';
if (RAW_JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
const JWT_SECRET: jwt.Secret = RAW_JWT_SECRET;

export const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || process.env.JWT_EXPIRES_IN || '15m';
export const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  iss: string;
  aud: string;
}

function parseDurationToSeconds(val: string): number {
  const m = /^(\d+)([smhd])$/.exec(val);
  if (!m) return 900; // default 15m
  const n = parseInt(m[1], 10);
  const u = m[2];
  if (u === 's') return n;
  if (u === 'm') return n * 60;
  if (u === 'h') return n * 3600;
  return n * 86400; // 'd'
}

export function generateAccessToken(userId: string, email: string, role: string): string {
  const payload = { sub: userId, email, role, iss: 'hookin-up', aud: 'web' };
  const opts: jwt.SignOptions = {
    algorithm: 'HS256',
    expiresIn: parseDurationToSeconds(ACCESS_TOKEN_TTL),
  };
  return jwt.sign(payload, JWT_SECRET, opts);
}

// 256-bit random token (hex), NO args
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): TokenPayload {
  const opts: jwt.VerifyOptions = { algorithms: ['HS256'], issuer: 'hookin-up', audience: 'web' };
  return jwt.verify(token, JWT_SECRET, opts) as TokenPayload;
}

export function getRefreshTokenExpiry(): Date {
  const secs = parseDurationToSeconds(REFRESH_TOKEN_TTL);
  return new Date(Date.now() + secs * 1000);
}
