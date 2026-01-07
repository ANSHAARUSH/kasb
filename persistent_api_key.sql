-- Create a table for user settings to persist things like API keys across devices
create table if not exists public.user_settings (
    user_id uuid references auth.users(id) on delete cascade not null,
    key text not null,
    value text not null,
    primary key (user_id, key)
);

-- Enable RLS for user_settings
alter table public.user_settings enable row level security;

-- Policies for user_settings
drop policy if exists "Users can viewed their own settings" on public.user_settings;
create policy "Users can viewed their own settings" on public.user_settings for select using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own settings" on public.user_settings;
create policy "Users can insert their own settings" on public.user_settings for insert with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings" on public.user_settings for update using ( auth.uid() = user_id );

-- Global Config for site-wide settings (like a fallback AI key)
create table if not exists public.global_config (
    key text primary key,
    value text not null
);

-- Enable RLS for global_config
alter table public.global_config enable row level security;

-- Read-only policy for everyone
drop policy if exists "Everyone can read global config" on public.global_config;
create policy "Everyone can read global config" on public.global_config for select using ( true );
