-- RPC to allow admins to delete users from auth.users
-- This function bypasses normal RLS but is secured via a role check.

CREATE OR REPLACE FUNCTION public.delete_user_by_id(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security Check: Ensure the caller is an admin
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Only admins can delete users.';
  END IF;

  -- Delete from auth.users (cascades to public tables)
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
