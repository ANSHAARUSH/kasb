-- Create messages table
create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    sender_id uuid not null references auth.users(id) on delete cascade,
    receiver_id uuid not null references auth.users(id) on delete cascade,
    content text not null,
    is_read boolean default false
);

-- Enable RLS
alter table public.messages enable row level security;

-- Policies

-- Allow users to view messages they sent or received
create policy "Users can view their own messages"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Allow users to send messages (insert)
create policy "Users can insert messages"
on public.messages for insert
with check (auth.uid() = sender_id);

-- Subscribe to realtime
drop publication if exists supabase_realtime;
create publication supabase_realtime for table messages;
