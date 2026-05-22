-- Complete Investors Table Schema
-- Run this SQL in your Supabase SQL Editor

-- First, check if the table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Investor Information
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'https://i.pravatar.cc/150',
    bio TEXT,
    funds_available TEXT,
    investments_count INTEGER DEFAULT 0,
    
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
ALTER TABLE investors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT 'https://i.pravatar.cc/150';
ALTER TABLE investors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS funds_available TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS investments_count INTEGER DEFAULT 0;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS show_in_feed BOOLEAN DEFAULT FALSE;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic';
ALTER TABLE investors ADD COLUMN IF NOT EXISTS review_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS adhaar_number TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS adhaar_doc_url TEXT;

-- Add constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'investors_verification_level_check'
    ) THEN
        ALTER TABLE investors 
        ADD CONSTRAINT investors_verification_level_check 
        CHECK (verification_level IN ('basic', 'verified', 'trusted'));
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

-- Create policies (if they don't exist)
DO $$ 
BEGIN
    -- Allow users to read all investors
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investors' AND policyname = 'Allow public read access to investors'
    ) THEN
        CREATE POLICY "Allow public read access to investors"
        ON investors FOR SELECT
        USING (true);
    END IF;

    -- Allow users to insert their own investor profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investors' AND policyname = 'Allow users to insert their own investor profile'
    ) THEN
        CREATE POLICY "Allow users to insert their own investor profile"
        ON investors FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Allow users to update their own investor profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investors' AND policyname = 'Allow users to update their own investor profile'
    ) THEN
        CREATE POLICY "Allow users to update their own investor profile"
        ON investors FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    -- Allow users to delete their own investor profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'investors' AND policyname = 'Allow users to delete their own investor profile'
    ) THEN
        CREATE POLICY "Allow users to delete their own investor profile"
        ON investors FOR DELETE
        USING (auth.uid() = id);
    END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
