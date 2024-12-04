-- Drop existing tables to ensure clean slate
DROP TABLE IF EXISTS exercise_sets CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;

-- Create workout_exercises table
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_workout_id UUID NOT NULL REFERENCES daily_workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_sets INTEGER NOT NULL CHECK (target_sets > 0),
  target_reps TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exercise_sets table
CREATE TABLE exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  weight DECIMAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_exercises
CREATE POLICY "Enable read access for workout exercises" ON workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_workouts d
      WHERE d.id = daily_workout_id
      AND (
        d.user_id::text = auth.uid()::text OR
        auth.uid()::text = ANY(d.shared_with::text[])
      )
    )
  );

CREATE POLICY "Enable insert for workout exercises" ON workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_workouts d
      WHERE d.id = daily_workout_id
      AND d.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable update for workout exercises" ON workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_workouts d
      WHERE d.id = daily_workout_id
      AND d.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable delete for workout exercises" ON workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_workouts d
      WHERE d.id = daily_workout_id
      AND d.user_id::text = auth.uid()::text
    )
  );

-- Create policies for exercise_sets
CREATE POLICY "Enable read access for exercise sets" ON exercise_sets
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN daily_workouts d ON we.daily_workout_id = d.id
      WHERE we.id = exercise_id
      AND auth.uid()::text = ANY(d.shared_with::text[])
    )
  );

CREATE POLICY "Enable insert for exercise sets" ON exercise_sets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable update for exercise sets" ON exercise_sets
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Enable delete for exercise sets" ON exercise_sets
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_workout_exercises_daily_workout_id ON workout_exercises(daily_workout_id);
CREATE INDEX idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX idx_exercise_sets_user_id ON exercise_sets(user_id);