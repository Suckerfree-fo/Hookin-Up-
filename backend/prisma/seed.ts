import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const cities = [
  { slug: 'kansas-city-mo', name: 'Kansas City', state: 'MO', timezone: 'America/Chicago', longitude: -94.5786, latitude: 39.0997 },
  { slug: 'kansas-city-ks', name: 'Kansas City', state: 'KS', timezone: 'America/Chicago', longitude: -94.6275, latitude: 39.1142 },
  { slug: 'overland-park', name: 'Overland Park', state: 'KS', timezone: 'America/Chicago', longitude: -94.6708, latitude: 38.9822 },
  // ...add others you want
]

async function main() {
  // ensure table exists (no-op if already migrated)
  // await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS cities (...)') // skip if created by migrations

  for (const c of cities) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO cities (slug, name, state, timezone, longitude, latitude)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, state=EXCLUDED.state, timezone=EXCLUDED.timezone,
         longitude=EXCLUDED.longitude, latitude=EXCLUDED.latitude`,
      c.slug, c.name, c.state, c.timezone, c.longitude, c.latitude
    )
  }
}

main().then(() => {
  console.log('Seed complete')
}).catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
