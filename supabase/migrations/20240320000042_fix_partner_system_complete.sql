-- Reset workout_partners table
DROP TABLE IF EXISTS workout_partners CASCADE;

-- Recreate workout_partners table with simplified structure
CREATE TABLE workout_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  partner_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user_id != partner_id)
);

-- Enable RLS
ALTER TABLE workout_partners ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Enable insert for authenticated users" ON workout_partners
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = workout_partners.user_id
      AND auth_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Enable read access for involved users" ON workout_partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE (id = workout_partners.user_id OR id = workout_partners.partner_id)
      AND auth_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Enable update for involved users" ON workout_partners
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE (id = workout_partners.user_id OR id = workout_partners.partner_id)
      AND auth_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Enable delete for owners" ON workout_partners
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = workout_partners.user_id
      AND auth_id = auth.uid()::uuid
    )
  );

-- Create indexes for performance
CREATE INDEX idx_workout_partners_user_id ON workout_partners(user_id);
CREATE INDEX idx_workout_partners_partner_id ON workout_partners(partner_id);
CREATE INDEX idx_workout_partners_status ON workout_partners(status);
CREATE INDEX idx_workout_partners_is_favorite ON workout_partners(is_favorite);