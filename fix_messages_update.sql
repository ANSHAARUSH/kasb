-- Ensure messages table has correct columns and policies
alter table public.messages 
add column if not exists is_deleted boolean default false,
add column if not exists last_edited_at timestamp with time zone;

-- Re-enable RLS just in case
alter table public.messages enable row level security;

-- Drop existing update policy if it exists to avoid conflicts
drop policy if exists "Users can update their own messages" on public.messages;

-- Create/Re-create the update policy
create policy "Users can update their own messages"
on public.messages for update
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

-- Also ensure senders can view their own messages (already should be there, but for safety)
drop policy if exists "Users can view their own messages" on public.messages;
create policy "Users can view their own messages"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);
