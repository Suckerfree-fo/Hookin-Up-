import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } from '../utils/jwt.js';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, firstName, age } = req.body;

    if (!email || !password || !firstName || typeof age !== 'number') {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'email, password, firstName, age are required' }});
    }
    if (age < 18 || age > 120) {
      return res.status(400).json({ success: false, error: { code: 'AGE_RESTRICTION', message: 'You must be 18 or older to register' }});
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: strength.error }});
    }

    const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() }});
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' }});
    }

    const passwordHash = await hashPassword(password);

    
const user = await prisma.user.create({
  data: {
    email: normalizedEmail,
    passwordHash,
    status: "active",
    role: "user",
    profile: {
      create: {
        firstName: (req.body?.firstName ?? "Anonymous"),
        age: (req.body?.age ?? 18),
        gender: (req.body?.gender ?? null)
      }
    }
  },
  include: { profile: true }
});

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
        revoked: false,
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email },
        tokens: { accessToken, refreshToken, expiresIn: 900 }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Registration failed' }});
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }});
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      select: { id: true, email: true, passwordHash: true }
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }});
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: getRefreshTokenExpiry(),
        revoked: false,
      }
    });

    return res.json({
      success: true,
      data: {
        user: { id: user.id, email: user.email },
        tokens: { accessToken, refreshToken, expiresIn: 900 }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' }});
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Refresh token is required' }});
    }

    let decoded: { sub: string; type: 'refresh' };
    try {
      decoded = verifyRefreshToken(refreshToken);
      if (decoded.type !== 'refresh') throw new Error('not refresh');
    } catch {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' }});
    }

    const stored = await prisma.refreshToken.findFirst({
      where: { token: refreshToken, userId: decoded.sub, revoked: false },
      include: { user: true }
    });

    if (!stored || new Date() > stored.expiresAt) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Refresh token not found or expired' }});
    }

    const accessToken = generateAccessToken(stored.userId, stored.user.email);
    return res.json({ success: true, data: { accessToken, expiresIn: 900 }});
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Token refresh failed' }});
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, revoked: false },
        data: { revoked: true }
      });
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Logout failed' }});
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true }});
    if (!user) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' }});
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get user' }});
  }
}
