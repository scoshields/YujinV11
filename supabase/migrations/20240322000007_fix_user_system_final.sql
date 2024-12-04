-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workout_partners;
DROP POLICY IF EXISTS "Enable read access for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable update for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable delete for owners" ON workout_partners;

-- Reset tables
TRUNCATE daily_workouts CASCADE;
TRUNCATE workout_partners CASCADE;
TRUNCATE users CASCADE;

-- Update users table
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_pkey CASCADE,
  DROP CONSTRAINT IF EXISTS users_auth_id_fkey CASCADE,
  DROP COLUMN IF EXISTS auth_id CASCADE,
  ALTER COLUMN id SET DATA TYPE UUID USING id::uuid,
  ADD PRIMARY KEY (id),
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update workout_partners table
ALTER TABLE workout_partners
  ALTER COLUMN user_id SET DATA TYPE UUID USING user_id::uuid,
  ALTER COLUMN partner_id SET DATA TYPE UUID USING partner_id::uuid,
  ADD CONSTRAINT workout_partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT workout_partners_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

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
CREATE INDEX IF NOT EXISTS idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_partners_partner_id ON workout_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_workout_partners_status ON workout_partners(status);
CREATE INDEX IF NOT EXISTS idx_workout_partners_is_favorite ON workout_partners(is_favorite);