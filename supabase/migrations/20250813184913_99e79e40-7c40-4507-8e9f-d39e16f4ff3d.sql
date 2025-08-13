-- Add foreign key relationship from holidays to countries
-- First, add the new column
ALTER TABLE public.holidays 
ADD COLUMN country_id UUID;

-- Update existing records to link with countries based on name
UPDATE public.holidays 
SET country_id = (
  SELECT c.id 
  FROM public.countries c 
  WHERE c.name = public.holidays.country 
  LIMIT 1
)
WHERE country IS NOT NULL;

-- For records without matching countries, create a default "No especificado" country if it doesn't exist
INSERT INTO public.countries (name, code, is_active)
SELECT 'No especificado', NULL, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.countries WHERE name = 'No especificado'
);

-- Update remaining null country_id records to point to "No especificado"
UPDATE public.holidays 
SET country_id = (
  SELECT id FROM public.countries WHERE name = 'No especificado' LIMIT 1
)
WHERE country_id IS NULL;

-- Now make country_id NOT NULL since all records have been updated
ALTER TABLE public.holidays 
ALTER COLUMN country_id SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE public.holidays 
ADD CONSTRAINT holidays_country_id_fkey 
FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE RESTRICT;

-- Create index for better performance
CREATE INDEX idx_holidays_country_id ON public.holidays(country_id);

-- Remove the old country text column
ALTER TABLE public.holidays 
DROP COLUMN country;