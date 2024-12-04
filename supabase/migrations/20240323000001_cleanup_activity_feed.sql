-- Drop any remaining activity feed triggers
DROP TRIGGER IF EXISTS workout_completion_trigger ON daily_workouts;
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets;
DROP TRIGGER IF EXISTS activity_feed_content_trigger ON activity_feed;

-- Drop any remaining activity feed functions
DROP FUNCTION IF EXISTS track_workout_completion();
DROP FUNCTION IF EXISTS track_exercise_completion();
DROP FUNCTION IF EXISTS add_activity_feed_entry();

-- Remove any foreign key constraints that might reference activity tables
ALTER TABLE IF EXISTS daily_workouts
DROP CONSTRAINT IF EXISTS daily_workouts_activity_feed_fkey;