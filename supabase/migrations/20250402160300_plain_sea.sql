/*
# Setup for Church Music Website Tables and RLS

1. Tables Created/Managed:
   - `songs`: Stores song details.
   - `sunday_playlists`: Defines the main Sunday service playlists (e.g., Morning, Evening).
   - `sunday_playlist_songs`: Links songs to the Sunday playlists (join table).

2. Row Level Security (RLS):
   - Enabled on all three tables.
   - Policies:
     - Anyone can read (`SELECT`) data from all tables.
     - Only users identified as 'admin' via public.is_admin() can modify (`INSERT`, `UPDATE`, `DELETE`) data.
*/

-- 1. Create `songs` table
CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT,
    youtube_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id), -- Added based on schema image
    updated_by UUID REFERENCES auth.users(id)  -- Added based on schema image
);
COMMENT ON TABLE public.songs IS 'Stores details about each worship song.';

-- 2. Create `sunday_playlists` table
CREATE TABLE IF NOT EXISTS public.sunday_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Changed from service_type, added UNIQUE
    description TEXT,          -- Added based on schema image
    user_id UUID REFERENCES auth.users(id), -- Added based on schema image (assuming this links to creator/owner)
    created_at TIMESTAMPTZ DEFAULT now() -- Kept created_at, removed incorrect song_id
);
COMMENT ON TABLE public.sunday_playlists IS 'Defines the main Sunday service playlists (e.g., Morning, Evening).';

-- 3. Create `sunday_playlist_songs` table (Join Table)
CREATE TABLE IF NOT EXISTS public.sunday_playlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Corrected foreign key reference to sunday_playlists.id
    sunday_playlist_id UUID NOT NULL REFERENCES public.sunday_playlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    position INTEGER, -- Changed to nullable based on schema image, removed NOT NULL
    created_at TIMESTAMPTZ DEFAULT now() -- Added created_at for consistency
);
COMMENT ON TABLE public.sunday_playlist_songs IS 'Links songs to specific Sunday playlists.';
-- Add indexes for performance on foreign keys
CREATE INDEX IF NOT EXISTS idx_sunday_playlist_songs_playlist_id ON public.sunday_playlist_songs(sunday_playlist_id);
CREATE INDEX IF NOT EXISTS idx_sunday_playlist_songs_song_id ON public.sunday_playlist_songs(song_id);


-- 4. Enable RLS for all tables
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sunday_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sunday_playlist_songs ENABLE ROW LEVEL SECURITY;


-- 5. Define RLS Policies

-- Policies for `songs` table
-- Drop old/incorrect policies first
DROP POLICY IF EXISTS "Allow authenticated modifications" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated insert on songs" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated update on songs" ON public.songs;
DROP POLICY IF EXISTS "Allow authenticated delete on songs" ON public.songs;
-- Drop new policies in case of re-run
DROP POLICY IF EXISTS "Allow public read access on songs" ON public.songs;
DROP POLICY IF EXISTS "Allow admin insert on songs" ON public.songs;
DROP POLICY IF EXISTS "Allow admin update on songs" ON public.songs;
DROP POLICY IF EXISTS "Allow admin delete on songs" ON public.songs;

-- Allow public read access
CREATE POLICY "Allow public read access on songs" ON public.songs
    FOR SELECT USING (true);

-- Allow ONLY admins to insert
CREATE POLICY "Allow admin insert on songs" ON public.songs
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Allow ONLY admins to update
CREATE POLICY "Allow admin update on songs" ON public.songs
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow ONLY admins to delete
CREATE POLICY "Allow admin delete on songs" ON public.songs
    FOR DELETE TO authenticated USING (public.is_admin());


-- Policies for `sunday_playlists` table
-- Drop old/incorrect policies first
DROP POLICY IF EXISTS "Allow authenticated modifications" ON public.sunday_playlists;
-- Drop new policies in case of re-run
DROP POLICY IF EXISTS "Allow public read access on sunday_playlists" ON public.sunday_playlists;
DROP POLICY IF EXISTS "Allow admin insert on sunday_playlists" ON public.sunday_playlists;
DROP POLICY IF EXISTS "Allow admin update on sunday_playlists" ON public.sunday_playlists;
DROP POLICY IF EXISTS "Allow admin delete on sunday_playlists" ON public.sunday_playlists;

-- Allow public read access
CREATE POLICY "Allow public read access on sunday_playlists" ON public.sunday_playlists
    FOR SELECT USING (true);

-- Allow ONLY admins to insert
CREATE POLICY "Allow admin insert on sunday_playlists" ON public.sunday_playlists
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Allow ONLY admins to update
CREATE POLICY "Allow admin update on sunday_playlists" ON public.sunday_playlists
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow ONLY admins to delete
CREATE POLICY "Allow admin delete on sunday_playlists" ON public.sunday_playlists
    FOR DELETE TO authenticated USING (public.is_admin());


-- Policies for `sunday_playlist_songs` table
-- Drop old/incorrect policies first
DROP POLICY IF EXISTS "Allow authenticated modifications" ON public.sunday_playlist_songs;
-- Drop new policies in case of re-run
DROP POLICY IF EXISTS "Allow public read access on sunday_playlist_songs" ON public.sunday_playlist_songs;
DROP POLICY IF EXISTS "Allow admin insert on sunday_playlist_songs" ON public.sunday_playlist_songs;
DROP POLICY IF EXISTS "Allow admin update on sunday_playlist_songs" ON public.sunday_playlist_songs;
DROP POLICY IF EXISTS "Allow admin delete on sunday_playlist_songs" ON public.sunday_playlist_songs;

-- Allow public read access
CREATE POLICY "Allow public read access on sunday_playlist_songs" ON public.sunday_playlist_songs
    FOR SELECT USING (true);

-- Allow ONLY admins to insert
CREATE POLICY "Allow admin insert on sunday_playlist_songs" ON public.sunday_playlist_songs
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Allow ONLY admins to update
CREATE POLICY "Allow admin update on sunday_playlist_songs" ON public.sunday_playlist_songs
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Allow ONLY admins to delete
CREATE POLICY "Allow admin delete on sunday_playlist_songs" ON public.sunday_playlist_songs
    FOR DELETE TO authenticated USING (public.is_admin());


-- 6. Remove incorrect function (Client-side handles adding songs to playlists)
DROP FUNCTION IF EXISTS add_song_to_playlist(UUID, UUID, TEXT);

-- End of migration script