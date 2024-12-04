-- Drop any remaining activity feed triggers
DROP TRIGGER IF EXISTS workout_completion_trigger ON daily_workouts CASCADE;
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets CASCADE;
DROP TRIGGER IF EXISTS activity_feed_content_trigger ON activity_feed CASCADE;

-- Drop any remaining activity feed functions
DROP FUNCTION IF EXISTS track_workout_completion() CASCADE;
DROP FUNCTION IF EXISTS track_exercise_completion() CASCADE;
DROP FUNCTION IF EXISTS add_activity_feed_entry() CASCADE;

-- Remove any foreign key constraints that might reference activity tables
ALTER TABLE IF EXISTS daily_workouts
DROP CONSTRAINT IF EXISTS daily_workouts_activity_feed_fkey CASCADE;

-- Drop any remaining activity feed related indexes
DROP INDEX IF EXISTS idx_activity_feed_user_id;
DROP INDEX IF EXISTS idx_activity_feed_workout_id;
DROP INDEX IF EXISTS idx_activity_reactions_activity_id;
DROP INDEX IF EXISTS idx_activity_reactions_user_id;
DROP INDEX IF EXISTS idx_activity_comments_activity_id;
DROP INDEX IF EXISTS idx_activity_comments_user_id;