-- Add deal_closed columns to connections table
ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS deal_closed boolean DEFAULT false;

ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS deal_closed_at timestamp with time zone;
