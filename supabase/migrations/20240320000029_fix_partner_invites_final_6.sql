-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON workout_partners;
DROP POLICY IF EXISTS "Enable read access for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable update for involved users" ON workout_partners;
DROP POLICY IF EXISTS "Enable delete for owners" ON workout_partners;

-- Create new policies with proper checks
CREATE POLICY "Enable insert for authenticated users" ON workout_partners
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text AND
    user_id::text != partner_id::text AND -- Prevent self-partnering
    NOT EXISTS ( -- Prevent duplicate invites
      SELECT 1 FROM workout_partners wp
      WHERE (wp.user_id = user_id AND wp.partner_id = partner_id)
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