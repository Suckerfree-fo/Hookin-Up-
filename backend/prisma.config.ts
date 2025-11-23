import 'dotenv/config'                 // load .env early
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  // paths are relative to this backend/ folder
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },

  // Prisma 7: datasource lives in config (URL comes from env)
  datasource: {
    name: 'db',
    provider: 'postgresql',
    url: env('DATABASE_URL'),
  },
})
