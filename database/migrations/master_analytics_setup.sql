-- ============================================
-- KASB.AI Analytics Master Setup Script
-- ============================================
-- This script creates all necessary tables for the analytics system
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. CONNECTIONS TABLE
-- ============================================
-- Tracks connection requests between investors and startups

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  deal_closed BOOLEAN DEFAULT FALSE,
  deal_closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_connection UNIQUE (sender_id, receiver_id)
);

-- Indexes for connections
CREATE INDEX IF NOT EXISTS idx_connections_sender ON connections(sender_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_created ON connections(created_at DESC);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Policies for connections
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
CREATE POLICY "Users can view their connections" ON connections
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create connections" ON connections;
CREATE POLICY "Users can create connections" ON connections
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their connections" ON connections;
CREATE POLICY "Users can update their connections" ON connections
  FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete their connections" ON connections;
CREATE POLICY "Users can delete their connections" ON connections
  FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- 2. PROFILE_VIEWS TABLE
-- ============================================
-- Tracks when investors view startup profiles

CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_startup_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  viewer_location TEXT DEFAULT 'Unknown'
);

-- Note: We handle deduplication in the application layer
-- The same investor viewing the same startup multiple times per day is counted once

-- Indexes for profile_views
CREATE INDEX IF NOT EXISTS idx_profile_views_startup ON profile_views(viewed_startup_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_date ON profile_views(DATE(viewed_at));

-- Enable RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policies for profile_views
DROP POLICY IF EXISTS "Users can track views" ON profile_views;
CREATE POLICY "Users can track views" ON profile_views
  FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "Startups can read their views" ON profile_views;
CREATE POLICY "Startups can read their views" ON profile_views
  FOR SELECT
  USING (auth.uid() = viewed_startup_id);

DROP POLICY IF EXISTS "Investors can read their views" ON profile_views;
CREATE POLICY "Investors can read their views" ON profile_views
  FOR SELECT
  USING (auth.uid() = viewer_id);

-- ============================================
-- 3. STARTUPS TABLE (if not exists)
-- ============================================
-- Core startup profile data

CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  logo TEXT,
  industry TEXT,
  stage TEXT,
  description TEXT,
  problem_solving TEXT,
  history TEXT,
  valuation TEXT,
  traction TEXT,
  founder_name TEXT,
  founder_avatar TEXT,
  founder_bio TEXT,
  founder_education TEXT,
  founder_work_history TEXT,
  ai_summary TEXT,
  summary_status TEXT CHECK (summary_status IN ('draft', 'final')),
  questionnaire JSONB,
  show_in_feed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for startups
CREATE INDEX IF NOT EXISTS idx_startups_stage ON startups(stage);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON startups(industry);
CREATE INDEX IF NOT EXISTS idx_startups_feed ON startups(show_in_feed);

-- Enable RLS
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

-- Policies for startups
DROP POLICY IF EXISTS "Startups can view all profiles" ON startups;
CREATE POLICY "Startups can view all profiles" ON startups
  FOR SELECT
  USING (show_in_feed = TRUE OR auth.uid() = id);

DROP POLICY IF EXISTS "Startups can update own profile" ON startups;
CREATE POLICY "Startups can update own profile" ON startups
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Startups can insert own profile" ON startups;
CREATE POLICY "Startups can insert own profile" ON startups
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. INVESTORS TABLE (if not exists)
-- ============================================
-- Core investor profile data

CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar TEXT,
  title TEXT,
  bio TEXT,
  location TEXT,
  funds_available TEXT,
  investments_count INTEGER DEFAULT 0,
  expertise TEXT[],
  verification_level TEXT CHECK (verification_level IN ('basic', 'verified', 'trusted')) DEFAULT 'basic',
  review_requested BOOLEAN DEFAULT FALSE,
  adhaar_number TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for investors
CREATE INDEX IF NOT EXISTS idx_investors_verification ON investors(verification_level);

-- Enable RLS
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Policies for investors
DROP POLICY IF EXISTS "Investors can view all profiles" ON investors;
CREATE POLICY "Investors can view all profiles" ON investors
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Investors can update own profile" ON investors;
CREATE POLICY "Investors can update own profile" ON investors
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Investors can insert own profile" ON investors;
CREATE POLICY "Investors can insert own profile" ON investors
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. VERIFICATION & DATA INTEGRITY
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_startups_updated_at ON startups;
CREATE TRIGGER update_startups_updated_at
    BEFORE UPDATE ON startups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investors_updated_at ON investors;
CREATE TRIGGER update_investors_updated_at
    BEFORE UPDATE ON investors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything was created successfully

-- Check table counts
DO $$
BEGIN
    RAISE NOTICE 'Connections count: %', (SELECT COUNT(*) FROM connections);
    RAISE NOTICE 'Profile views count: %', (SELECT COUNT(*) FROM profile_views);
    RAISE NOTICE 'Startups count: %', (SELECT COUNT(*) FROM startups);
    RAISE NOTICE 'Investors count: %', (SELECT COUNT(*) FROM investors);
    RAISE NOTICE '✅ All tables created successfully!';
END $$;
