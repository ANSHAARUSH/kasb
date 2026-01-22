-- Fix broken document URLs in the database
UPDATE startup_documents
SET file_url = 'https://uaytraftjhynscwzndiz.supabase.co/storage/v1/object/public/startup-documents/' || startup_id || '/' || file_name
WHERE file_url LIKE '%kasb-storage%';
