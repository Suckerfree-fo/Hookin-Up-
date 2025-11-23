import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import geoRoutes from './routes/geo.routes.js';
import { prisma } from './lib/prisma.js';

const app = express();

const allowed = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / same-origin
    return cb(null, allowed.length === 0 || allowed.includes(origin));
  }
}));
app.use(express.json());

// Health
app.get('/health', async (_req, res) => {
  try {
    if (process.env.DATABASE_URL) await prisma.$queryRawUnsafe('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});

// API
app.use('/v1/geo', geoRoutes);

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';
app.listen(port, host, () => console.log(`🚀 Server running on http://0.0.0.0:${port}`));
