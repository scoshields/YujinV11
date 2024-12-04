-- Drop existing policies and constraints
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workout_partners;
DROP POLICY IF EXISTS "Enable read access for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable update for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable delete for owners" ON workout_partners;

-- Drop existing constraints
ALTER TABLE workout_partners DROP CONSTRAINT IF EXISTS workout_partners_unique_pair;
ALTER TABLE workout_partners DROP CONSTRAINT IF EXISTS workout_partners_user_id_partner_id_key;

-- Enable RLS
ALTER TABLE workout_partners ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users" ON workout_partners
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    user_id::text != partner_id::text AND
    NOT EXISTS (
      SELECT 1 FROM workout_partners
      WHERE (user_id = auth.uid()::uuid AND partner_id = NEW.partner_id)
         OR (partner_id = auth.uid()::uuid AND user_id = NEW.partner_id)
    )
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

-- Add trigger to prevent duplicate partnerships
CREATE OR REPLACE FUNCTION check_duplicate_partnership()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM workout_partners
    WHERE (user_id = NEW.partner_id AND partner_id = NEW.user_id)
       OR (user_id = NEW.user_id AND partner_id = NEW.partner_id)
  ) THEN
    RAISE EXCEPTION 'Partnership already exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_partnership
  BEFORE INSERT ON workout_partners
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_partnership();