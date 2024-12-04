-- Drop existing exercises if they exist
DROP TABLE IF EXISTS available_exercises CASCADE;

-- Create exercises table
CREATE TABLE available_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  main_muscle_group TEXT NOT NULL,
  primary_equipment TEXT NOT NULL,
  grip_style TEXT,
  mechanics TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE available_exercises ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Enable read access for all users" ON available_exercises
  FOR SELECT USING (true);

-- Insert exercises
INSERT INTO available_exercises (name, main_muscle_group, primary_equipment, grip_style, mechanics) VALUES
  ('Stability Ball Dead Bug', 'Abdominals', 'Stability Ball', 'Neutral', 'Compound'),
  ('Bodyweight Glute Bridge', 'Glutes', 'Bodyweight', 'No Grip', 'Compound'),
  ('Bodyweight Bird Dog', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Stability Ball Russian Twist', 'Abdominals', 'Stability Ball', 'Neutral', 'Compound'),
  ('Stability Ball Feet Elevated Crunch', 'Abdominals', 'Stability Ball', 'Head Supported', 'Isolation'),
  ('Ring Hanging Knee Raise', 'Abdominals', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Parallette Mountain Climber', 'Abdominals', 'Parallette Bars', 'Neutral', 'Compound'),
  ('Parallette Push Up', 'Chest', 'Parallette Bars', 'Neutral', 'Compound'),
  ('Bodyweight Knee Hover Bird Dog', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Stability Ball V Up Pass', 'Abdominals', 'Stability Ball', 'Neutral', 'Compound'),
  ('Bodyweight Dead Bug', 'Abdominals', 'Bodyweight', 'No Grip', 'Compound'),
  ('Bodyweight Alternating Heel Taps', 'Abdominals', 'Bodyweight', 'No Grip', 'Compound'),
  ('Bodyweight Flutter Kicks', 'Abdominals', 'Bodyweight', 'No Grip', 'Compound'),
  ('Bodyweight Kneeling Forearm Plank', 'Abdominals', 'Bodyweight', 'Forearm', 'Compound'),
  ('Bodyweight Seated Ab Circles', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Ring Hanging Oblique Knee Raise', 'Abdominals', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Stability Ball Stir The Pot', 'Abdominals', 'Stability Ball', 'Forearm', 'Compound'),
  ('Bodyweight Alternating Side Kick Through', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Ring L Sit Hang Flutter Kicks', 'Abdominals', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Slam Ball Russian Twist', 'Abdominals', 'Slam Ball', 'Neutral', 'Compound'),
  ('Dumbbell Otis Up', 'Abdominals', 'Dumbbell', 'Crush Grip', 'Compound'),
  ('Single Arm Dumbbell Side Plank Reach Through', 'Abdominals', 'Dumbbell', 'Neutral', 'Compound'),
  ('Ab Wheel Kneeling Rollout', 'Abdominals', 'Ab Wheel', 'Pronated', 'Compound'),
  ('Cable Seated Crunch', 'Abdominals', 'Cable', 'Neutral', 'Isolation'),
  ('Cable Kneeling Crunch', 'Abdominals', 'Cable', 'Neutral', 'Isolation'),
  ('Medicine Ball V Up', 'Abdominals', 'Medicine Ball', 'Neutral', 'Compound'),
  ('Suspension Knee Tuck', 'Abdominals', 'Suspension Trainer', 'Flat Palm', 'Compound'),
  ('Suspension Lateral Knee Tuck', 'Abdominals', 'Suspension Trainer', 'Flat Palm', 'Compound'),
  ('Bodyweight Push Up to Alternating Kick Through', 'Chest', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Single Arm Dumbbell Turkish Get Up', 'Abdominals', 'Dumbbell', 'Neutral', 'Compound'),
  ('Bodyweight Bear Crawl', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Stability Ball Knee Tuck', 'Abdominals', 'Stability Ball', 'Flat Palm', 'Compound'),
  ('Ring Hanging Leg Raise', 'Abdominals', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Parallette L Sit', 'Abdominals', 'Parallette Bars', 'Neutral', 'Compound'),
  ('Bodyweight Standing Walkout Plank', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Bodyweight Standing Walkout Push Up', 'Chest', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Barbell Climb', 'Abdominals', 'Barbell', 'Neutral', 'Compound'),
  ('Bodyweight Ipsilateral Bird Dog', 'Abdominals', 'Bodyweight', 'Flat Palm', 'Compound'),
  ('Bodyweight Copenhagen Plank Knee to Elbow', 'Adductors', 'Bodyweight', 'Forearm', 'Compound'),
  ('Ring Dead Hang', 'Back', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Suspension Archer Row', 'Shoulders', 'Suspension Trainer', 'Neutral', 'Compound'),
  ('Ring Eccentric Pull Up', 'Back', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Ring Pull Up', 'Back', 'Gymnastic Rings', 'Pronated', 'Compound'),
  ('Ring Eccentric Chin Up', 'Biceps', 'Gymnastic Rings', 'Supinated', 'Compound'),
  ('Miniband Fire Hydrant', 'Glutes', 'Miniband', 'Flat Palm', 'Isolation'),
  ('Medicine Ball Russian Twist', 'Abdominals', 'Medicine Ball', 'Neutral', 'Compound'),
  ('Bodyweight Side Plank', 'Abdominals', 'Bodyweight', 'Forearm', 'Compound'),
  ('Cable Reverse Crunch', 'Abdominals', 'Cable', 'No Grip', 'Compound'),
  ('Cable Rope Half Kneeling High to Low Chop', 'Abdominals', 'Cable', 'Pronated', 'Compound'),
  ('Cable Rope Half Kneeling Low to High Chop', 'Abdominals', 'Cable', 'Pronated', 'Compound');