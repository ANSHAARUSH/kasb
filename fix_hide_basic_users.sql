-- FIX: Hide Unverified Users

-- Some users might have been "Unverified" (set to basic) but still have show_in_feed=true.
-- This script aligns them.

-- 1. Hide Basic Startups
UPDATE startups
SET show_in_feed = false
WHERE verification_level = 'basic';

-- 2. Hide Basic Investors
UPDATE investors
SET show_in_feed = false
WHERE verification_level = 'basic';

-- Refresh schema
NOTIFY pgrst, 'reload schema';
