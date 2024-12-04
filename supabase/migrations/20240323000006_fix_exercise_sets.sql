-- Drop existing triggers
DROP TRIGGER IF EXISTS check_workout_completion_trigger ON exercise_sets;
DROP FUNCTION IF EXISTS check_workout_completion();

-- Create function to check workout completion
CREATE OR REPLACE FUNCTION check_workout_completion()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
BEGIN
  -- Get the workout ID for this exercise set
  SELECT d.id INTO workout_id
  FROM workout_exercises we
  JOIN daily_workouts d ON we.daily_workout_id = d.id
  WHERE we.id = NEW.exercise_id;

  -- Update the workout's completion status
  WITH workout_stats AS (
    SELECT 
      COUNT(*) as total_sets,
      COUNT(*) FILTER (WHERE es.completed AND es.weight > 0 AND es.reps > 0) as completed_sets
    FROM workout_exercises we
    JOIN exercise_sets es ON es.exercise_id = we.id
    WHERE we.daily_workout_id = workout_id
  )
  UPDATE daily_workouts
  SET 
    completed = (
      CASE 
        WHEN ws.total_sets > 0 AND ws.total_sets = ws.completed_sets THEN true
        ELSE false
      END
    ),
    updated_at = CURRENT_TIMESTAMP
  FROM workout_stats ws
  WHERE id = workout_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exercise set updates
CREATE TRIGGER check_workout_completion_trigger
  AFTER INSERT OR UPDATE OF completed, weight, reps ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION check_workout_completion();