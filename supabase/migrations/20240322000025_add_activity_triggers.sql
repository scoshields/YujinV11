-- Create function to add activity feed entry
CREATE OR REPLACE FUNCTION add_activity_feed_entry()
RETURNS TRIGGER AS $$
DECLARE
  workout_title TEXT;
  user_name TEXT;
BEGIN
  -- Get workout title
  SELECT title INTO workout_title
  FROM daily_workouts
  WHERE id = NEW.workout_id;

  -- Get user name
  SELECT name INTO user_name
  FROM users
  WHERE id = NEW.user_id;

  -- Create activity feed entry
  INSERT INTO activity_feed (
    user_id,
    workout_id,
    activity_type,
    content
  ) VALUES (
    NEW.user_id,
    NEW.workout_id,
    NEW.activity_type,
    CASE
      WHEN NEW.activity_type = 'workout_completed' 
        THEN user_name || ' completed ' || workout_title
      WHEN NEW.activity_type = 'exercise_completed'
        THEN user_name || ' completed an exercise in ' || workout_title
      WHEN NEW.activity_type = 'weight_milestone'
        THEN user_name || ' reached a new weight milestone in ' || workout_title
      ELSE user_name || ' updated ' || workout_title
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for workout completion
CREATE OR REPLACE FUNCTION track_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND OLD.completed = false THEN
    INSERT INTO activity_feed (
      user_id,
      workout_id,
      activity_type,
      content
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'workout_completed',
      NULL -- Will be populated by add_activity_feed_entry trigger
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for exercise set completion
CREATE OR REPLACE FUNCTION track_exercise_completion()
RETURNS TRIGGER AS $$
DECLARE
  workout_id UUID;
  prev_max_weight DECIMAL;
  exercise_name TEXT;
BEGIN
  -- Get workout ID and exercise name
  SELECT 
    we.daily_workout_id,
    we.name INTO workout_id, exercise_name
  FROM workout_exercises we
  WHERE we.id = NEW.exercise_id;

  -- Check if this is a completion
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    -- Add exercise completion activity
    INSERT INTO activity_feed (
      user_id,
      workout_id,
      activity_type,
      content
    ) VALUES (
      NEW.user_id,
      workout_id,
      'exercise_completed',
      NULL -- Will be populated by add_activity_feed_entry trigger
    );
    
    -- Check for weight milestone
    SELECT MAX(weight) INTO prev_max_weight
    FROM exercise_sets es
    JOIN workout_exercises we ON es.exercise_id = we.id
    WHERE we.name = exercise_name
      AND es.user_id = NEW.user_id
      AND es.completed = true
      AND es.id != NEW.id;
      
    IF NEW.weight > COALESCE(prev_max_weight, 0) THEN
      INSERT INTO activity_feed (
        user_id,
        workout_id,
        activity_type,
        content
      ) VALUES (
        NEW.user_id,
        workout_id,
        'weight_milestone',
        NULL -- Will be populated by add_activity_feed_entry trigger
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER workout_completion_trigger
  AFTER UPDATE OF completed ON daily_workouts
  FOR EACH ROW
  EXECUTE FUNCTION track_workout_completion();

CREATE TRIGGER exercise_completion_trigger
  AFTER INSERT OR UPDATE OF completed, weight ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION track_exercise_completion();

CREATE TRIGGER activity_feed_content_trigger
  BEFORE INSERT ON activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION add_activity_feed_entry();