-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for sets" ON exercise_sets;
DROP POLICY IF EXISTS "Enable read access for sets" ON exercise_sets;
DROP POLICY IF EXISTS "Enable update for sets" ON exercise_sets;
DROP POLICY IF EXISTS "Enable delete for sets" ON exercise_sets;

-- Create new policies for exercise_sets with proper type handling
CREATE POLICY "Enable insert for sets" ON exercise_sets
  FOR INSERT WITH CHECK (
    auth.uid()::uuid = user_id
  );

CREATE POLICY "Enable read access for sets" ON exercise_sets
  FOR SELECT USING (
    auth.uid()::uuid = user_id OR
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN daily_workouts d ON we.daily_workout_id = d.id
      WHERE we.id = exercise_id
      AND auth.uid()::uuid = ANY(d.shared_with::uuid[])
    )
  );

CREATE POLICY "Enable update for sets" ON exercise_sets
  FOR UPDATE USING (
    auth.uid()::uuid = user_id
  );

CREATE POLICY "Enable delete for sets" ON exercise_sets
  FOR DELETE USING (
    auth.uid()::uuid = user_id
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_sets_user_id ON exercise_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_completed ON exercise_sets(completed);