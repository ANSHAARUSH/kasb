-- Add profile_details column to investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS profile_details JSONB DEFAULT '{}'::jsonb;

-- Create an index on the profile_details column for faster querying if needed later
CREATE INDEX IF NOT EXISTS idx_investors_profile_details ON investors USING gin (profile_details);
