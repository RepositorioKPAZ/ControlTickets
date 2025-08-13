-- Drop existing foreign key constraints on tickets table
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;

-- Add new foreign key constraints
-- assigned_to should reference resolvers table
ALTER TABLE public.tickets ADD CONSTRAINT tickets_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES public.resolvers(id);

-- created_by should reference profiles table  
ALTER TABLE public.tickets ADD CONSTRAINT tickets_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);