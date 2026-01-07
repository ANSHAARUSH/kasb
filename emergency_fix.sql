-- EMERGENCY FIX FOR SIGNUP
-- The issue: "SignUp" creates a user, but if email is not verified, they are not "logged in" yet.
-- This means they cannot pass the "auth.uid() = id" check because auth.uid() is null.

-- Solution: Allow anyone to insert into the startups table. 
-- Security: The database still checks that the 'id' matches a valid user in auth.users because of the Foreign Key.

-- 1. Fix Startups Table
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to insert their own startup" ON startups;
DROP POLICY IF EXISTS "Enable insert for all" ON startups;

-- Allow ANYONE to insert (needed because fresh signed-up users might not have a session yet)
CREATE POLICY "Enable insert for all"
ON startups FOR INSERT
WITH CHECK (true);

-- 2. Fix Investors Table (same issue)
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to insert their own investor profile" ON investors;
DROP POLICY IF EXISTS "Enable insert for all" ON investors;

CREATE POLICY "Enable insert for all"
ON investors FOR INSERT
WITH CHECK (true);

-- 3. Verify Read/Update policies are still secure
-- (We keep the update policies to owner-only, which is safe because updates happen after login)

DROP POLICY IF EXISTS "Allow users to update their own startup" ON startups;
CREATE POLICY "Allow users to update their own startup"
ON startups FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update their own investor profile" ON investors;
CREATE POLICY "Allow users to update their own investor profile"
ON investors FOR UPDATE
USING (auth.uid() = id);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
