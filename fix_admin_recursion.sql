-- FIX: Infinite Recursion in Admin Policy

-- The previous policy `USING (auth.uid() IN (SELECT id FROM admins))` caused the database to crash (Infinite Loop) when checking permissions.
-- We must replace it with a simple check.

-- 1. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
DROP POLICY IF EXISTS "Users can check their own admin status" ON admins;

-- 2. Create a specific, non-recursive policy
-- "I can see a row in the admins table IF that row matches my ID"
CREATE POLICY "Simple Admin Role Check"
ON admins FOR SELECT
USING (auth.uid() = id);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
