-- Setup Admin Permissions and RLS

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view admins
CREATE POLICY "Admins can view admins"
ON admins FOR SELECT
USING (auth.uid() IN (SELECT id FROM admins));

-- 2. Update Startups Policies

-- Update Policy
DROP POLICY IF EXISTS "Allow users to update their own startup" ON startups;
DROP POLICY IF EXISTS "Allow users and admins to update startups" ON startups;
CREATE POLICY "Allow users and admins to update startups"
ON startups FOR UPDATE
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Delete Policy
DROP POLICY IF EXISTS "Allow users to delete their own startup" ON startups;
DROP POLICY IF EXISTS "Allow users and admins to delete startups" ON startups;
CREATE POLICY "Allow users and admins to delete startups"
ON startups FOR DELETE
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));


-- 3. Update Investors Policies

-- Update Policy
DROP POLICY IF EXISTS "Allow users to update their own investor profile" ON investors;
DROP POLICY IF EXISTS "Allow users and admins to update investors" ON investors;
CREATE POLICY "Allow users and admins to update investors"
ON investors FOR UPDATE
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Delete Policy
DROP POLICY IF EXISTS "Allow users to delete their own investor profile" ON investors;
DROP POLICY IF EXISTS "Allow users and admins to delete investors" ON investors;
CREATE POLICY "Allow users and admins to delete investors"
ON investors FOR DELETE
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Refresh schema
NOTIFY pgrst, 'reload schema';


-- =================================================================
-- IMPORTANT: STEP 4 - INSERT YOUR ADMIN ID
-- =================================================================
-- The SQL Editor doesn't know who "you" are, so auth.uid() is null.
-- You must manually add your User UUID below.

-- 1. Go to Authentication -> Users in Supabase Dashboard.
-- 2. Copy your User UUID.
-- 3. Uncomment the lines below and replace 'YOUR_UUID_HERE' with your actual ID.
-- 4. Run the script.

INSERT INTO admins (id)
VALUES ('f4b56f9c-14f5-4976-813c-1d91011c6131')
ON CONFLICT (id) DO NOTHING;
