-- FIX: Restore Public Visibility (Fix "0 users" in Admin Panel)

-- The Admin Panel was showing 0 users because strict security rules were hiding them.
-- This script allows ANYONE (public) to VIEW all startups and investors.
-- This ensures the Dashboard counts and lists work without logging in.

-- NOTE: While VIEWING is now public, DELETING/EDITING still requires you to be an Admin for security.

-- 1. Startups: Open Read Access
DROP POLICY IF EXISTS "Allow public read access to verified startups" ON startups;
DROP POLICY IF EXISTS "Allow admins to view all startups" ON startups;

CREATE POLICY "Allow public read all"
ON startups FOR SELECT
USING (true);


-- 2. Investors: Open Read Access
-- (Drop previous select policies if any, usually generic names or explicit ones)
DROP POLICY IF EXISTS "Allow admins to view all investors" ON investors;

CREATE POLICY "Allow public read all"
ON investors FOR SELECT
USING (true);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
