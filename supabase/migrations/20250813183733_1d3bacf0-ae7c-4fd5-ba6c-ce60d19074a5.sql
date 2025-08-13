-- Add missing columns to holidays table
ALTER TABLE public.holidays 
ADD COLUMN country TEXT,
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing records to have default values
UPDATE public.holidays 
SET country = 'No especificado', is_active = true 
WHERE country IS NULL;

-- Add index for better performance on country and active status
CREATE INDEX idx_holidays_country ON public.holidays(country);
CREATE INDEX idx_holidays_is_active ON public.holidays(is_active);