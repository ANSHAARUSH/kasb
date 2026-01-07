-- ==========================================
-- MASTER SETUP SCRIPT FOR KASB.AI
-- Run this entire script in the Supabase SQL Editor
-- ==========================================

-- 1. Startups Table
CREATE TABLE IF NOT EXISTS startups (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    logo TEXT DEFAULT '🚀',
    industry TEXT,
    stage TEXT,
    valuation TEXT,
    traction TEXT,
    problem_solving TEXT,
    description TEXT,
    history TEXT,
    tags TEXT[] DEFAULT '{}',
    founder_name TEXT,
    founder_avatar TEXT,
    founder_bio TEXT,
    founder_education TEXT,
    founder_work_history TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    show_in_feed BOOLEAN DEFAULT FALSE,
    verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'trusted')),
    review_requested BOOLEAN DEFAULT FALSE,
    adhaar_number TEXT,
    adhaar_doc_url TEXT
);
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to verified startups" ON startups FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own startup" ON startups FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own startup" ON startups FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow users to delete their own startup" ON startups FOR DELETE USING (auth.uid() = id);

-- 2. Investors Table
CREATE TABLE IF NOT EXISTS investors (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'https://i.pravatar.cc/150',
    bio TEXT,
    funds_available TEXT,
    investments_count INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    show_in_feed BOOLEAN DEFAULT FALSE,
    verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'trusted')),
    review_requested BOOLEAN DEFAULT FALSE,
    adhaar_number TEXT,
    adhaar_doc_url TEXT
);
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to investors" ON investors FOR SELECT USING (true);
CREATE POLICY "Allow users to insert their own investor profile" ON investors FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own investor profile" ON investors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow users to delete their own investor profile" ON investors FOR DELETE USING (auth.uid() = id);

-- 3. Connections Table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sender_id, receiver_id)
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connections" ON public.connections FOR SELECT USING ( auth.uid() = sender_id OR auth.uid() = receiver_id );
CREATE POLICY "Users can send connection requests" ON public.connections FOR INSERT WITH CHECK ( auth.uid() = sender_id );
CREATE POLICY "Users can update their own connection status" ON public.connections FOR UPDATE USING ( auth.uid() = receiver_id );
CREATE POLICY "Users can delete their own connections" ON public.connections FOR DELETE USING ( auth.uid() = sender_id OR auth.uid() = receiver_id );

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE messages;

-- 5. Future Plans (Investors saving Startups)
CREATE TABLE IF NOT EXISTS public.future_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
    UNIQUE(investor_id, startup_id)
);
ALTER TABLE public.future_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors can view their own future_plans" ON public.future_plans FOR SELECT USING (auth.uid() = investor_id);
CREATE POLICY "Investors can insert their own future_plans" ON public.future_plans FOR INSERT WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Investors can delete their own future_plans" ON public.future_plans FOR DELETE USING (auth.uid() = investor_id);

-- 6. Saved Investors (Startups saving Investors)
CREATE TABLE IF NOT EXISTS public.saved_investors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    startup_id UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
    UNIQUE(startup_id, investor_id)
);
ALTER TABLE public.saved_investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Startups can view their own saved investors" ON public.saved_investors FOR SELECT USING (auth.uid() = startup_id);
CREATE POLICY "Startups can insert their own saved investors" ON public.saved_investors FOR INSERT WITH CHECK (auth.uid() = startup_id);
CREATE POLICY "Startups can delete their own saved investors" ON public.saved_investors FOR DELETE USING (auth.uid() = startup_id);

-- 7. Global Config
CREATE TABLE IF NOT EXISTS public.global_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global config" ON public.global_config FOR SELECT USING (true);
CREATE POLICY "Admins update config" ON public.global_config FOR ALL USING (auth.role() = 'authenticated');

INSERT INTO public.global_config (key, value, description)
VALUES 
    ('free_message_limit', '10', 'Number of messages a free user can send per day'),
    ('free_match_limit', '5', 'Number of connection requests a free user can send per day'),
    ('enable_premium_features', 'false', 'Master kill switch for premium features')
ON CONFLICT (key) DO NOTHING;

-- 8. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view admins" ON admins FOR SELECT USING (auth.uid() IN (SELECT id FROM admins));

-- Grant Permissions
GRANT ALL ON TABLE startups TO authenticated;
GRANT ALL ON TABLE startups TO service_role;
GRANT ALL ON TABLE investors TO authenticated;
GRANT ALL ON TABLE investors TO service_role;
GRANT ALL ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.future_plans TO authenticated;
GRANT ALL ON public.future_plans TO service_role;
GRANT ALL ON public.saved_investors TO authenticated;
GRANT ALL ON public.saved_investors TO service_role;
GRANT ALL ON public.global_config TO authenticated;
GRANT ALL ON public.global_config TO service_role;

NOTIFY pgrst, 'reload schema';
