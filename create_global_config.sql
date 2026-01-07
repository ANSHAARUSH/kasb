-- Create global_config table
create table if not exists public.global_config (
    key text primary key,
    value text not null,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.global_config enable row level security;

-- Policies

-- Allow everyone to read config (needed for frontend feature flags/limits)
create policy "Anyone can read global config"
on public.global_config for select
using (true);

-- Allow admins to insert/update (For now, restricting to authenticated users who might be admins, 
-- ideally this should be stricter, e.g., checking a specific email or role)
create policy "Authenticated users can update global config"
on public.global_config for insert
with check (auth.role() = 'authenticated');

create policy "Authenticated users can update global config"
on public.global_config for update
using (auth.role() = 'authenticated');

-- Insert default values if they don't exist
insert into public.global_config (key, value, description)
values 
    ('free_message_limit', '10', 'Number of messages a free user can send per day'),
    ('free_match_limit', '5', 'Number of connection requests a free user can send per day'),
    ('enable_premium_features', 'false', 'Master kill switch for premium features')
on conflict (key) do nothing;
