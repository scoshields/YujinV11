-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for workout owners" ON exercises;
DROP POLICY IF EXISTS "Enable read access for involved users" ON exercises;
DROP POLICY IF EXISTS "Enable update for workout owners" ON exercises;

-- Create new policies for exercises
CREATE POLICY "Enable insert for exercises"
  ON exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_workouts
      WHERE id = daily_workout_id
      AND (user_id::text = auth.uid()::text)
    )
  );

CREATE POLICY "Enable read access for exercises"
  ON exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_workouts
      WHERE id = daily_workout_id
      AND (
        user_id::text = auth.uid()::text OR
        auth.uid()::text = ANY(shared_with::text[])
      )
    )
  );

CREATE POLICY "Enable update for exercises"
  ON exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_workouts
      WHERE id = daily_workout_id
      AND user_id::text = auth.uid()::text
    )
  );

-- Drop existing policies for exercise_sets
DROP POLICY IF EXISTS "Enable insert for workout owners" ON exercise_sets;
DROP POLICY IF EXISTS "Enable read access for involved users" ON exercise_sets;
DROP POLICY IF EXISTS "Enable update for workout owners" ON exercise_sets;

-- Create new policies for exercise_sets
CREATE POLICY "Enable insert for exercise sets"
  ON exercise_sets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN daily_workouts d ON e.daily_workout_id = d.id
      WHERE e.id = exercise_id
      AND d.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable read access for exercise sets"
  ON exercise_sets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN daily_workouts d ON e.daily_workout_id = d.id
      WHERE e.id = exercise_id
      AND (
        d.user_id::text = auth.uid()::text OR
        auth.uid()::text = ANY(d.shared_with::text[])
      )
    )
  );

CREATE POLICY "Enable update for exercise sets"
  ON exercise_sets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN daily_workouts d ON e.daily_workout_id = d.id
      WHERE e.id = exercise_id
      AND d.user_id::text = auth.uid()::text
    )
  );