-- Create function to check workout completion
CREATE OR REPLACE FUNCTION check_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a set completion update
  IF TG_OP = 'UPDATE' AND NEW.completed <> OLD.completed THEN
    -- Update the workout's completion status
    WITH workout_completion AS (
      SELECT 
        d.id,
        CASE 
          WHEN COUNT(*) = COUNT(*) FILTER (WHERE es.completed AND es.weight > 0 AND es.reps > 0) 
          AND COUNT(*) > 0 
          THEN true 
          ELSE false 
        END as is_complete
      FROM daily_workouts d
      JOIN workout_exercises we ON we.daily_workout_id = d.id
      JOIN exercise_sets es ON es.exercise_id = we.id
      WHERE we.id = NEW.exercise_id
      GROUP BY d.id
    )
    UPDATE daily_workouts d
    SET 
      completed = wc.is_complete,
      updated_at = CURRENT_TIMESTAMP
    FROM workout_completion wc
    WHERE d.id = wc.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exercise set updates
DROP TRIGGER IF EXISTS check_workout_completion_trigger ON exercise_sets;
CREATE TRIGGER check_workout_completion_trigger
  AFTER UPDATE OF completed, weight, reps ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION check_workout_completion();