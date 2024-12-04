-- Reset the database
TRUNCATE users CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;

-- Update users table
ALTER TABLE users
DROP COLUMN IF EXISTS user_id CASCADE,
ADD COLUMN auth_id UUID REFERENCES auth.users(id);

-- Create policies for users table
CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth_id::text);

CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);

-- Update daily_workouts table
ALTER TABLE daily_workouts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}';

-- Update RLS policies for daily_workouts
DROP POLICY IF EXISTS "Enable read access for involved users" ON daily_workouts;

CREATE POLICY "Enable read access for workouts" ON daily_workouts
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    auth.uid()::text = ANY(shared_with::text[])
  );

CREATE POLICY "Enable insert for authenticated users" ON daily_workouts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update for workout owners" ON daily_workouts
  FOR UPDATE USING (auth.uid()::text = user_id::text);