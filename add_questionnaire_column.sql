-- Add questionnaire column to startups table
ALTER TABLE public.startups 
ADD COLUMN IF NOT EXISTS questionnaire JSONB DEFAULT '{}'::jsonb;
