-- First drop all policies
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "workout_partners_insert_policy" ON workout_partners;
DROP POLICY IF EXISTS "workout_partners_select_policy" ON workout_partners;
DROP POLICY IF EXISTS "workout_partners_update_policy" ON workout_partners;
DROP POLICY IF EXISTS "workout_partners_delete_policy" ON workout_partners;

-- Reset tables
TRUNCATE daily_workouts CASCADE;
TRUNCATE workout_partners CASCADE;
TRUNCATE users CASCADE;

-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_id_fkey;
ALTER TABLE daily_workouts DROP CONSTRAINT IF EXISTS daily_workouts_user_id_fkey;
ALTER TABLE workout_partners DROP CONSTRAINT IF EXISTS workout_partners_user_id_fkey;
ALTER TABLE workout_partners DROP CONSTRAINT IF EXISTS workout_partners_partner_id_fkey;
ALTER TABLE exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_user_id_fkey;

-- Drop auth_id column
ALTER TABLE users DROP COLUMN IF EXISTS auth_id CASCADE;

-- Update users table to use auth.users(id) directly
ALTER TABLE users 
  ALTER COLUMN id SET DATA TYPE UUID,
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update foreign key constraints
ALTER TABLE daily_workouts
  ALTER COLUMN user_id SET DATA TYPE UUID,
  ADD CONSTRAINT daily_workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE workout_partners
  ALTER COLUMN user_id SET DATA TYPE UUID,
  ALTER COLUMN partner_id SET DATA TYPE UUID,
  ADD CONSTRAINT workout_partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT workout_partners_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE exercise_sets
  ALTER COLUMN user_id SET DATA TYPE UUID,
  ADD CONSTRAINT exercise_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create new policies for users table
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (true);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create new policies for workout_partners table
CREATE POLICY "workout_partners_insert_policy" ON workout_partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_partners_select_policy" ON workout_partners
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "workout_partners_update_policy" ON workout_partners
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "workout_partners_delete_policy" ON workout_partners
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_partners_partner_id ON workout_partners(partner_id);
CREATE INDEX IF NOT EXISTS idx_workout_partners_status ON workout_partners(status);
CREATE INDEX IF NOT EXISTS idx_workout_partners_is_favorite ON workout_partners(is_favorite);