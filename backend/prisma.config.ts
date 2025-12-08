import 'dotenv/config';
import { defineConfig } from '@prisma/config';

const url = process.env.DATABASE_URL_DIRECT;
if (!url) {
  throw new Error('Missing DATABASE_URL_DIRECT (set it in backend/.env)');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url, // Prisma 7: URL lives here (NOT in schema.prisma)
  },
});
