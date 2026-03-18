-- ADD IS_ADMIN_ADDED COLUMN TO INVESTORS
-- Run this in the Supabase SQL Editor to enable identify admin-added investors for editing.

ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS is_admin_added BOOLEAN DEFAULT FALSE;

-- Optional: Mark existing investors that don't have a linked auth account as admin-added
-- Note: This is a safe assumption but might not be 100% accurate if there are orphaned records.
-- UPDATE public.investors SET is_admin_added = TRUE WHERE id NOT IN (SELECT id FROM auth.users);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
