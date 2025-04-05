-- Drop the comments column from songs table
ALTER TABLE songs DROP COLUMN comments;

-- Drop the comments update policy
DROP POLICY IF EXISTS "Anyone can update comments" ON songs;
