-- MEGA FIX: Force Visibility for Verified Startups

-- 1. Ensure RLS allows EVERYONE to see the table
DROP POLICY IF EXISTS "Allow public read all" ON startups;
DROP POLICY IF EXISTS "Enable read access for all users" ON startups;
CREATE POLICY "Allow public read all" ON startups FOR SELECT USING (true);

-- 2. Force 'show_in_feed' to TRUE for all verified/trusted startups
UPDATE startups
SET show_in_feed = true
WHERE verification_level IN ('verified', 'trusted');

-- 3. Force 'email_verified' to TRUE for all verified/trusted startups (just in case)
UPDATE startups
SET email_verified = true
WHERE verification_level IN ('verified', 'trusted');

-- 4. Do the same for Investors
DROP POLICY IF EXISTS "Allow public read all" ON investors;
CREATE POLICY "Allow public read all" ON investors FOR SELECT USING (true);

UPDATE investors
SET show_in_feed = true
WHERE verification_level IN ('verified', 'trusted');

UPDATE investors
SET email_verified = true
WHERE verification_level IN ('verified', 'trusted');

-- Refresh schema
NOTIFY pgrst, 'reload schema';
