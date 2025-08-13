-- Drop all existing foreign key constraints on tickets table
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_client_id_fkey;

-- Clean any inconsistent data
UPDATE public.tickets 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (SELECT id FROM public.resolvers WHERE is_active = true);

-- Update created_by to use actual user_id from profiles if needed
UPDATE public.tickets 
SET created_by = (
    SELECT user_id FROM public.profiles 
    WHERE id = tickets.created_by
    LIMIT 1
)
WHERE created_by NOT IN (SELECT user_id FROM public.profiles);

-- Create proper foreign key constraints
ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.resolvers(id);

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(user_id);

ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES public.clients(id);