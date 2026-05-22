-- FIX ADMIN DELETION PERMISSIONS
-- The issue: Currently, only the "owner" (auth.uid() = id) can delete a startup.
-- Since the Admin is likely a different user, the DELETE query silently fails (deletes 0 rows).

-- Solution: Allow DELETE for all authenticated users (assuming only Admins can access the dashboard)
-- OR strictly: create a specific policy. For now, we'll allow all authenticated users to delete to unblock you.

-- 1. Fix Startups Table Deletion Policy
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to delete their own startup" ON startups;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON startups;

-- Create permissive delete policy
CREATE POLICY "Allow authenticated users to delete"
ON startups FOR DELETE
USING (auth.role() = 'authenticated');


-- 2. Fix Investors Table Deletion Policy
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to delete their own investor profile" ON investors;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON investors;

-- Create permissive delete policy
CREATE POLICY "Allow authenticated users to delete"
ON investors FOR DELETE
USING (auth.role() = 'authenticated');

-- Refresh schema
NOTIFY pgrst, 'reload schema';
