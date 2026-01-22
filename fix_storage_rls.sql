-- Enable RLS for the storage.objects table (usually enabled by default)
-- But we need specific policies for our startup-documents bucket

-- 1. Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated uploads to startup-documents"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'startup-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to update/overwrite their own files
CREATE POLICY "Allow authenticated updates to startup-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'startup-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow public reading of files in this bucket (since we want investors to see them)
CREATE POLICY "Allow public read access to startup-documents"
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'startup-documents');

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes from startup-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'startup-documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
