-- ==========================================
-- FIX V2: Accurate Plan Badges (Constraint Safe)
-- ==========================================

-- 1. Unlock visibility for the Plan Badges
DROP POLICY IF EXISTS "Allow public read access to subscription tiers" ON public.user_subscriptions;
CREATE POLICY "Allow public read access to subscription tiers"
ON public.user_subscriptions
FOR SELECT
USING (true);

-- 2. Sync Startups (Only with valid Startup Tiers)
-- This avoids the "startups_subscription_tier_check" violation
UPDATE public.startups s
SET subscription_tier = us.tier
FROM public.user_subscriptions us
WHERE s.id = us.user_id
AND us.tier IN ('discovery', 'starter', 'growth', 'fundraise_pro');

-- 3. Sync Investors (Only with valid Investor Tiers)
UPDATE public.investors i
SET subscription_tier = us.tier
FROM public.user_subscriptions us
WHERE i.id = us.user_id
AND us.tier IN ('explore', 'investor_basic', 'investor_pro', 'institutional');

-- 4. Fix the trigger that was defaulting startups to 'explore'
-- This prevents future data corruption
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    default_tier TEXT;
BEGIN
    user_role := new.raw_user_meta_data->>'role';
    
    IF user_role = 'startup' THEN
        default_tier := 'discovery';
    ELSE
        -- Default for investors AND unknown roles
        default_tier := 'explore';
    END IF;

    INSERT INTO public.user_subscriptions (user_id, tier)
    VALUES (new.id, default_tier)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Refresh cache
NOTIFY pgrst, 'reload schema';
