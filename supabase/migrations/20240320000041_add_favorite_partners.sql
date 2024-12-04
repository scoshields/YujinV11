-- Add is_favorite column to workout_partners
ALTER TABLE workout_partners
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Update existing partnerships
UPDATE workout_partners SET is_favorite = false WHERE is_favorite IS NULL;