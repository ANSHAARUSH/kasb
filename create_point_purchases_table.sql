-- Create point_purchases table
CREATE TABLE IF NOT EXISTS public.point_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    investor_id UUID REFERENCES public.investors(id) ON DELETE CASCADE NOT NULL,
    points INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.point_purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Investors can view their own point purchases"
    ON public.point_purchases FOR SELECT
    USING (auth.uid() = investor_id);

CREATE POLICY "Investors can insert their own point purchases"
    ON public.point_purchases FOR INSERT
    WITH CHECK (auth.uid() = investor_id);
