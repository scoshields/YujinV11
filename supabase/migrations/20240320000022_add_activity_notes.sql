-- Create activity notes table
CREATE TABLE activity_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES daily_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE activity_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for involved users" ON activity_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_workouts d
      WHERE d.id = activity_id
      AND (
        d.user_id::text = auth.uid()::text OR
        auth.uid()::text = ANY(d.shared_with::text[])
      )
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON activity_notes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Add trigger for updated_at
CREATE TRIGGER update_activity_notes_updated_at
  BEFORE UPDATE ON activity_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();