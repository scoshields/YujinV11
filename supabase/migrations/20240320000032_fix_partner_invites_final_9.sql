-- Drop existing policies and constraints
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workout_partners;
DROP POLICY IF EXISTS "Enable read access for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable update for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable delete for owners" ON workout_partners;
DROP INDEX IF EXISTS workout_partners_unique_partnership;

-- Enable RLS
ALTER TABLE workout_partners ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users" ON workout_partners
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    user_id::text != partner_id::text
  );

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

-- Add unique constraint to prevent duplicate partnerships
ALTER TABLE workout_partners ADD CONSTRAINT workout_partners_no_duplicates 
  UNIQUE (LEAST(user_id, partner_id), GREATEST(user_id, partner_id));