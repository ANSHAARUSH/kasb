-- Add subscription_tier column to startups and investors tables
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'discovery';

ALTER TABLE public.investors 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'explore';

-- Refresh schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
