-- Create an enum for KYC status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE kyc_status_type AS ENUM ('pending', 'submitted', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add KYC columns to startups table
ALTER TABLE startups 
ADD COLUMN IF NOT EXISTS kyc_status kyc_status_type DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS adhaar_number_last_four TEXT,
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;

-- Add KYC columns to investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS kyc_status kyc_status_type DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS adhaar_number_last_four TEXT,
ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ;

-- Update existing records to 'verified' to prevent locking out existing users (Optional - User can decide)
-- For now, let's keep them as 'pending' as requested: "without kyc, a user cannot access the main dashboard"
