-- Broadcast Notification: Profile Visibility Update
-- Run this in Supabase SQL Editor to notify all users

DO $$
DECLARE
    admin_id uuid;
    user_record record;
    message_content text := '🚨 **Profile Visibility Update**: To maintain a high-quality community, your profile will now be visible in the feed only after you''ve completed all mandatory profile questions. Please ensure your profile is 100% complete to stay discoverable! — Team Kasb.AI';
BEGIN
    -- 1. Find the admin ID (Kasb.AI Bot)
    -- Assuming 'kasb-ai-bot' is a handle or we can use a known admin ID
    -- If 'admins' table is used to identify admins, we'll pick one.
    SELECT id INTO admin_id FROM public.admins LIMIT 1;
    
    -- If no admin found, fallback to a system ID or just use a placeholder if needed
    -- (In production, you'd want a specific UUID here)
    IF admin_id IS NULL THEN
        RAISE NOTICE 'No admin found in public.admins table. Please ensure an admin exists.';
        RETURN;
    END IF;

    -- 2. Insert message for every user in the platform
    -- We'll look into both 'startups' and 'investors' tables to get all active users
    FOR user_record IN (
        SELECT id FROM public.startups
        UNION
        SELECT id FROM public.investors
    ) LOOP
        -- Avoid sending to self if admin is in the list
        IF user_record.id != admin_id THEN
            INSERT INTO public.messages (sender_id, receiver_id, content, is_read)
            VALUES (admin_id, user_record.id, message_content, false);
        END IF;
    END LOOP;

    RAISE NOTICE 'Broadcast completed successfully.';
END $$;
