import jwtDefault, { type SignOptions, type Secret, type JwtPayload } from 'jsonwebtoken';

// Coerce CJS default export to a typed object with sign/verify
const jwt = jwtDefault as unknown as {
  sign: (payload: object, secret: Secret, options?: SignOptions) => string;
  verify: (token: string, secret: Secret) => JwtPayload | string;
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}
const SECRET: Secret = JWT_SECRET;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';

export interface TokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

export function generateAccessToken(userId: string, email: string, role?: string): string {
  const opts: SignOptions = { expiresIn: JWT_EXPIRES_IN as unknown as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, email, role }, SECRET, opts);
}

export function generateRefreshToken(userId: string): string {
  const opts: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES_IN as unknown as SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId, type: 'refresh' }, SECRET, opts);
}

export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, SECRET) as JwtPayload;
  return decoded as TokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string; type: 'refresh' } {
  const decoded = jwt.verify(token, SECRET) as JwtPayload;
  return decoded as unknown as { sub: string; type: 'refresh' };
}

export function getRefreshTokenExpiry(): Date {
  const raw = REFRESH_TOKEN_EXPIRES_IN;
  if (raw.endsWith('d')) {
    const days = parseInt(raw.slice(0, -1), 10) || 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  if (raw.endsWith('m')) {
    const mins = parseInt(raw.slice(0, -1), 10) || 60 * 24 * 7;
    return new Date(Date.now() + mins * 60 * 1000);
  }
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
