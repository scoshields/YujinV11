-- Reset the database
TRUNCATE users CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;

-- Update users table
ALTER TABLE users 
DROP COLUMN IF EXISTS auth_id CASCADE;

ALTER TABLE users
ADD COLUMN auth_id UUID REFERENCES auth.users(id),
ALTER COLUMN email DROP NOT NULL;

-- Create new policies with proper checks
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth_id::text = auth.uid()::text
  );

CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth_id::text = auth.uid()::text);