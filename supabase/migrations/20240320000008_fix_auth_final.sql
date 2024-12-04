-- Reset the database
TRUNCATE users CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;

-- Update users table
ALTER TABLE users
DROP COLUMN IF EXISTS auth_id CASCADE;

ALTER TABLE users
ADD COLUMN auth_id UUID REFERENCES auth.users(id),
ALTER COLUMN email DROP NOT NULL;

-- Create policies for users table
CREATE POLICY "Enable insert for users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users" ON users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);