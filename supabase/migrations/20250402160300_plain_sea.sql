/*
# Create songs table for church music website

1. New Tables
- `songs`
- `id` (uuid, primary key)
- `title` (text, required)
- `author` (text)
- `youtube_url` (text)
- `created_at` (timestamp with timezone)

- `playlists`
- `id` (uuid, primary key)
- `name` (text, required)
- `description` (text)
- `created_at` (timestamp with timezone)
- `updated_at` (timestamp with timezone)

- `playlist_songs`
- `id` (uuid, primary key)
- `playlist_id` (uuid, foreign key to playlists.id)
- `song_id` (uuid, foreign key to songs.id)
- `created_at` (timestamp with timezone)
- `updated_at` (timestamp with timezone)

- `sunday_playlists`
- `id` (uuid, primary key)
- `song_id` (uuid, foreign key to songs.id)
- `service_type` (text, required, check constraint for 'morning' or 'evening')
- `created_at` (timestamp with timezone)

3. Security

- Enable RLS on `songs` table
- Add policies for:
- Anyone can read songs
- Only certain users can insert, update, delete

- Enable RLS on `sunday_playlists` table
- Add policies for:
- Anyone can read sunday_playlists
- Only certain users can insert, update, delete

`playlists`
- Enable RLS on `playlists` table
- Add policies for:
- Anyone can insert playlists
- Anyone can read playlists
- Anyone can update playlists
- Anyone can delete playlists

`playlist_songs`
- Enable RLS on `playlist_songs` table
- Add policies for:
- Authenticated users can insert playlist_songs
- Authenticated users can update playlist_songs
- Authenticated users can delete playlist_songs
- Anyone can read playlist_songs
*/

-- Create songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    author TEXT,
    youtube_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create playlists table
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create playlist_songs table
CREATE TABLE playlist_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sunday_playlists table
CREATE TABLE sunday_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('morning', 'evening')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on songs table
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for songs table
CREATE POLICY select_songs ON songs
    FOR SELECT
    USING (true);

CREATE POLICY modify_songs ON songs
    FOR INSERT, UPDATE, DELETE
    USING (auth.role() = 'admin');

-- Enable RLS on playlists table
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for playlists table
CREATE POLICY select_playlists ON playlists
    FOR SELECT
    USING (true);

CREATE POLICY modify_playlists ON playlists
    FOR INSERT, UPDATE, DELETE
    USING (auth.role() = 'admin');

-- Enable RLS on playlist_songs table
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for playlist_songs table
CREATE POLICY select_playlist_songs ON playlist_songs
    FOR SELECT
    USING (true);

CREATE POLICY modify_playlist_songs ON playlist_songs
    FOR INSERT, UPDATE, DELETE
    USING (auth.role() = 'authenticated');

-- Enable RLS on sunday_playlists table
ALTER TABLE sunday_playlists ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for sunday_playlists table
CREATE POLICY select_sunday_playlists ON sunday_playlists
    FOR SELECT
    USING (true);

-- Create function to add song to playlist or sunday playlist
CREATE OR REPLACE FUNCTION add_song_to_playlist(
    song_id UUID,
    playlist_id UUID DEFAULT NULL,
    service_type TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Add to sunday_playlists if service_type is provided
    IF service_type IS NOT NULL THEN
        INSERT INTO sunday_playlists (song_id, service_type)
        VALUES (song_id, service_type);
    -- Add to playlists if playlist_id is provided
    ELSIF playlist_id IS NOT NULL THEN
        INSERT INTO playlist_songs (playlist_id, song_id)
        VALUES (playlist_id, song_id);
    ELSE
        RAISE EXCEPTION 'Either playlist_id or service_type must be provided';
    END IF;
END;
$$ LANGUAGE plpgsql;