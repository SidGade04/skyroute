CREATE OR REPLACE FUNCTION skyroute.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = skyroute
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  app jsonb := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb);
  given text := NULLIF(meta->>'given_name', '');
  family text := NULLIF(meta->>'family_name', '');
  full_name text := COALESCE(NULLIF(meta->>'full_name', ''), NULLIF(meta->>'name', ''), split_part(COALESCE(NEW.email, ''), '@', 1));
BEGIN
  IF given IS NULL AND family IS NULL AND full_name <> '' THEN
    given := split_part(full_name, ' ', 1);
    family := NULLIF(btrim(substr(full_name, length(given) + 1)), '');
  END IF;

  INSERT INTO skyroute.users (id, email, first_name, last_name, phone, avatar_url, provider, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    given,
    family,
    COALESCE(NULLIF(NEW.phone, ''), NULLIF(meta->>'phone', '')),
    COALESCE(NULLIF(meta->>'avatar_url', ''), NULLIF(meta->>'picture', '')),
    NULLIF(app->>'provider', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = COALESCE(EXCLUDED.phone, skyroute.users.phone),
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    updated_at = now();

  RETURN NEW;
END;
$$;
