-- Drop existing policies and constraints
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workout_partners;
DROP POLICY IF EXISTS "Enable read access for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable update for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable delete for owners" ON workout_partners;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS prevent_duplicate_partnership ON workout_partners;
DROP FUNCTION IF EXISTS check_duplicate_partnership();

-- Drop existing constraints
ALTER TABLE workout_partners DROP CONSTRAINT IF EXISTS workout_partners_unique_pair;
ALTER TABLE workout_partners DROP CONSTRAINT IF EXISTS workout_partners_user_id_partner_id_key;

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