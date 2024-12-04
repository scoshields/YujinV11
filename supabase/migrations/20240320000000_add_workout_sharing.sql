-- Create workout shares table
CREATE TABLE workout_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES daily_workouts(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workout_id, partner_id)
);

-- Add sharing columns to daily_workouts
ALTER TABLE daily_workouts
ADD COLUMN is_shared BOOLEAN DEFAULT false,
ADD COLUMN shared_at TIMESTAMP WITH TIME ZONE;

-- Create trigger for updating shared_at
CREATE OR REPLACE FUNCTION update_shared_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_shared = true AND OLD.is_shared = false THEN
    NEW.shared_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_shared_at
  BEFORE UPDATE ON daily_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_at();

-- Add RLS policies
ALTER TABLE workout_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workout shares"
  ON workout_shares FOR SELECT
  USING (
    auth.uid()::text = partner_id::text OR
    EXISTS (
      SELECT 1 FROM daily_workouts
      WHERE id = workout_id AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create workout shares"
  ON workout_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_workouts
      WHERE id = workout_id AND user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Partners can update share status"
  ON workout_shares FOR UPDATE
  USING (auth.uid()::text = partner_id::text);