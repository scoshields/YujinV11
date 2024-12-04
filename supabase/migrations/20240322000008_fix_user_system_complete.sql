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

-- Update daily_workouts table
ALTER TABLE daily_workouts
  ALTER COLUMN user_id SET DATA TYPE UUID USING user_id::uuid,
  ADD CONSTRAINT daily_workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update exercise_sets table
ALTER TABLE exercise_sets
  ALTER COLUMN user_id SET DATA TYPE UUID USING user_id::uuid,
  ADD CONSTRAINT exercise_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

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

-- Create policies for daily_workouts table
CREATE POLICY "Enable insert for workouts" ON daily_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for workouts" ON daily_workouts
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Enable update for workouts" ON daily_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for workouts" ON daily_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for exercise_sets table
CREATE POLICY "Enable insert for sets" ON exercise_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for sets" ON exercise_sets
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN daily_workouts d ON we.daily_workout_id = d.id
      WHERE we.id = exercise_id
      AND auth.uid() = ANY(d.shared_with)
    )
  );

CREATE POLICY "Enable update for sets" ON exercise_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for sets" ON exercise_sets
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_partners_partner_id ON workout_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_workout_partners_status ON workout_partners(status);
CREATE INDEX IF NOT EXISTS idx_workout_partners_is_favorite ON workout_partners(is_favorite);
CREATE INDEX IF NOT EXISTS idx_daily_workouts_user_id ON daily_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_workouts_shared_with ON daily_workouts USING gin(shared_with);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_user_id ON exercise_sets(user_id);