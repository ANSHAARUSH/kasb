-- Create a table for connection requests
create table if not exists public.connections (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references auth.users(id) on delete cascade not null,
    receiver_id uuid references auth.users(id) on delete cascade not null,
    status text not null check (status in ('pending', 'accepted', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(sender_id, receiver_id)
);

-- Enable RLS
alter table public.connections enable row level security;

-- Policies
create policy "Users can view their own connections"
    on public.connections for select
    using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can send connection requests"
    on public.connections for insert
    with check ( auth.uid() = sender_id );

create policy "Users can update their own connection status"
    on public.connections for update
    using ( auth.uid() = receiver_id );

create policy "Users can delete their own connections"
    on public.connections for delete
    using ( auth.uid() = sender_id or auth.uid() = receiver_id );
