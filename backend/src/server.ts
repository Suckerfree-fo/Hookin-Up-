import userRoutes from './routes/user.routes.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import geoRoutes from './routes/geo.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1 as any);
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Simple request log
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ---- Login rate limiter (in-memory by default; Redis if REDIS_URL set) ----
let loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

if (process.env.REDIS_URL) {
  // Top-level await is fine under NodeNext/ESM
  const { createClient } = await import('redis');
  const { RedisStore } = await import('rate-limit-redis');
  const client = createClient({ url: process.env.REDIS_URL });
  client.on('error', (e) => console.error('Redis error', e));
  // don't await connect; redis client will queue commands
  loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => client.sendCommand(args),
      prefix: 'rl:login:',
    }) as any,
  });
}

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/v1/geo', geoRoutes);
app.use('/v1/auth/login', loginLimiter); // apply limiter only to login
app.use('/v1/auth', authRoutes);
app.use('/v1/users', userRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

// --- DEBUG ROUTES (temporary) ---
app.get('/__debug/version', (_req, res) => {
  res.json({ version: 'auth-build-1', time: new Date().toISOString() });
});

app.get('/__debug/routes', (_req, res) => {
  // @ts-ignore accessing Express internals
  const stack = (app as any)?._router?.stack || [];
  const routes = stack
    .filter((l: any) => l.route?.path)
    .map((l: any) => ({ path: l.route.path, methods: Object.keys(l.route.methods || {}) }));
  res.json({ routes });
});
// --- END DEBUG ROUTES ---
// bump 2025-11-26T14:35:57Z
