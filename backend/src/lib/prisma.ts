// src/lib/prisma.ts (ESM-safe)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Recreate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load backend/.env no matter the CWD.
// After build, this file lives at backend/dist/lib/, so "../../.env" reaches backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

// Neon requires SSL
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// optional: close pool on exit
process.on('beforeExit', async () => {
  await pool.end().catch(() => {});
});
