-- Definitive Schema Fix for Onboarding
-- Run this in the Supabase SQL Editor

-- 1. Ensure Investors columns exist
ALTER TABLE investors ADD COLUMN IF NOT EXISTS expertise TEXT[] DEFAULT '{}';
ALTER TABLE investors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS investor_type TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS funds_available TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';

-- 2. Ensure Startups columns exist
ALTER TABLE startups ADD COLUMN IF NOT EXISTS founder_name TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS traction TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS problem_solving TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'pending';

-- 3. Optimization: Add Index for Location
DROP INDEX IF EXISTS idx_startups_location;
DROP INDEX IF EXISTS idx_investors_location;
CREATE INDEX idx_startups_location ON startups(state, city);
CREATE INDEX idx_investors_location ON investors(state, city);

-- 4. RLS Policy Check (Optional but recommended)
-- Ensure 'authenticated' users can insert their own profiles
-- (Note: These might already exist, but if you get "Permission Denied", run these)
/*
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Users can update own investor profile') THEN
        CREATE POLICY "Users can insert own investor profile" ON investors FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'startups' AND policyname = 'Users can insert own startup profile') THEN
        CREATE POLICY "Users can insert own startup profile" ON startups FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;
*/
