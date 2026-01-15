-- Add columns to messages table
alter table public.messages 
add column if not exists is_deleted boolean default false,
add column if not exists last_edited_at timestamp with time zone;

-- Create reports table
create table if not exists public.reports (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    reporter_id uuid not null references auth.users(id),
    reported_message_id uuid references public.messages(id),
    conversation_partner_id uuid references auth.users(id), -- The other user in the chat
    reason text,
    status text default 'pending' -- pending, resolved, dismissed
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Policies for reports
create policy "Users can insert reports"
on public.reports for insert
with check (auth.uid() = reporter_id);

create policy "Admins can view reports"
on public.reports for select
using (
    exists (
        select 1 from public.admins 
        where admins.id = auth.uid()
    )
);

-- Update RLS for messages to allow updates (for edit/delete)
-- Users can update their own messages
create policy "Users can update their own messages"
on public.messages for update
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);
