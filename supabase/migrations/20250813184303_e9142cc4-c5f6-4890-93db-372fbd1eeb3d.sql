-- Create countries table
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request_types table
CREATE TABLE public.request_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_types ENABLE ROW LEVEL SECURITY;

-- Create policies for countries
CREATE POLICY "Authenticated users can view countries" 
ON public.countries 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create countries" 
ON public.countries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update countries" 
ON public.countries 
FOR UPDATE 
USING (true);

-- Create policies for request_types
CREATE POLICY "Authenticated users can view request types" 
ON public.request_types 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create request types" 
ON public.request_types 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update request types" 
ON public.request_types 
FOR UPDATE 
USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_countries_updated_at
BEFORE UPDATE ON public.countries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_request_types_updated_at
BEFORE UPDATE ON public.request_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default countries
INSERT INTO public.countries (name, code, is_active) VALUES 
('España', 'ES', true),
('México', 'MX', true),
('Argentina', 'AR', true),
('Colombia', 'CO', true),
('Chile', 'CL', true),
('Perú', 'PE', true),
('Venezuela', 'VE', true),
('Ecuador', 'EC', true),
('Bolivia', 'BO', true),
('Uruguay', 'UY', true);

-- Insert default request types
INSERT INTO public.request_types (name, description, is_active) VALUES 
('support', 'Soporte técnico general', true),
('bug', 'Reporte de errores o fallos', true),
('feature', 'Solicitud de nueva funcionalidad', true),
('maintenance', 'Tareas de mantenimiento', true),
('other', 'Otros tipos de solicitudes', true);