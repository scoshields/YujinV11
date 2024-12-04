-- Drop existing delete policies if they exist
DROP POLICY IF EXISTS "Enable delete for workout owners" ON daily_workouts;
DROP POLICY IF EXISTS "Enable delete for exercise owners" ON exercises;
DROP POLICY IF EXISTS "Enable delete for exercise set owners" ON exercise_sets;

-- Create delete policies
CREATE POLICY "Enable delete for workout owners" ON daily_workouts
  FOR DELETE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Enable delete for exercise owners" ON exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_workouts
      WHERE id = daily_workout_id
      AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable delete for exercise set owners" ON exercise_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN daily_workouts d ON e.daily_workout_id = d.id
      WHERE e.id = exercise_id
      AND d.user_id::text = auth.uid()::text
    )
  );