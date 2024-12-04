-- Add user_id to exercise_sets table
ALTER TABLE exercise_sets
ADD COLUMN user_id UUID REFERENCES users(id);

-- Update existing exercise sets with user_id from daily_workouts
UPDATE exercise_sets es
SET user_id = dw.user_id
FROM exercises e
JOIN daily_workouts dw ON e.daily_workout_id = dw.id
WHERE es.exercise_id = e.id;

-- Make user_id NOT NULL after updating existing data
ALTER TABLE exercise_sets
ALTER COLUMN user_id SET NOT NULL;

-- Add index for performance
CREATE INDEX idx_exercise_sets_user_id ON exercise_sets(user_id);

-- Update RLS policies for exercise_sets
DROP POLICY IF EXISTS "Enable read access for exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Enable insert for exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Enable update for exercise sets" ON exercise_sets;
DROP POLICY IF EXISTS "Enable delete for exercise sets" ON exercise_sets;

CREATE POLICY "Enable read access for exercise sets" ON exercise_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = exercise_sets.user_id
      AND auth_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Enable insert for exercise sets" ON exercise_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = exercise_sets.user_id
      AND auth_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Enable update for exercise sets" ON exercise_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = exercise_sets.user_id
      AND auth_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Enable delete for exercise sets" ON exercise_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = exercise_sets.user_id
      AND auth_id = auth.uid()::uuid
    )
  );