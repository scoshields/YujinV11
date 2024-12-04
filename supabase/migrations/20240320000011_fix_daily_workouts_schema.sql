-- Reset workout tables to ensure clean state
TRUNCATE daily_workouts CASCADE;

-- Add user_id column to daily_workouts if it doesn't exist
ALTER TABLE daily_workouts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Make user_id NOT NULL
ALTER TABLE daily_workouts
ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for workouts" ON daily_workouts;
DROP POLICY IF EXISTS "Enable insert for workouts" ON daily_workouts;
DROP POLICY IF EXISTS "Enable update for workouts" ON daily_workouts;

CREATE POLICY "Enable read access for workouts" ON daily_workouts
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    auth.uid()::text = ANY(shared_with::text[])
  );

CREATE POLICY "Enable insert for workouts" ON daily_workouts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update for workouts" ON daily_workouts
  FOR UPDATE USING (auth.uid()::text = user_id::text);