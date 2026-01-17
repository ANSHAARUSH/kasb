-- Create the investor_boosts table to store community awarded points
CREATE TABLE investor_boosts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE, -- Corrected table name
    points_awarded INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(investor_id, startup_id)
);

-- Enable Row Level Security
ALTER TABLE investor_boosts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read boost counts
CREATE POLICY "Anyone can read boosts" 
ON investor_boosts FOR SELECT 
USING (true);

-- Only allow investors to insert their own boosts
CREATE POLICY "Investors can insert their own boosts" 
ON investor_boosts FOR INSERT 
WITH CHECK (auth.uid() = investor_id);
