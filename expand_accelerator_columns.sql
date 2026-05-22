-- EXPAND INVESTOR TABLE FOR ACCELERATOR DETAILS
-- Run this in the Supabase SQL Editor to support the new Accelerator fields.

ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS accelerator_type TEXT; -- e.g. Equity, Equity-Free
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS cash_investment TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS applications_status TEXT; -- Open / Closed / Rolling
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS application_deadline TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS program_location TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS first_cheque_friendly TEXT; -- Yes / No / Sometimes
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS investor_intros_strength TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS founder_fit_score TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS best_for TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS program_duration TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS cohorts_per_year TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS relocation_required TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS follow_on_funding TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS non_dilutive_support TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS eligibility_requirements TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS application_difficulty TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS acceptance_rate TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS application_requirements TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS selection_process TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS decision_time TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS mentorship_access TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS investor_access TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS post_program_support TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS startup_perks TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS core_support TEXT;
ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS founder_community TEXT;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
