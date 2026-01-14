-- Create profile_views table for tracking startup profile views
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_startup_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  viewer_location TEXT DEFAULT 'Unknown',
  CONSTRAINT unique_view_per_session UNIQUE (viewer_id, viewed_startup_id, DATE(viewed_at))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_views_startup ON profile_views(viewed_startup_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);

-- Enable Row Level Security
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own views
CREATE POLICY "Users can track views" ON profile_views
  FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Policy: Startups can read their own profile views
CREATE POLICY "Startups can read their views" ON profile_views
  FOR SELECT
  USING (auth.uid() = viewed_startup_id);

-- Policy: Investors can read views they created
CREATE POLICY "Investors can read their views" ON profile_views
  FOR SELECT
  USING (auth.uid() = viewer_id);
