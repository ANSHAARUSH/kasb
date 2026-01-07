-- SECURE ADMIN & PUBLIC ACCESS
-- This script balances Security (Admins Only for Admin Panel) with Functionality (Public Feed).

-- 1. Startups Policies
DROP POLICY IF EXISTS "Allow public read all" ON startups; -- Drop the "insecure" one
DROP POLICY IF EXISTS "Allow public read access to verified startups" ON startups;
DROP POLICY IF EXISTS "Allow admins to view all startups" ON startups;

CREATE POLICY "Secure Read Access for Startups"
ON startups FOR SELECT
USING (
  -- 1. Admins can see everything
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()) OR
  -- 2. Users can see themselves
  auth.uid() = id OR
  -- 3. Public can see Verified + Feed Visible startups
  (email_verified = true AND show_in_feed = true)
);

-- 2. Investors Policies
DROP POLICY IF EXISTS "Allow public read all" ON investors;
DROP POLICY IF EXISTS "Allow admins to view all investors" ON investors;

CREATE POLICY "Secure Read Access for Investors"
ON investors FOR SELECT
USING (
  -- 1. Admins can see everything
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid()) OR
  -- 2. Users can see themselves
  auth.uid() = id OR
  -- 3. Public can see Verified + Feed Visible investors
  (email_verified = true AND show_in_feed = true)
);

-- 3. Admins Table Policy (Refined)
DROP POLICY IF EXISTS "Admins can view admins" ON admins;
-- Allow a user to see their OWN entry in admins (to verify if they are an admin)
CREATE POLICY "Users can check their own admin status"
ON admins FOR SELECT
USING (auth.uid() = id);

-- Refresh schema
NOTIFY pgrst, 'reload schema';
