-- Drop existing objects if they exist
DROP TABLE IF EXISTS workout_progress CASCADE;
DROP TABLE IF EXISTS exercise_sets CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS daily_workouts CASCADE;
DROP TABLE IF EXISTS weekly_workouts CASCADE;
DROP TABLE IF EXISTS workout_partners CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS workout_difficulty CASCADE;
DROP TYPE IF EXISTS partner_status CASCADE;
DROP TYPE IF EXISTS workout_status CASCADE;

-- Create custom types
CREATE TYPE workout_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE partner_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE workout_status AS ENUM ('active', 'completed');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  height DECIMAL NOT NULL CHECK (height >= 36 AND height <= 96),
  weight DECIMAL NOT NULL CHECK (weight >= 50 AND weight <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout partners table
CREATE TABLE workout_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status partner_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, partner_id)
);

-- Weekly workouts table
CREATE TABLE weekly_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status workout_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily workouts table
CREATE TABLE daily_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_workout_id UUID REFERENCES weekly_workouts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  difficulty workout_difficulty NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_workout_id UUID REFERENCES daily_workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_sets INTEGER NOT NULL CHECK (target_sets > 0),
  target_reps TEXT NOT NULL,
  body_part TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercise sets table
CREATE TABLE exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  weight DECIMAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workout progress table
CREATE TABLE workout_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weekly_workout_id UUID REFERENCES weekly_workouts(id) ON DELETE CASCADE,
  completed_workouts INTEGER NOT NULL DEFAULT 0,
  total_workouts INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, weekly_workout_id)
);

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_partners_updated_at
  BEFORE UPDATE ON workout_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_workouts_updated_at
  BEFORE UPDATE ON weekly_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_workouts_updated_at
  BEFORE UPDATE ON daily_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_sets_updated_at
  BEFORE UPDATE ON exercise_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Workout partners policies
CREATE POLICY "Enable insert for authenticated users" ON workout_partners
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable read access for involved users" ON workout_partners
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = partner_id::text
  );

CREATE POLICY "Enable update for involved users" ON workout_partners
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = partner_id::text
  );

-- Weekly workouts policies
CREATE POLICY "Enable insert for authenticated users" ON weekly_workouts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable read access for involved users" ON weekly_workouts
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR 
    auth.uid()::text = partner_id::text
  );

CREATE POLICY "Enable update for owner" ON weekly_workouts
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Daily workouts policies
CREATE POLICY "Enable insert for workout owners" ON daily_workouts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM weekly_workouts
    WHERE id = weekly_workout_id
    AND user_id::text = auth.uid()::text
  ));

CREATE POLICY "Enable read access for involved users" ON daily_workouts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM weekly_workouts
    WHERE id = weekly_workout_id
    AND (user_id::text = auth.uid()::text OR partner_id::text = auth.uid()::text)
  ));

CREATE POLICY "Enable update for workout owners" ON daily_workouts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM weekly_workouts
    WHERE id = weekly_workout_id
    AND user_id::text = auth.uid()::text
  ));

-- Exercises policies
CREATE POLICY "Enable insert for workout owners" ON exercises
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM daily_workouts d
    JOIN weekly_workouts w ON d.weekly_workout_id = w.id
    WHERE d.id = daily_workout_id
    AND w.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Enable read access for involved users" ON exercises
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM daily_workouts d
    JOIN weekly_workouts w ON d.weekly_workout_id = w.id
    WHERE d.id = daily_workout_id
    AND (w.user_id::text = auth.uid()::text OR w.partner_id::text = auth.uid()::text)
  ));

CREATE POLICY "Enable update for workout owners" ON exercises
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM daily_workouts d
    JOIN weekly_workouts w ON d.weekly_workout_id = w.id
    WHERE d.id = daily_workout_id
    AND w.user_id::text = auth.uid()::text
  ));

-- Exercise sets policies
CREATE POLICY "Enable insert for workout owners" ON exercise_sets
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM exercises e
    JOIN daily_workouts d ON e.daily_workout_id = d.id
    JOIN weekly_workouts w ON d.weekly_workout_id = w.id
    WHERE e.id = exercise_id
    AND w.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Enable read access for involved users" ON exercise_sets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM exercises e
    JOIN daily_workouts d ON e.daily_workout_id = d.id
    JOIN weekly_workouts w ON d.weekly_workout_id = w.id
    WHERE e.id = exercise_id
    AND (w.user_id::text = auth.uid()::text OR w.partner_id::text = auth.uid()::text)
  ));

CREATE POLICY "Enable update for workout owners" ON exercise_sets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM exercises e
    JOIN daily_workouts d ON e.daily_workout_id = d.id
    JOIN weekly_workouts w ON d.weekly_workout_id = w.id
    WHERE e.id = exercise_id
    AND w.user_id::text = auth.uid()::text
  ));

-- Workout progress policies
CREATE POLICY "Enable insert for authenticated users" ON workout_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Enable read access for involved users" ON workout_progress
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM weekly_workouts
      WHERE id = weekly_workout_id
      AND partner_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable update for owners" ON workout_progress
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Indexes for performance
CREATE INDEX idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX idx_workout_partners_partner_id ON workout_partners(partner_id);
CREATE INDEX idx_weekly_workouts_user_id ON weekly_workouts(user_id);
CREATE INDEX idx_weekly_workouts_partner_id ON weekly_workouts(partner_id);
CREATE INDEX idx_daily_workouts_weekly_workout_id ON daily_workouts(weekly_workout_id);
CREATE INDEX idx_exercises_daily_workout_id ON exercises(daily_workout_id);
CREATE INDEX idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX idx_workout_progress_user_id ON workout_progress(user_id);
CREATE INDEX idx_workout_progress_weekly_workout_id ON workout_progress(weekly_workout_id);