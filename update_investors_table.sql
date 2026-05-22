-- Add missing columns to investors table to fix signup error

-- Add investor_type if it doesn't exist
alter table public.investors 
add column if not exists investor_type text;

-- Add expertise as text array if it doesn't exist
alter table public.investors
add column if not exists expertise text[];

-- Refresh schema cache
notify pgrst, 'reload schema';
