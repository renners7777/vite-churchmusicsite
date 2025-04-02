/*
  # Create songs table for church music website

  1. New Tables
    - `songs`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `author` (text)
      - `youtube_url` (text)
      - `comments` (text)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `songs` table
    - Add policies for:
      - Anyone can read songs
      - Anyone can insert songs
      - Anyone can update comments
*/

CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  youtube_url text,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read songs"
  ON songs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert songs"
  ON songs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update comments"
  ON songs
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);