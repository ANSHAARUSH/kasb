-- Allow all authenticated users to view admin IDs
-- This is necessary so that 'Kasb.AI' branding can be applied to messages sent by admins.
-- We only need to check if an ID exists in the table.

DROP POLICY IF EXISTS "Users can check their own admin status" ON public.admins;

CREATE POLICY "Allow authenticated users to view admins"
ON public.admins FOR SELECT
TO authenticated
USING (true);
