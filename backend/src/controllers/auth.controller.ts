import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

import {
  hashPassword,
  comparePassword,
  validatePasswordStrength
} from '../utils/password.js';

import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiry
} from '../utils/jwt.js';

import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie
} from '../utils/cookies.js';

export async function register(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email ?? '').toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required' }
      });
    }

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: pwCheck.error }
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
      });
    }

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          status: 'active',
          role: 'user'
        }
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }
        });
      }
      throw e;
    }

    const accessToken = generateAccessToken(
      user.id,
      user.email,
      (user as any).role || 'user'
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        tokenHash: refreshTokenHash,
        expiresAt,
        revoked: false
      }
    });

    const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    setRefreshTokenCookie(res, refreshToken, maxAge);

    return res.status(201).json({
      success: true,
      data: { accessToken, user: { id: user.id, email: user.email } }
    });
  } catch (error: any) {
    console.error('Register error:', error);

    if (error?.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        }
      });
    }

    console.error('Register error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed'
      }
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email ?? '').toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password required'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, passwordHash: true, role: true, status: true }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    const validPw = await comparePassword(password, user.passwordHash);
    if (!validPw) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Cleanup expired tokens (best-effort)
    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        expiresAt: { lt: new Date() },
        revoked: false
      },
      data: { revoked: true }
    });

    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.role || 'user'
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        tokenHash: refreshTokenHash,
        expiresAt,
        revoked: false
      }
    });

    const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    setRefreshTokenCookie(res, refreshToken, maxAge);

    return res.json({
      success: true,
      data: { accessToken, user: { id: user.id, email: user.email } }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Login failed' }
    });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const raw = getRefreshTokenFromCookie(req);
    if (!raw) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token required'
        }
      });
    }

    const tokenHash = hashRefreshToken(raw);

    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, role: true } } }
    });

    if (!stored) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token'
        }
      });
    }

    if (stored.revoked) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token revoked'
        }
      });
    }

    if (new Date() > stored.expiresAt) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true }
      });
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token expired'
        }
      });
    }

    // Rotate token
    const newRaw = generateRefreshToken();
    const newHash = hashRefreshToken(newRaw);
    const newExpires = getRefreshTokenExpiry();

    await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        token: newRaw,
        tokenHash: newHash,
        expiresAt: newExpires,
        revoked: false
      }
    });

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true }
    });

    const accessToken = generateAccessToken(
      stored.user.id,
      stored.user.email,
      stored.user.role || 'user'
    );

    const maxAge = Math.floor((newExpires.getTime() - Date.now()) / 1000);
    setRefreshTokenCookie(res, newRaw, maxAge);

    return res.json({ success: true, data: { accessToken } });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Token refresh failed'
      }
    });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const raw = getRefreshTokenFromCookie(req);
    if (raw) {
      const tokenHash = hashRefreshToken(raw);
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revoked: false },
        data: { revoked: true }
      });
    }

    clearRefreshTokenCookie(res);
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Logout failed'
      }
    });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = (req as any).user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        lastActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    return res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user'
      }
    });
  }
}
