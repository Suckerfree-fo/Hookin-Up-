import 'dotenv/config';
import { defineConfig } from '@prisma/config';

// This uses the same DATABASE_URL your backend uses.
// It just points to the backend schema from the repo root.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('Missing DATABASE_URL (set it in backend/.env or Railway variables)');
}

export default defineConfig({
  // schema path is from the *repo root* here
  schema: './backend/prisma/schema.prisma',
  datasource: {
    provider: 'postgresql',
    url,
  },
});
