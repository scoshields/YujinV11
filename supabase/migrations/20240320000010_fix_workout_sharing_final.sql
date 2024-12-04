-- Reset workout tables to ensure clean state
TRUNCATE daily_workouts CASCADE;

-- Remove duplicate columns from daily_workouts
ALTER TABLE daily_workouts 
DROP COLUMN IF EXISTS is_shared CASCADE,
DROP COLUMN IF EXISTS shared_with CASCADE;

-- Add sharing columns with proper constraints
ALTER TABLE daily_workouts
ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN shared_with UUID[] NOT NULL DEFAULT '{}';

-- Update RLS policies for daily_workouts
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