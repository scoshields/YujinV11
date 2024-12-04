-- Drop existing policies
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "workout_partners_insert_policy" ON workout_partners;
DROP POLICY IF EXISTS "workout_partners_select_policy" ON workout_partners;
DROP POLICY IF EXISTS "workout_partners_update_policy" ON workout_partners;
DROP POLICY IF EXISTS "workout_partners_delete_policy" ON workout_partners;
DROP POLICY IF EXISTS "daily_workouts_insert_policy" ON daily_workouts;
DROP POLICY IF EXISTS "daily_workouts_select_policy" ON daily_workouts;
DROP POLICY IF EXISTS "daily_workouts_update_policy" ON daily_workouts;
DROP POLICY IF EXISTS "daily_workouts_delete_policy" ON daily_workouts;
DROP POLICY IF EXISTS "exercise_sets_insert_policy" ON exercise_sets;
DROP POLICY IF EXISTS "exercise_sets_select_policy" ON exercise_sets;
DROP POLICY IF EXISTS "exercise_sets_update_policy" ON exercise_sets;
DROP POLICY IF EXISTS "exercise_sets_delete_policy" ON exercise_sets;

-- Reset tables
TRUNCATE daily_workouts CASCADE;
TRUNCATE workout_partners CASCADE;
TRUNCATE users CASCADE;

-- Update users table to use auth.users(id) directly
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_pkey CASCADE,
  DROP CONSTRAINT IF EXISTS users_auth_id_fkey CASCADE,
  DROP COLUMN IF EXISTS auth_id CASCADE,
  ALTER COLUMN id SET DATA TYPE UUID USING id::uuid,
  ADD PRIMARY KEY (id),
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create policies for users table
CREATE POLICY "Enable insert for own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for workout_partners table
CREATE POLICY "Enable insert for authenticated users" ON workout_partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for involved users" ON workout_partners
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Enable update for involved users" ON workout_partners
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Enable delete for owners" ON workout_partners
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for daily_workouts table
CREATE POLICY "Enable insert for authenticated users" ON daily_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for involved users" ON daily_workouts
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Enable update for owners" ON daily_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON daily_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for exercise_sets table
CREATE POLICY "Enable insert for authenticated users" ON exercise_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for involved users" ON exercise_sets
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN daily_workouts d ON we.daily_workout_id = d.id
      WHERE we.id = exercise_id
      AND auth.uid() = ANY(d.shared_with)
    )
  );

CREATE POLICY "Enable update for owners" ON exercise_sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON exercise_sets
  FOR DELETE USING (auth.uid() = user_id);