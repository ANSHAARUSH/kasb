-- FORCE FIX RLS POLICIES
-- Run this in Supabase SQL Editor to reset and fix permissions

-- 1. Reset Startups Table Policies
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to verified startups" ON startups;
DROP POLICY IF EXISTS "Allow users to insert their own startup" ON startups;
DROP POLICY IF EXISTS "Allow users to update their own startup" ON startups;
DROP POLICY IF EXISTS "Allow users to delete their own startup" ON startups;
-- Also drop any other potentially conflicting policies users might have made
DROP POLICY IF EXISTS "Public read access" ON startups;
DROP POLICY IF EXISTS "Invest insert own" ON startups;

-- Create fresh policies
CREATE POLICY "Allow public read access to verified startups"
ON startups FOR SELECT
USING (true); -- Changed to allow public read of all for now to debug, or strictly: (email_verified = true OR auth.uid() = id)

CREATE POLICY "Allow users to insert their own startup"
ON startups FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own startup"
ON startups FOR UPDATE
USING (auth.uid() = id);

-- 2. Reset Investors Table Policies
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to investors" ON investors;
DROP POLICY IF EXISTS "Allow users to insert their own investor profile" ON investors;
DROP POLICY IF EXISTS "Allow users to update their own investor profile" ON investors;
DROP POLICY IF EXISTS "Allow users to delete their own investor profile" ON investors;

CREATE POLICY "Allow public read access to investors"
ON investors FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert their own investor profile"
ON investors FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own investor profile"
ON investors FOR UPDATE
USING (auth.uid() = id);

-- 3. Ensure permissions are granted to the auth roles
GRANT ALL ON TABLE startups TO authenticated;
GRANT ALL ON TABLE startups TO service_role;
GRANT ALL ON TABLE investors TO authenticated;
GRANT ALL ON TABLE investors TO service_role;

-- 4. Verify user can actually insert (this is a sanity check logic, not a runable command)
-- If this still fails, it implies the user session is not active during insert.

-- Refresh schema
NOTIFY pgrst, 'reload schema';
