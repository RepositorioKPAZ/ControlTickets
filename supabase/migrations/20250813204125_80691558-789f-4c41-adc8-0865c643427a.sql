-- Add requesting_user column to tickets table
ALTER TABLE public.tickets 
ADD COLUMN requesting_user text;