-- Reset workout_partners table
DROP TABLE IF EXISTS workout_partners CASCADE;

-- Recreate workout_partners table with simplified structure
CREATE TABLE workout_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user_id != partner_id),
  CONSTRAINT unique_partnership UNIQUE (user_id, partner_id)
);

-- Enable RLS
ALTER TABLE workout_partners ENABLE ROW LEVEL SECURITY;

-- Create basic policies
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

CREATE POLICY "Enable delete for owners" ON workout_partners
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Create indexes for performance
CREATE INDEX idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX idx_workout_partners_partner_id ON workout_partners(partner_id);