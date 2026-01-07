-- Create a function to allow users to delete their own account
-- This function runs with security definer privileges to access auth.users

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
as $$
begin
  delete from auth.users
  where id = auth.uid();
end;
$$;

-- Force the API to notice the new function
NOTIFY pgrst, 'reload schema';
