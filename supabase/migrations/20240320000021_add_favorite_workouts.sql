-- Add is_favorite column to daily_workouts
ALTER TABLE daily_workouts
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Update existing workouts to have is_favorite set to false
UPDATE daily_workouts SET is_favorite = false WHERE is_favorite IS NULL;