-- Drop any remaining activity-related objects
DO $$ 
BEGIN
  -- Drop triggers if they exist
  DROP TRIGGER IF EXISTS workout_completion_trigger ON daily_workouts CASCADE;
  DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets CASCADE;
  DROP TRIGGER IF EXISTS activity_feed_content_trigger ON activity_feed CASCADE;
  
  -- Drop functions if they exist
  DROP FUNCTION IF EXISTS track_workout_completion() CASCADE;
  DROP FUNCTION IF EXISTS track_exercise_completion() CASCADE;
  DROP FUNCTION IF EXISTS add_activity_feed_entry() CASCADE;
  
  -- Drop tables if they exist
  DROP TABLE IF EXISTS activity_comments CASCADE;
  DROP TABLE IF EXISTS activity_reactions CASCADE;
  DROP TABLE IF EXISTS activity_feed CASCADE;
  
  -- Remove any lingering foreign key constraints
  ALTER TABLE IF EXISTS daily_workouts
  DROP CONSTRAINT IF EXISTS daily_workouts_activity_feed_fkey CASCADE;
  
  -- Drop any remaining indexes
  DROP INDEX IF EXISTS idx_activity_feed_user_id;
  DROP INDEX IF EXISTS idx_activity_feed_workout_id;
  DROP INDEX IF EXISTS idx_activity_reactions_activity_id;
  DROP INDEX IF EXISTS idx_activity_reactions_user_id;
  DROP INDEX IF EXISTS idx_activity_comments_activity_id;
  DROP INDEX IF EXISTS idx_activity_comments_user_id;
  
  -- Clean up any remaining types
  DROP TYPE IF EXISTS activity_type CASCADE;
  DROP TYPE IF EXISTS reaction_type CASCADE;
  
  -- Remove any activity-related columns
  ALTER TABLE IF EXISTS daily_workouts
  DROP COLUMN IF EXISTS activity_id CASCADE;
  
  -- Remove any activity-related functions
  DROP FUNCTION IF EXISTS update_activity_feed() CASCADE;
  DROP FUNCTION IF EXISTS handle_workout_completion() CASCADE;
END $$;