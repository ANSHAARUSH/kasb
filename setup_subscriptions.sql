-- ===================================================
-- SUBSCRIPTION MANAGEMENT SYSTEM
-- ===================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'discovery',
    billing_cycle TEXT DEFAULT 'monthly',
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'discovery';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
    ON public.user_subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can update their own subscription"
    ON public.user_subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
    ON public.user_subscriptions
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Trigger for default subscription
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    default_tier TEXT;
BEGIN
    user_role := new.raw_user_meta_data->>'role';
    
    IF user_role = 'startup' THEN
        default_tier := 'discovery';
    ELSIF user_role = 'investor' THEN
        default_tier := 'explore';
    ELSE
        default_tier := 'explore';
    END IF;

    INSERT INTO public.user_subscriptions (user_id, tier)
    VALUES (new.id, default_tier)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- Migration for existing users
INSERT INTO public.user_subscriptions (user_id, tier)
SELECT id, 'discovery' FROM public.startups
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_subscriptions (user_id, tier)
SELECT id, 'explore' FROM public.investors
ON CONFLICT (user_id) DO NOTHING;

-- Function to handle tier updates with timestamp
CREATE OR REPLACE FUNCTION public.handle_subscription_update()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_subscription_updated
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_subscription_update();
