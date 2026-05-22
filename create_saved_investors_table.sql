-- Create the saved_investors table (Future Plans for Startups)
CREATE TABLE IF NOT EXISTS public.saved_investors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    UNIQUE(startup_id, investor_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_investors ENABLE ROW LEVEL SECURITY;

-- Policies

-- Policy: Startups can view their own saved investors
DROP POLICY IF EXISTS "Startups can view their own saved investors" ON public.saved_investors;
CREATE POLICY "Startups can view their own saved investors"
ON public.saved_investors
FOR SELECT
USING (auth.uid() = startup_id);

-- Policy: Startups can insert their own saved investors
DROP POLICY IF EXISTS "Startups can insert their own saved investors" ON public.saved_investors;
CREATE POLICY "Startups can insert their own saved investors"
ON public.saved_investors
FOR INSERT
WITH CHECK (auth.uid() = startup_id);

-- Policy: Startups can delete their own saved investors
DROP POLICY IF EXISTS "Startups can delete their own saved investors" ON public.saved_investors;
CREATE POLICY "Startups can delete their own saved investors"
ON public.saved_investors
FOR DELETE
USING (auth.uid() = startup_id);

-- Grant permissions
GRANT ALL ON public.saved_investors TO authenticated;
GRANT ALL ON public.saved_investors TO service_role;
