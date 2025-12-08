import 'dotenv/config';
import { defineConfig } from '@prisma/config';

// Prefer pooled DATABASE_URL; fall back to DIRECT if present
const url = process.env.DATABASE_URL || process.env.DATABASE_URL_DIRECT;

if (!url) {
  throw new Error(
    'Missing DATABASE_URL (or DATABASE_URL_DIRECT). Set DATABASE_URL in env vars.'
  );
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url, // Prisma 7: URL lives here (NOT in schema.prisma)
  },
});
