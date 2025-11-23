import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const cities = [
  // Missouri side
  { slug: 'kansas-city-mo',     name: 'Kansas City',        state: 'MO', latitude: 39.0997, longitude: -94.5786, timezone: 'America/Chicago' },
  { slug: 'independence',       name: 'Independence',       state: 'MO', latitude: 39.0911, longitude: -94.4155, timezone: 'America/Chicago' },
  { slug: 'lees-summit',        name: "Lee's Summit",       state: 'MO', latitude: 38.9108, longitude: -94.3822, timezone: 'America/Chicago' },
  { slug: 'blue-springs',       name: 'Blue Springs',       state: 'MO', latitude: 39.0169, longitude: -94.2816, timezone: 'America/Chicago' },
  { slug: 'liberty',            name: 'Liberty',            state: 'MO', latitude: 39.2461, longitude: -94.4191, timezone: 'America/Chicago' },
  { slug: 'raytown',            name: 'Raytown',            state: 'MO', latitude: 39.0086, longitude: -94.4636, timezone: 'America/Chicago' },
  { slug: 'gladstone',          name: 'Gladstone',          state: 'MO', latitude: 39.2039, longitude: -94.5547, timezone: 'America/Chicago' },
  { slug: 'grandview',          name: 'Grandview',          state: 'MO', latitude: 38.8850, longitude: -94.5330, timezone: 'America/Chicago' },
  { slug: 'north-kansas-city',  name: 'North Kansas City',  state: 'MO', latitude: 39.1300, longitude: -94.5786, timezone: 'America/Chicago' },

  // Kansas side (delete these if MO-only)
  { slug: 'kansas-city-ks',     name: 'Kansas City',        state: 'KS', latitude: 39.1142, longitude: -94.6275, timezone: 'America/Chicago' },
  { slug: 'overland-park',      name: 'Overland Park',      state: 'KS', latitude: 38.9822, longitude: -94.6708, timezone: 'America/Chicago' },
  { slug: 'olathe',             name: 'Olathe',             state: 'KS', latitude: 38.8814, longitude: -94.8191, timezone: 'America/Chicago' },
  { slug: 'shawnee',            name: 'Shawnee',            state: 'KS', latitude: 39.0117, longitude: -94.8191, timezone: 'America/Chicago' },
  { slug: 'lenexa',             name: 'Lenexa',             state: 'KS', latitude: 38.9536, longitude: -94.7336, timezone: 'America/Chicago' }
];

async function main() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS cities (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      timezone TEXT,
      location geography(Point,4326)
    )
  `);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS cities_slug_idx ON cities(slug)');

  // wipe any non-KC rows so browse stays clean
  await prisma.$executeRawUnsafe('DELETE FROM cities');

  for (const c of cities) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO cities (slug, name, state, latitude, longitude, timezone, location)
       VALUES ($1,$2,$3,$4,$5,$6, ST_SetSRID(ST_MakePoint($5,$4),4326)::geography)
       ON CONFLICT (slug) DO UPDATE
       SET name=EXCLUDED.name, state=EXCLUDED.state, latitude=EXCLUDED.latitude,
           longitude=EXCLUDED.longitude, timezone=EXCLUDED.timezone, location=EXCLUDED.location`,
      c.slug, c.name, c.state, c.latitude, c.longitude, c.timezone
    );
  }
  console.log('Seeded KC metro-only ✅');
}

main().catch(e => { console.error(e); process.exit(1); })
       .finally(async () => { await prisma.$disconnect(); });
