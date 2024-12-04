-- Create new tables with _new suffix
CREATE TABLE users_new (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  height DECIMAL NOT NULL CHECK (height >= 36 AND height <= 96),
  weight DECIMAL NOT NULL CHECK (weight >= 50 AND weight <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workout_partners_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user_id != partner_id)
);

CREATE TABLE daily_workouts_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'weight_loss')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  duration INTEGER NOT NULL DEFAULT 1,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  shared_with UUID[] NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exercise_sets_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  weight DECIMAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exercise_id, user_id, set_number)
);

-- Enable RLS on new tables
ALTER TABLE users_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_partners_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_workouts_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets_new ENABLE ROW LEVEL SECURITY;

-- Create policies for users_new
CREATE POLICY "Enable insert for own profile" ON users_new
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for all users" ON users_new
  FOR SELECT USING (true);

CREATE POLICY "Enable update for own profile" ON users_new
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for workout_partners_new
CREATE POLICY "Enable insert for authenticated users" ON workout_partners_new
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for involved users" ON workout_partners_new
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Enable update for involved users" ON workout_partners_new
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() = partner_id
  );

CREATE POLICY "Enable delete for owners" ON workout_partners_new
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for daily_workouts_new
CREATE POLICY "Enable insert for authenticated users" ON daily_workouts_new
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for involved users" ON daily_workouts_new
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Enable update for owners" ON daily_workouts_new
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON daily_workouts_new
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for exercise_sets_new
CREATE POLICY "Enable insert for authenticated users" ON exercise_sets_new
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read access for involved users" ON exercise_sets_new
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN daily_workouts_new d ON we.daily_workout_id = d.id
      WHERE we.id = exercise_id
      AND auth.uid() = ANY(d.shared_with)
    )
  );

CREATE POLICY "Enable update for owners" ON exercise_sets_new
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON exercise_sets_new
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_workout_partners_new_user_id ON workout_partners_new(user_id);
CREATE INDEX idx_workout_partners_new_partner_id ON workout_partners_new(partner_id);
CREATE INDEX idx_workout_partners_new_status ON workout_partners_new(status);
CREATE INDEX idx_workout_partners_new_is_favorite ON workout_partners_new(is_favorite);
CREATE INDEX idx_daily_workouts_new_user_id ON daily_workouts_new(user_id);
CREATE INDEX idx_daily_workouts_new_shared_with ON daily_workouts_new USING gin(shared_with);
CREATE INDEX idx_exercise_sets_new_user_id ON exercise_sets_new(user_id);

-- Function to migrate data
CREATE OR REPLACE FUNCTION migrate_to_new_tables()
RETURNS void AS $$
BEGIN
  -- Migrate users data
  INSERT INTO users_new (id, username, email, name, height, weight, created_at, updated_at)
  SELECT u.auth_id, u.username, u.email, u.name, u.height, u.weight, u.created_at, u.updated_at
  FROM users u
  JOIN auth.users au ON u.auth_id = au.id;

  -- Migrate workout partners
  INSERT INTO workout_partners_new (id, user_id, partner_id, status, is_favorite, created_at, updated_at)
  SELECT wp.id, u1.auth_id, u2.auth_id, wp.status, wp.is_favorite, wp.created_at, wp.updated_at
  FROM workout_partners wp
  JOIN users u1 ON wp.user_id = u1.id
  JOIN users u2 ON wp.partner_id = u2.id;

  -- Migrate daily workouts
  INSERT INTO daily_workouts_new (
    id, user_id, date, title, workout_type, difficulty, duration,
    is_shared, shared_with, completed, is_favorite, created_at, updated_at
  )
  SELECT 
    dw.id,
    u.auth_id,
    dw.date,
    dw.title,
    dw.workout_type,
    dw.difficulty,
    dw.duration,
    dw.is_shared,
    ARRAY(
      SELECT u2.auth_id 
      FROM unnest(dw.shared_with) sw_id
      JOIN users u2 ON u2.id = sw_id::uuid
    ),
    dw.completed,
    dw.is_favorite,
    dw.created_at,
    dw.updated_at
  FROM daily_workouts dw
  JOIN users u ON dw.user_id = u.id;

  -- Migrate exercise sets
  INSERT INTO exercise_sets_new (
    id, exercise_id, user_id, set_number, weight, reps, completed, created_at, updated_at
  )
  SELECT 
    es.id,
    es.exercise_id,
    u.auth_id,
    es.set_number,
    es.weight,
    es.reps,
    es.completed,
    es.created_at,
    es.updated_at
  FROM exercise_sets es
  JOIN users u ON es.user_id = u.id;
END;
$$ LANGUAGE plpgsql;