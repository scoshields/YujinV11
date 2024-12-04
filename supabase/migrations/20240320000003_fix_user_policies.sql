-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on auth_id" ON users;

-- Remove auth_id column constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_id_key;

-- Update users table
ALTER TABLE users
DROP COLUMN IF EXISTS encrypted_password,
ALTER COLUMN auth_id DROP NOT NULL;

-- Create new policies
CREATE POLICY "Enable insert for users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on auth_id" ON users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);