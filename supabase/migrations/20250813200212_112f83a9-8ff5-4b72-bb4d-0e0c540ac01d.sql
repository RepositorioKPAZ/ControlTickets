-- First, check current foreign key constraints on tickets table
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='tickets';

-- Drop the problematic foreign key constraint
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- Clean any inconsistent data - set assigned_to to NULL where it doesn't match valid resolver IDs
UPDATE public.tickets 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
AND assigned_to NOT IN (SELECT id FROM public.resolvers WHERE is_active = true);

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