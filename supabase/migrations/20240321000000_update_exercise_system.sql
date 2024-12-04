-- Drop old exercises table if it exists
DROP TABLE IF EXISTS exercises CASCADE;

-- Create workout_exercises table that references available_exercises
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_workout_id UUID NOT NULL REFERENCES daily_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES available_exercises(id),
  name TEXT NOT NULL,
  target_sets INTEGER NOT NULL CHECK (target_sets > 0),
  target_reps TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

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

-- Safely handle exercise_sets foreign key update
DO $$ BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'exercise_sets_exercise_id_fkey'
        AND table_name = 'exercise_sets'
    ) THEN
        ALTER TABLE exercise_sets DROP CONSTRAINT exercise_sets_exercise_id_fkey;
    END IF;
    
    -- Add the new constraint
    ALTER TABLE exercise_sets
    ADD CONSTRAINT exercise_sets_exercise_id_fkey 
    FOREIGN KEY (exercise_id) 
    REFERENCES workout_exercises(id) 
    ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        -- If there's an error, we'll create the exercise_sets table
        CREATE TABLE IF NOT EXISTS exercise_sets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id),
            set_number INTEGER NOT NULL,
            weight DECIMAL DEFAULT 0,
            reps INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
END $$;