-- FIX: Clean up orphaned data and Apply Cascade Deletion

-- 1. Delete orphaned startups (where ID doesn't exist in auth.users)
DELETE FROM public.startups
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Delete orphaned investors (where ID doesn't exist in auth.users)
DELETE FROM public.investors
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. Fix Foreign Key Constraints (now safe to run)

-- Startups Table
ALTER TABLE public.startups
DROP CONSTRAINT IF EXISTS startups_id_fkey;

ALTER TABLE public.startups
ADD CONSTRAINT startups_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Investors Table
ALTER TABLE public.investors
DROP CONSTRAINT IF EXISTS investors_id_fkey;

ALTER TABLE public.investors
ADD CONSTRAINT investors_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
