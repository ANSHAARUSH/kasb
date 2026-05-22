-- Add geographical columns to startups table
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_startups_geography ON public.startups(country, state, city);
