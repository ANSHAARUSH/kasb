-- Add State and City columns for Location-based filtering
ALTER TABLE startups ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE startups ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE investors ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE investors ADD COLUMN IF NOT EXISTS city TEXT;

-- Index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_startups_location ON startups(state, city);
CREATE INDEX IF NOT EXISTS idx_investors_location ON investors(state, city);
