-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for users" ON users;
DROP POLICY IF EXISTS "Enable read access for users" ON users;
DROP POLICY IF EXISTS "Enable update for users" ON users;
DROP POLICY IF EXISTS "Enable insert for partners" ON workout_partners;
DROP POLICY IF EXISTS "Enable read access for partners" ON workout_partners;
DROP POLICY IF EXISTS "Enable update for partners" ON workout_partners;
DROP POLICY IF EXISTS "Enable delete for partners" ON workout_partners;

-- Reset tables
TRUNCATE daily_workouts CASCADE;
TRUNCATE workout_partners CASCADE;
TRUNCATE users CASCADE;

-- Update users table
DROP TABLE users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  height DECIMAL NOT NULL CHECK (height >= 36 AND height <= 96),
  weight DECIMAL NOT NULL CHECK (weight >= 50 AND weight <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate workout_partners table
DROP TABLE workout_partners CASCADE;
CREATE TABLE workout_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user_id != partner_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_partners ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Enable insert for users" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for workout_partners table
CREATE POLICY "Enable insert for partners" ON workout_partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for partners" ON workout_partners
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Enable update for partners" ON workout_partners
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Enable delete for partners" ON workout_partners
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX idx_workout_partners_partner_id ON workout_partners(partner_id);
CREATE INDEX idx_workout_partners_status ON workout_partners(status);
CREATE INDEX idx_workout_partners_is_favorite ON workout_partners(is_favorite);