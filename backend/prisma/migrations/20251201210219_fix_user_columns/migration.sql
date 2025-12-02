-- Align production "User" table with Prisma model
-- Adds columns only if they don't exist (idempotent / safe to re-run)

DO $$
BEGIN
  -- role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='User' AND column_name='role'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN role text NOT NULL DEFAULT 'user';
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='User' AND column_name='status'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;

  -- lastActive
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='User' AND column_name='lastActive'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN "lastActive" timestamptz NULL;
  END IF;

  -- preferred_city_slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='User' AND column_name='preferred_city_slug'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN preferred_city_slug text NULL;
  END IF;

  -- search_radius_km
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='User' AND column_name='search_radius_km'
  ) THEN
    ALTER TABLE "public"."User" ADD COLUMN search_radius_km integer NULL DEFAULT 25;
  END IF;
END
$$;
