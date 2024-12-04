-- Reset all data while keeping the schema
TRUNCATE users CASCADE;

-- Add auth schema tables if they don't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Update users table to work with auth
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE,
ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

-- Update RLS policies for users
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_id::text);

CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on auth_id" ON users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);