-- Create resolvers table
CREATE TABLE public.resolvers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on resolvers table
ALTER TABLE public.resolvers ENABLE ROW LEVEL SECURITY;

-- Create policies for resolvers
CREATE POLICY "Authenticated users can view resolvers" 
ON public.resolvers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create resolvers" 
ON public.resolvers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update resolvers" 
ON public.resolvers 
FOR UPDATE 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_resolvers_updated_at
BEFORE UPDATE ON public.resolvers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_resolvers_email ON public.resolvers(email);
CREATE INDEX idx_resolvers_is_active ON public.resolvers(is_active);

-- Insert some default resolvers
INSERT INTO public.resolvers (name, email, phone, is_active) VALUES 
('Juan Pérez', 'juan.perez@empresa.com', '+34 600 123 456', true),
('María García', 'maria.garcia@empresa.com', '+34 600 234 567', true),
('Carlos López', 'carlos.lopez@empresa.com', '+34 600 345 678', true);