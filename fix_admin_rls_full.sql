-- FIX ADMIN PERMISSIONS FOR ALL OPERATIONS
-- This ensures admins can Insert, Update, and Delete both Startups and Investors

-- 1. Tighten existing generic policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON startups;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON investors;

-- 2. Startups: Full Admin Access
DROP POLICY IF EXISTS "Admins can manage startups" ON public.startups;
CREATE POLICY "Admins can manage startups"
ON public.startups FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 3. Investors: Full Admin Access
DROP POLICY IF EXISTS "Admins can manage investors" ON public.investors;
CREATE POLICY "Admins can manage investors"
ON public.investors FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 4. Ensure RLS is enabled
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- 5. Refresh schema cache
NOTIFY pgrst, 'reload schema';
