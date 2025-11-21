import { defineConfig, env } from 'prisma/config'

type Env = { DATABASE_URL: string }

export default defineConfig({
  // point Prisma to your package's schema & migrations
  schema: 'backend/prisma/schema.prisma',
  migrations: { path: 'backend/prisma/migrations' },

  // Prisma 7: provide the URL for migrate/CLI
  datasource: { url: env<Env>('DATABASE_URL') },
})
