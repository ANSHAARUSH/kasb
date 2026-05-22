-- Fix Foreign Key Constraints to ensure ON DELETE CASCADE

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

-- Refresh schema cache just in case
NOTIFY pgrst, 'reload schema';
