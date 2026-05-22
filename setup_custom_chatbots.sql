-- Create a table to track custom AI chatbot requests
create table if not exists custom_chatbot_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  description text not null,
  status text check (status in ('pending', 'fulfilled')) default 'pending',
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table custom_chatbot_requests enable row level security;

-- Policy: Users can insert their own requests
create policy "Users can insert their own custom chatbot requests"
on custom_chatbot_requests for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Users can view their own requests
create policy "Users can view their own custom chatbot requests"
on custom_chatbot_requests for select
to authenticated
using (auth.uid() = user_id);

-- Note: Admins bypass RLS or have specific role-based policies, but as a fallback,
-- you can manually manage them in the Supabase Dashboard if no specific admin role is set in DB.
-- For a comprehensive admin policy, you would link to your admin checking logic, e.g.:
-- create policy "Admins can view all requests" on custom_chatbot_requests for select using (is_admin());
