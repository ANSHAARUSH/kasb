-- FIX: Show Verified Users in Feed

-- The previous logic verified users but left `show_in_feed` as false (or whatever it was).
-- The RLS policy requires BOTH verified AND show_in_feed=true to be visible.

-- 1. Fix Startups
UPDATE startups
SET show_in_feed = true
WHERE verification_level IN ('verified', 'trusted');

-- 2. Fix Investors
UPDATE investors
SET show_in_feed = true
WHERE verification_level IN ('verified', 'trusted');

-- Refresh schema
NOTIFY pgrst, 'reload schema';
