-- Security Fix: Restrict global_config modifications to Admins only
-- Target Email: kasbai2025@gmail.com

-- 1. Drop the over-permissive policies
DROP POLICY IF EXISTS "Authenticated users can update global config" ON public.global_config;

-- 2. Create strict Admin-only policies
-- We check the user's email from the auth.jwt() to ensure only the owner can modify
CREATE POLICY "Only designated admins can insert global config"
ON public.global_config FOR INSERT
WITH CHECK ( auth.jwt() ->> 'email' = 'kasbai2025@gmail.com' );

CREATE POLICY "Only designated admins can update global config"
ON public.global_config FOR UPDATE
USING ( auth.jwt() ->> 'email' = 'kasbai2025@gmail.com' );

CREATE POLICY "Only designated admins can delete global config"
ON public.global_config FOR DELETE
USING ( auth.jwt() ->> 'email' = 'kasbai2025@gmail.com' );

-- Ensure READ remains public (required for frontend limits)
-- Policy "Anyone can read global config" (true) should already exist, but we ensure it here
DROP POLICY IF EXISTS "Anyone can read global config" ON public.global_config;
CREATE POLICY "Anyone can read global config"
ON public.global_config FOR SELECT
USING (true);

NOTIFY pgrst, 'reload schema';
