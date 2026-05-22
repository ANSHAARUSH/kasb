-- Complete Startups Table Schema
-- Run this SQL in your Supabase SQL Editor

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS startups (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Company Information
    name TEXT NOT NULL,
    logo TEXT DEFAULT '🚀',
    industry TEXT,
    stage TEXT,
    valuation TEXT,
    traction TEXT,
    problem_solving TEXT,
    description TEXT,
    history TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Founder Information
    founder_name TEXT,
    founder_avatar TEXT,
    founder_bio TEXT,
    founder_education TEXT,
    founder_work_history TEXT,
    
    -- Verification & Visibility
    email_verified BOOLEAN DEFAULT FALSE,
    show_in_feed BOOLEAN DEFAULT FALSE,
    verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'trusted')),
    review_requested BOOLEAN DEFAULT FALSE,
    
    -- Adhaar Verification
    adhaar_number TEXT,
    adhaar_doc_url TEXT
);

-- If the table already exists, add missing columns
-- These will only add columns that don't exist yet

ALTER TABLE startups ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS valuation TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS traction TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS problem_solving TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS history TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE startups ADD COLUMN IF NOT EXISTS founder_education TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS founder_work_history TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic';
ALTER TABLE startups ADD COLUMN IF NOT EXISTS review_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS adhaar_number TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS adhaar_doc_url TEXT;

-- Add constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'startups_verification_level_check'
    ) THEN
        ALTER TABLE startups 
        ADD CONSTRAINT startups_verification_level_check 
        CHECK (verification_level IN ('basic', 'verified', 'trusted'));
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

-- Create policies (if they don't exist)
DO $$ 
BEGIN
    -- Allow users to read all verified startups
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'startups' AND policyname = 'Allow public read access to verified startups'
    ) THEN
        CREATE POLICY "Allow public read access to verified startups"
        ON startups FOR SELECT
        USING (email_verified = true OR auth.uid() = id);
    END IF;

    -- Allow users to insert their own startup
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'startups' AND policyname = 'Allow users to insert their own startup'
    ) THEN
        CREATE POLICY "Allow users to insert their own startup"
        ON startups FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Allow users to update their own startup
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'startups' AND policyname = 'Allow users to update their own startup'
    ) THEN
        CREATE POLICY "Allow users to update their own startup"
        ON startups FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    -- Allow users to delete their own startup
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'startups' AND policyname = 'Allow users to delete their own startup'
    ) THEN
        CREATE POLICY "Allow users to delete their own startup"
        ON startups FOR DELETE
        USING (auth.uid() = id);
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
