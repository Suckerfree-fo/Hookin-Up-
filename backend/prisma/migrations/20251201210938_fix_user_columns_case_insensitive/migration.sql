-- Idempotent: add columns to whichever table exists: "User" or user

DO $$
DECLARE
  tbl regclass;
BEGIN
  -- prefer the exact Prisma default first
  BEGIN
    SELECT 'public."User"'::regclass INTO tbl;
  EXCEPTION WHEN undefined_table THEN
    -- fallback to unquoted lower-case
    BEGIN
      SELECT 'public.user'::regclass INTO tbl;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Neither table "User" nor user exists in schema public.';
      RETURN;
    END;
  END;

  -- role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name = split_part(tbl::text, '.', 2)::text
      AND column_name='role'
  ) THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN role text NOT NULL DEFAULT %L', tbl, 'user');
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name = split_part(tbl::text, '.', 2)::text
      AND column_name='status'
  ) THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN status text NOT NULL DEFAULT %L', tbl, 'active');
  END IF;

  -- lastActive
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name = split_part(tbl::text, '.', 2)::text
      AND column_name='lastActive'
  ) THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN "lastActive" timestamptz NULL', tbl);
  END IF;

  -- preferred_city_slug
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name = split_part(tbl::text, '.', 2)::text
      AND column_name='preferred_city_slug'
  ) THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN preferred_city_slug text NULL', tbl);
  END IF;

  -- search_radius_km
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name = split_part(tbl::text, '.', 2)::text
      AND column_name='search_radius_km'
  ) THEN
    EXECUTE format('ALTER TABLE %s ADD COLUMN search_radius_km integer NULL DEFAULT 25', tbl);
  END IF;
END
$$;
