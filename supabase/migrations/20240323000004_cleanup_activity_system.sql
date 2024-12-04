-- Drop any remaining activity-related objects
DROP TABLE IF EXISTS activity_comments CASCADE;
DROP TABLE IF EXISTS activity_reactions CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;

-- Drop any remaining triggers
DROP TRIGGER IF EXISTS workout_completion_trigger ON daily_workouts CASCADE;
DROP TRIGGER IF EXISTS exercise_completion_trigger ON exercise_sets CASCADE;

-- Drop any remaining functions
DROP FUNCTION IF EXISTS track_workout_completion() CASCADE;
DROP FUNCTION IF EXISTS track_exercise_completion() CASCADE;

-- Drop any remaining types
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS reaction_type CASCADE;

-- Remove any lingering references in exercise_sets triggers
DROP TRIGGER IF EXISTS update_activity_on_set_completion ON exercise_sets CASCADE;
DROP FUNCTION IF EXISTS handle_set_completion() CASCADE;