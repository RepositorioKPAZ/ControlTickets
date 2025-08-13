-- Update clients table to include new required fields
ALTER TABLE public.clients 
ADD COLUMN contact_name TEXT,
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN country TEXT,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing records to have default values
UPDATE public.clients 
SET contact_name = name,
    contact_email = email,
    contact_phone = phone,
    country = 'No especificado',
    is_active = true
WHERE contact_name IS NULL;

-- Make contact_name required
ALTER TABLE public.clients 
ALTER COLUMN contact_name SET NOT NULL;