-- Fix function search path security warnings by setting immutable search paths

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_ticket_number function  
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Fix set_ticket_number function
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
    NEW.email
  );
  RETURN NEW;
END;
$$;