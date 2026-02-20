-- ROBUST DELETE FUNCTION AND CASCADING CONSTRAINTS
-- Run this in Supabase SQL Editor

-- 1. Create a foolproof delete function that handles both Auth and Public tables
CREATE OR REPLACE FUNCTION delete_user_by_id(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to delete from auth.users (this will cascade to public tables if FKs are set correctly)
    -- If the user isn't in auth.users, this just does nothing
    DELETE FROM auth.users WHERE id = user_id;
    
    -- Explicitly delete from profiling tables just in case they are "headless" (no auth user)
    DELETE FROM public.investors WHERE id = user_id;
    DELETE FROM public.startups WHERE id = user_id;
END;
$$;

-- 2. Add ON DELETE CASCADE to common foreign keys to prevent "violates foreign key constraint" errors
-- We wrap in DO blocks to handle cases where names might differ

DO $$ 
BEGIN 
    -- user_subscriptions
    ALTER TABLE IF EXISTS public.user_subscriptions 
    DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey,
    ADD CONSTRAINT user_subscriptions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping user_subscriptions FK fix';
END $$;

DO $$ 
BEGIN 
    -- saved_investors
    ALTER TABLE IF EXISTS public.saved_investors 
    DROP CONSTRAINT IF EXISTS saved_investors_investor_id_fkey,
    ADD CONSTRAINT saved_investors_investor_id_fkey 
    FOREIGN KEY (investor_id) REFERENCES public.investors(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping saved_investors FK fix';
END $$;

DO $$ 
BEGIN 
    -- connections
    ALTER TABLE IF EXISTS public.connections 
    DROP CONSTRAINT IF EXISTS connections_startup_id_fkey,
    ADD CONSTRAINT connections_startup_id_fkey 
    FOREIGN KEY (startup_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping connections startup FK fix';
END $$;

DO $$ 
BEGIN 
    ALTER TABLE IF EXISTS public.connections 
    DROP CONSTRAINT IF EXISTS connections_investor_id_fkey,
    ADD CONSTRAINT connections_investor_id_fkey 
    FOREIGN KEY (investor_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping connections investor FK fix';
END $$;

-- 3. Ensure Admins explicitly have DELETE permission via RLS (one more time)
DROP POLICY IF EXISTS "Admins can manage startups" ON public.startups;
CREATE POLICY "Admins can manage startups"
ON public.startups FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage investors" ON public.investors;
CREATE POLICY "Admins can manage investors"
ON public.investors FOR ALL
USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';
