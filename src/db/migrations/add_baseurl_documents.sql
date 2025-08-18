-- Add base_url column to documents table
ALTER TABLE public.documents ADD COLUMN base_url text;

-- Update the base_url for existing documents if needed
UPDATE public.documents d
SET base_url = REGEXP_REPLACE(url, '^(https?://[^/]+).*', '\1')
WHERE url IS NOT NULL AND url != ''; 