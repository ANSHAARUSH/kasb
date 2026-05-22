-- Migration to add Government Grant specific fields to the investors table
ALTER TABLE investors 
ADD COLUMN IF NOT EXISTS grant_scheme TEXT,
ADD COLUMN IF NOT EXISTS grant_advantages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS grant_eligibility TEXT[] DEFAULT '{}';

-- Optional: Add comments for clarity
COMMENT ON COLUMN investors.grant_scheme IS 'The name of the government grant scheme';
COMMENT ON COLUMN investors.grant_advantages IS 'List of advantages/benefits of the grant';
COMMENT ON COLUMN investors.grant_eligibility IS 'List of eligibility criteria for the grant';
