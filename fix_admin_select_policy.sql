-- FIX: Grant Admins READ access (SELECT) to all data

-- Currently, policies only allow reading "verified" users.
-- Admins need to see "unverified" users to moderate them.

-- 1. Startups Read Access
CREATE POLICY "Allow admins to view all startups"
ON startups FOR SELECT
USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- 2. Investors Read Access
CREATE POLICY "Allow admins to view all investors"
ON investors FOR SELECT
USING (EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()));

-- Refresh schema
NOTIFY pgrst, 'reload schema';
