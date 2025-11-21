import { defineConfig, env } from 'prisma/config'

type Env = { DATABASE_URL: string }

export default defineConfig({
  // paths are relative to this working directory (backend/)
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },

  // Prisma 7: provide datasource url for migrate/CLI
  datasource: { url: env<Env>('DATABASE_URL') },
})
