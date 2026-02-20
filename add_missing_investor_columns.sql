-- FINAL ROBUST FIX FOR ADMIN LISTINGS
-- Run this in the Supabase SQL Editor

-- 0. Enable pgcrypto (required for gen_random_uuid in older postgres)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Add missing columns
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS investor_type TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS expertise TEXT[] DEFAULT '{}';

-- 2. Fix ID constraint and add default for Investors
-- Drop the constraint that requires a matching account in auth.users
ALTER TABLE public.investors DROP CONSTRAINT IF EXISTS investors_id_fkey;
-- Set a default so if we forget to provide an ID, Postgres makes one
ALTER TABLE public.investors ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Fix ID constraint and add default for Startups
ALTER TABLE public.startups DROP CONSTRAINT IF EXISTS startups_id_fkey;
ALTER TABLE public.startups ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';
