-- GRANT ADMINS FULL UPDATE PERMISSIONS ON STARTUPS AND INVESTORS
-- This ensures admins can update subscription_tier, verification_level, etc.

-- 1. Startups Update Policy for Admins
DROP POLICY IF EXISTS "Admins can update all startups" ON public.startups;
CREATE POLICY "Admins can update all startups"
ON public.startups FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 2. Investors Update Policy for Admins
DROP POLICY IF EXISTS "Admins can update all investors" ON public.investors;
CREATE POLICY "Admins can update all investors"
ON public.investors FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
