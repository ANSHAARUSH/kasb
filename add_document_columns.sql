-- Create enum for content types
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'scanning', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create startup_documents table
CREATE TABLE IF NOT EXISTS startup_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g., 'pitch_deck', 'incorporation_cert', 'bank_statement'
    file_name TEXT NOT NULL,
    file_url TEXT, -- Can be null initially if verify-first-upload-later flow
    status document_status DEFAULT 'pending',
    ai_analysis JSONB, -- Store the AI's reasoning: { valid: true, confidence: 95, reason: "..." }
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE startup_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Startups can view their own documents" 
    ON startup_documents FOR SELECT 
    USING (auth.uid() = startup_id);

CREATE POLICY "Startups can insert their own documents" 
    ON startup_documents FOR INSERT 
    WITH CHECK (auth.uid() = startup_id);

CREATE POLICY "Startups can update their own documents" 
    ON startup_documents FOR UPDATE 
    USING (auth.uid() = startup_id);

CREATE POLICY "Investors can view verified documents" 
    ON startup_documents FOR SELECT 
    USING (
        status = 'verified' AND
        EXISTS (
            SELECT 1 FROM investors 
            WHERE id = auth.uid()
        )
    );
