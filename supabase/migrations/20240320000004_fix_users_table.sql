-- Reset the database
TRUNCATE users CASCADE;

-- Update users table structure
ALTER TABLE users
DROP COLUMN IF EXISTS auth_id,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable insert for users" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_id" ON users;

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (auth.uid()::text = user_id::text);