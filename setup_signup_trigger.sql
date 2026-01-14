-- ===================================================
-- AUTOMATED PROFILE CREATION TRIGGER
-- Run this in Supabase SQL Editor to fix signup errors
-- ===================================================

-- 1. Create the function that runs on every new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    metadata JSONB;
BEGIN
    metadata := new.raw_user_meta_data;
    user_role := metadata->>'role';

    -- Check if it's a Startup
    IF user_role = 'startup' THEN
        INSERT INTO public.startups (
            id,
            name, -- Company Name
            founder_name,
            industry,
            stage,
            traction,
            problem_solving,
            email_verified,
            show_in_feed
        ) VALUES (
            new.id,
            COALESCE(metadata->>'company_name', 'My Startup'),
            COALESCE(metadata->>'founder_name', 'Founder'),
            metadata->>'industry',
            metadata->>'stage',
            metadata->>'traction',
            metadata->>'problem_solving',
            FALSE,
            FALSE
        );

    -- Check if it's an Investor
    ELSIF user_role = 'investor' THEN
        INSERT INTO public.investors (
            id,
            name,
            funds_available,
            bio,
            email_verified,
            show_in_feed,
            -- Store expertise in a temporary way or handle array conversion if needed
            -- detailed expertise handling might be limited here, using bio/description or additional calls
            -- for now we'll assumes basic fields. Handling arrays in metadata to SQL can be tricky.
            -- We'll just map fundamental fields.
            verification_level
        ) VALUES (
            new.id,
            COALESCE(metadata->>'founded_name', metadata->>'name', 'Investor'), -- Investor Name
            metadata->>'funds_available',
            metadata->>'bio',
            FALSE,
            FALSE,
            'basic'
        );
        -- Note: 'expertise' is an array column in some versions or usually useful. 
        -- If investors table has 'expertise' column (check schema), we can try to cast.
    END IF;

    -- NEW: Send Welcome Message from the first available Admin
    DECLARE
        admin_id UUID;
        welcome_text TEXT;
    BEGIN
        -- Find the first available admin
        SELECT id INTO admin_id FROM public.admins LIMIT 1;
        
        -- Only proceed if an admin exists
        IF admin_id IS NOT NULL THEN
            -- 1. Create an accepted connection immediately so they can chat
            INSERT INTO public.connections (sender_id, receiver_id, status)
            VALUES (admin_id, new.id, 'accepted')
            ON CONFLICT (sender_id, receiver_id) DO NOTHING;

            -- 2. Define welcome message based on role
            IF user_role = 'startup' THEN
                welcome_text := 'Welcome to KASB.AI! 🚀 We are excited to help you find the right investors. Start by completing your profile and exploring our investor network.';
            ELSIF user_role = 'investor' THEN
                welcome_text := 'Welcome to KASB.AI! 💼 We are thrilled to have you here. Start exploring our verified startups and discover your next great investment.';
            ELSE
                welcome_text := 'Welcome to KASB.AI! We are glad to have you here. Explore our platform to connect and grow.';
            END IF;

            -- 3. Insert the welcome message
            INSERT INTO public.messages (sender_id, receiver_id, content)
            VALUES (admin_id, new.id, welcome_text);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Silently fail for the welcome message to ensure user profile creation still succeeds
        NULL;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Important: Grant usage on public schema to auth trigger (usually default but safe to add)
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
