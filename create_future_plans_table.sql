-- Create the future_plans table
CREATE TABLE IF NOT EXISTS public.future_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
    UNIQUE(investor_id, startup_id)
);

-- Enable Row Level Security
ALTER TABLE public.future_plans ENABLE ROW LEVEL SECURITY;

-- Policies

-- Policy: Investors can view their own future_plans
DROP POLICY IF EXISTS "Investors can view their own future_plans" ON public.future_plans;
CREATE POLICY "Investors can view their own future_plans"
ON public.future_plans
FOR SELECT
USING (auth.uid() = investor_id);

-- Policy: Investors can insert their own future_plans
DROP POLICY IF EXISTS "Investors can insert their own future_plans" ON public.future_plans;
CREATE POLICY "Investors can insert their own future_plans"
ON public.future_plans
FOR INSERT
WITH CHECK (auth.uid() = investor_id);

-- Policy: Investors can delete their own future_plans
DROP POLICY IF EXISTS "Investors can delete their own future_plans" ON public.future_plans;
CREATE POLICY "Investors can delete their own future_plans"
ON public.future_plans
FOR DELETE
USING (auth.uid() = investor_id);

-- Grant permissions (optional, depending on default setup)
GRANT ALL ON public.future_plans TO authenticated;
GRANT ALL ON public.future_plans TO service_role;
