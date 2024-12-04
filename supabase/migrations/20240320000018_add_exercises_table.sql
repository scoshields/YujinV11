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

-- Add some initial exercises
INSERT INTO available_exercises (name, main_muscle_group, primary_equipment, grip_style, mechanics) VALUES
  ('Barbell Bench Press', 'Chest', 'Barbell', 'Pronated', 'Compound'),
  ('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells', 'Neutral', 'Compound'),
  ('Pull-ups', 'Back', 'Body Weight', 'Pronated', 'Compound'),
  ('Barbell Squats', 'Legs', 'Barbell', NULL, 'Compound'),
  ('Romanian Deadlift', 'Legs', 'Barbell', 'Pronated', 'Compound'),
  ('Dumbbell Lunges', 'Legs', 'Dumbbells', NULL, 'Compound'),
  ('Barbell Rows', 'Back', 'Barbell', 'Pronated', 'Compound'),
  ('Dumbbell Flyes', 'Chest', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Lateral Raises', 'Shoulders', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Tricep Pushdowns', 'Arms', 'Cable', 'Pronated', 'Isolation'),
  ('Bicep Curls', 'Arms', 'Dumbbells', 'Supinated', 'Isolation'),
  ('Leg Press', 'Legs', 'Machine', NULL, 'Compound'),
  ('Calf Raises', 'Legs', 'Machine', NULL, 'Isolation'),
  ('Face Pulls', 'Shoulders', 'Cable', 'Pronated', 'Compound'),
  ('Incline Bench Press', 'Chest', 'Barbell', 'Pronated', 'Compound'),
  ('Lat Pulldowns', 'Back', 'Cable', 'Pronated', 'Compound'),
  ('Hammer Curls', 'Arms', 'Dumbbells', 'Neutral', 'Isolation'),
  ('Skull Crushers', 'Arms', 'Barbell', 'Pronated', 'Isolation'),
  ('Leg Extensions', 'Legs', 'Machine', NULL, 'Isolation'),
  ('Leg Curls', 'Legs', 'Machine', NULL, 'Isolation');