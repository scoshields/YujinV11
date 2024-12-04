-- Reset and recreate exercise_sets table with proper user tracking
DROP TABLE IF EXISTS exercise_sets CASCADE;

CREATE TABLE exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  weight DECIMAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX idx_exercise_sets_user_id ON exercise_sets(user_id);
CREATE INDEX idx_exercise_sets_completed ON exercise_sets(completed);

-- Create RLS policies
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