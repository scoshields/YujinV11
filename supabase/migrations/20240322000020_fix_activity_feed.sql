-- Drop existing activity feed tables if they exist
DROP TABLE IF EXISTS activity_comments CASCADE;
DROP TABLE IF EXISTS activity_reactions CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;

-- Create activity feed table
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES daily_workouts(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('workout_completed', 'exercise_completed', 'weight_milestone')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create activity reactions table
CREATE TABLE activity_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'celebrate', 'fire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create activity comments table
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for activity feed
CREATE POLICY "Enable read access for partners" ON activity_feed
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM workout_partners wp
      WHERE (wp.user_id = auth.uid() AND wp.partner_id = activity_feed.user_id)
      OR (wp.partner_id = auth.uid() AND wp.user_id = activity_feed.user_id)
      AND wp.status = 'accepted'
    )
  );

CREATE POLICY "Enable insert for own activities" ON activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);