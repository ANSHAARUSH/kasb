-- Add the problem_solving column to the startups table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE startups 
ADD COLUMN IF NOT EXISTS problem_solving TEXT;

-- Optional: Set a default value for existing rows
-- UPDATE startups 
-- SET problem_solving = description 
-- WHERE problem_solving IS NULL;
