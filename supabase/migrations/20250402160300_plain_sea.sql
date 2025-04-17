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
     - Only authenticated users can modify (`INSERT`, `UPDATE`, `DELETE`) data in all tables.
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
DROP POLICY IF EXISTS "Allow public read access" ON public.songs;
CREATE POLICY "Allow public read access" ON public.songs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated modifications" ON public.songs;
CREATE POLICY "Allow authenticated modifications" ON public.songs
    FOR INSERT, UPDATE, DELETE USING (auth.role() = 'authenticated');

-- Create separate policies for INSERT, UPDATE, DELETE on public.songs

-- Policy for INSERT
CREATE POLICY "Allow authenticated insert on songs" ON public.songs
    FOR INSERT
    TO authenticated
    WITH CHECK (true); -- Or specific check like auth.role() = 'authenticated' if needed

-- Policy for UPDATE
CREATE POLICY "Allow authenticated update on songs" ON public.songs
    FOR UPDATE
    TO authenticated
    USING (true) -- Condition for which rows can be updated
    WITH CHECK (true); -- Condition for the new data

-- Policy for DELETE
CREATE POLICY "Allow authenticated delete on songs" ON public.songs
    FOR DELETE
    TO authenticated
    USING (true); -- Condition for which rows can be deleted

-- Policies for `sunday_playlists` table
DROP POLICY IF EXISTS "Allow public read access" ON public.sunday_playlists;
CREATE POLICY "Allow public read access" ON public.sunday_playlists
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated modifications" ON public.sunday_playlists;
CREATE POLICY "Allow authenticated modifications" ON public.sunday_playlists
    FOR INSERT, UPDATE, DELETE USING (auth.role() = 'authenticated');

-- Policies for `sunday_playlist_songs` table
DROP POLICY IF EXISTS "Allow public read access" ON public.sunday_playlist_songs;
CREATE POLICY "Allow public read access" ON public.sunday_playlist_songs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated modifications" ON public.sunday_playlist_songs;
CREATE POLICY "Allow authenticated modifications" ON public.sunday_playlist_songs
    FOR INSERT, UPDATE, DELETE USING (auth.role() = 'authenticated');


-- 6. Remove incorrect function (Client-side handles adding songs to playlists)
DROP FUNCTION IF EXISTS add_song_to_playlist(UUID, UUID, TEXT);

-- End of migration script