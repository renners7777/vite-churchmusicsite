-- filepath: supabase/migrations/YYYYMMDDHHMMSS_playlist_rls_policies.sql

-- Ensure RLS is enabled on the tables
alter table public.sunday_am_playlist enable row level security;
alter table public.sunday_pm_playlist enable row level security;

-- Allow read access for all authenticated users (adjust if needed)
create policy "Allow authenticated read access on sunday_am_playlist"
on public.sunday_am_playlist
for select
to authenticated
using (true);

create policy "Allow authenticated read access on sunday_pm_playlist"
on public.sunday_pm_playlist
for select
to authenticated
using (true);

-- Allow admins to insert songs
create policy "Allow admin insert on sunday_am_playlist"
on public.sunday_am_playlist
for insert
to authenticated
with check (public.is_admin()); -- Use the helper function

create policy "Allow admin insert on sunday_pm_playlist"
on public.sunday_pm_playlist
for insert
to authenticated
with check (public.is_admin()); -- Use the helper function

-- Allow admins to delete songs
create policy "Allow admin delete on sunday_am_playlist"
on public.sunday_am_playlist
for delete
to authenticated
using (public.is_admin()); -- Use the helper function

create policy "Allow admin delete on sunday_pm_playlist"
on public.sunday_pm_playlist
for delete
to authenticated
using (public.is_admin()); -- Use the helper function

-- Optional: Add policies for UPDATE if needed, likely also restricted to admins
/*
create policy "Allow admin update on sunday_am_playlist"
on public.sunday_am_playlist
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Allow admin update on sunday_pm_playlist"
on public.sunday_pm_playlist
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
*/