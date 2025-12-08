DO $$
DECLARE
  tbl text;
BEGIN
  -- 1) Figure out whether the table is "User" or "users"
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'User'
  ) THEN
    tbl := 'User';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'users'
  ) THEN
    tbl := 'users';
  ELSE
    RAISE NOTICE 'No User/users table found in public schema, skipping fix_user_columns migration.';
    RETURN;
  END IF;

  -- 2) Ensure role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = tbl
      AND column_name  = 'role'
  ) THEN
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN role text NOT NULL DEFAULT ''user''',
      'public',
      tbl
    );
  END IF;

  -- 3) Ensure status column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = tbl
      AND column_name  = 'status'
  ) THEN
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN status text NOT NULL DEFAULT ''active''',
      'public',
      tbl
    );
  END IF;
END
$$;
