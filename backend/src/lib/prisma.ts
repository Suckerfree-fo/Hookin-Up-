// src/lib/prisma.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

// Neon requires SSL; rejectUnauthorized:false is fine for Neon
const pool = new Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
})

const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })

// optional: close pool on exit
process.on('beforeExit', async () => {
  await pool.end().catch(() => {})
})
