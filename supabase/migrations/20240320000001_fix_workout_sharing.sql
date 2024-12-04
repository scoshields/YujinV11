-- Drop existing workout_shares table if it exists
DROP TABLE IF EXISTS workout_shares CASCADE;

-- Drop existing columns from daily_workouts
ALTER TABLE daily_workouts 
DROP COLUMN IF EXISTS is_shared,
DROP COLUMN IF EXISTS shared_at;

-- Add sharing columns to daily_workouts
ALTER TABLE daily_workouts
ADD COLUMN is_shared BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN shared_with TEXT[] DEFAULT '{}';

-- Update RLS policies for daily_workouts
DROP POLICY IF EXISTS "Enable read access for involved users" ON daily_workouts;

CREATE POLICY "Enable read access for involved users" ON daily_workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weekly_workouts w
      WHERE w.id = weekly_workout_id
      AND (
        w.user_id::text = auth.uid()::text 
        OR auth.uid()::text = ANY(shared_with)
      )
    )
  );