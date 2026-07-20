-- Create a table for words
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  term TEXT NOT NULL,
  meaning JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for the words table
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own words
CREATE POLICY "Users can view their own words" ON words
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to insert their own words
CREATE POLICY "Users can insert their own words" ON words
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own words
CREATE POLICY "Users can update their own words" ON words
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for users to delete their own words
CREATE POLICY "Users can delete their own words" ON words
  FOR DELETE USING (auth.uid() = user_id);