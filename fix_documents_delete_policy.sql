-- FIX: Add missing DELETE policy for startup_documents
-- Allow startups to delete their own documents (must be authenticated and own the startup_id)

ALTER TABLE startup_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Startups can delete their own documents" ON startup_documents;

CREATE POLICY "Startups can delete their own documents" 
ON startup_documents FOR DELETE 
USING (auth.uid() = startup_id);

-- Verify permissions
GRANT ALL ON TABLE startup_documents TO authenticated;
GRANT ALL ON TABLE startup_documents TO service_role;
