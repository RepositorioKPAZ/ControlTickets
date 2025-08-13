-- Create custom types for the ticket system
CREATE TYPE ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'closed');
CREATE TYPE request_type AS ENUM ('support', 'bug', 'feature', 'maintenance', 'other');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holidays table for business day calculations
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'open',
  priority priority_level NOT NULL DEFAULT 'medium',
  request_type request_type NOT NULL DEFAULT 'support',
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  resolution_time_hours DECIMAL(10,2),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_history table for tracking changes
CREATE TABLE public.ticket_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Authenticated users can view clients" 
ON public.clients FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can create clients" 
ON public.clients FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" 
ON public.clients FOR UPDATE 
TO authenticated USING (true);

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

-- Create RLS policies for holidays
CREATE POLICY "Authenticated users can view holidays" 
ON public.holidays FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage holidays" 
ON public.holidays FOR ALL 
TO authenticated USING (true);

-- Create RLS policies for tickets
CREATE POLICY "Authenticated users can view tickets" 
ON public.tickets FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tickets" 
ON public.tickets FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tickets" 
ON public.tickets FOR UPDATE 
TO authenticated USING (true);

-- Create RLS policies for ticket history
CREATE POLICY "Authenticated users can view ticket history" 
ON public.ticket_history FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can create ticket history" 
ON public.ticket_history FOR INSERT 
TO authenticated WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  ticket_num TEXT;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(year FROM now())::TEXT;
  SELECT 'TCK-' || year_suffix || '-' || LPAD((COUNT(*) + 1)::TEXT, 4, '0')
  INTO ticket_num
  FROM public.tickets
  WHERE EXTRACT(year FROM created_at) = EXTRACT(year FROM now());
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ticket_number_trigger
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_ticket_number();

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample holidays for 2025
INSERT INTO public.holidays (date, name, year) VALUES
('2025-01-01', 'Año Nuevo', 2025),
('2025-05-01', 'Día del Trabajador', 2025),
('2025-09-15', 'Día de la Independencia', 2025),
('2025-09-16', 'Día de la Independencia', 2025),
('2025-12-25', 'Navidad', 2025);

-- Create indexes for better performance
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at);
CREATE INDEX idx_ticket_history_ticket_id ON public.ticket_history(ticket_id);