-- Add workout_type to daily_workouts
ALTER TABLE daily_workouts
ADD COLUMN workout_type TEXT CHECK (workout_type IN ('strength', 'weight_loss'));

-- Update workout_exercises to store calculated duration
ALTER TABLE workout_exercises
ADD COLUMN duration INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM daily_workouts d 
      WHERE d.id = daily_workout_id 
      AND d.workout_type = 'strength'
    ) THEN target_sets * 3  -- 3 minutes per set for strength
    ELSE target_sets * 1.5::integer  -- 1.5 minutes per set for weight loss
  END
) STORED;