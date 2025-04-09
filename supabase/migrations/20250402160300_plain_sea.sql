/*
  # Create songs table for church music website

  1. New Tables
    - `songs`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `author` (text)
      - `youtube_url` (text)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `songs` table
    - Add policies for:
      - Anyone can read songs
      - Anyone can insert songs
*/

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  youtube_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "anyone_can_read_songs"
  ON songs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "anyone_can_insert_songs"
  ON songs
  FOR INSERT
  TO public
  WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'playlists' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE playlists ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

INSERT INTO playlists (id, name, description, user_id)
VALUES
('sunday_morning', 'Sunday Morning Service', 'Playlist for Sunday morning service', NULL),
('sunday_evening', 'Sunday Evening Service', 'Playlist for Sunday evening service', NULL);