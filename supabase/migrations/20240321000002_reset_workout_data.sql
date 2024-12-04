-- Reset workout data while preserving schema
TRUNCATE daily_workouts CASCADE;

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_daily_workouts_user_id;
DROP INDEX IF EXISTS idx_daily_workouts_date;
DROP INDEX IF EXISTS idx_daily_workouts_is_favorite;

-- Drop existing constraints
ALTER TABLE daily_workouts 
  ALTER COLUMN completed DROP DEFAULT,
  ALTER COLUMN is_favorite DROP DEFAULT,
  ALTER COLUMN is_shared DROP DEFAULT,
  ALTER COLUMN shared_with DROP DEFAULT;

-- Add NOT NULL constraints and defaults
ALTER TABLE daily_workouts 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN duration SET NOT NULL,
  ALTER COLUMN difficulty SET NOT NULL,
  ALTER COLUMN date SET NOT NULL;

ALTER TABLE daily_workouts
  ALTER COLUMN completed SET DEFAULT false,
  ALTER COLUMN is_favorite SET DEFAULT false,
  ALTER COLUMN is_shared SET DEFAULT false,
  ALTER COLUMN shared_with SET DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX idx_daily_workouts_user_id ON daily_workouts(user_id);
CREATE INDEX idx_daily_workouts_date ON daily_workouts(date);
CREATE INDEX idx_daily_workouts_is_favorite ON daily_workouts(is_favorite);

-- Update exercise_sets constraints
ALTER TABLE exercise_sets
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN set_number SET NOT NULL,
  ALTER COLUMN weight SET DEFAULT 0,
  ALTER COLUMN reps SET DEFAULT 0,
  ALTER COLUMN completed SET DEFAULT false;

-- Add constraint to ensure set numbers are sequential per exercise
ALTER TABLE exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_set_number_check;
ALTER TABLE exercise_sets ADD CONSTRAINT exercise_sets_set_number_check 
  CHECK (set_number > 0);

-- Add unique constraint to prevent duplicate set numbers per exercise
ALTER TABLE exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_unique_set_number;
ALTER TABLE exercise_sets ADD CONSTRAINT exercise_sets_unique_set_number 
  UNIQUE (exercise_id, user_id, set_number);