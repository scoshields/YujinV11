-- Drop existing duration calculation functions and triggers
DROP TRIGGER IF EXISTS update_workout_duration_trigger ON workout_exercises;
DROP FUNCTION IF EXISTS update_workout_duration();
DROP FUNCTION IF EXISTS calculate_workout_duration(UUID);

-- Add workout_type to daily_workouts if it doesn't exist
ALTER TABLE daily_workouts
DROP COLUMN IF EXISTS workout_type;

ALTER TABLE daily_workouts
ADD COLUMN workout_type TEXT NOT NULL DEFAULT 'strength'
CHECK (workout_type IN ('strength', 'weight_loss'));

-- Create function to calculate workout duration
CREATE OR REPLACE FUNCTION calculate_workout_duration(workout_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_duration INTEGER;
  workout_type TEXT;
BEGIN
  -- Get the workout type
  SELECT d.workout_type INTO workout_type
  FROM daily_workouts d
  WHERE d.id = workout_id;

  -- Calculate total duration based on workout type and total sets
  SELECT 
    CASE 
      WHEN workout_type = 'strength' THEN SUM(target_sets) * 3  -- 3 minutes per set
      ELSE SUM(target_sets) * 2  -- 2 minutes per set for weight loss
    END INTO total_duration
  FROM workout_exercises
  WHERE daily_workout_id = workout_id;

  -- Return at least 1 minute duration
  RETURN GREATEST(COALESCE(total_duration, 0), 1);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update duration
CREATE OR REPLACE FUNCTION update_workout_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT/UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE daily_workouts
    SET duration = calculate_workout_duration(NEW.daily_workout_id)
    WHERE id = NEW.daily_workout_id;
    RETURN NEW;
  END IF;
  
  -- For DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE daily_workouts
    SET duration = calculate_workout_duration(OLD.daily_workout_id)
    WHERE id = OLD.daily_workout_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workout_exercises
CREATE TRIGGER update_workout_duration_trigger
AFTER INSERT OR UPDATE OR DELETE ON workout_exercises
FOR EACH ROW EXECUTE FUNCTION update_workout_duration();