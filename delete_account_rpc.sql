-- Create a function to allow users to delete their own account
-- This function runs with security definer privileges to access auth.users

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete the user from auth.users
  -- This will trigger the ON DELETE CASCADE for all linked tables
  DELETE FROM auth.users
  WHERE id = auth.uid();
END;
$$;

-- IMPORTANT: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Force the API to notice the new function
NOTIFY pgrst, 'reload schema';
