-- GRANT ADMINS READ ACCESS TO ALL DATA TABLES
-- This ensures the admin dashboard can load overview stats and user lists.

-- 1. Messages Read Access for Admins
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
ON public.messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 2. Connections Read Access for Admins
DROP POLICY IF EXISTS "Admins can view all connections" ON public.connections;
CREATE POLICY "Admins can view all connections"
ON public.connections FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 3. Reports Read Access for Admins
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 4. User Subscriptions Read Access for Admins
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 5. Global Config Read Access for Admins
-- (Already allowing public read, but ensuring admins have full select coverage)
DROP POLICY IF EXISTS "Admins can view global config" ON public.global_config;
CREATE POLICY "Admins can view global config"
ON public.global_config FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
