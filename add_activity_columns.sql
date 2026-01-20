-- Add last_active_at columns to tracking user activity
ALTER TABLE startups ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE investors ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Create a function to update the timestamp
CREATE OR REPLACE FUNCTION update_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We won't add triggers here as we want to control the "active" status from the frontend
-- to avoid every single DB update (like background syncs) counting as "activity".
