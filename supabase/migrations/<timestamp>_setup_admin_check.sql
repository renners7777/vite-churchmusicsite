-- filepath: supabase/migrations/YYYYMMDDHHMMSS_setup_admin_check.sql
-- Assumes a 'profiles' table linked to auth.users via an 'id' (UUID) column
-- and a 'role' (TEXT) column exists in 'profiles'.
-- Adjust schema and table names if necessary.

create or replace function public.is_admin()
returns boolean
language sql
security definer -- Allows the function to query the profiles table
set search_path = public -- Or the schema where 'profiles' resides
as $$
  select exists (
    select 1
    from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;