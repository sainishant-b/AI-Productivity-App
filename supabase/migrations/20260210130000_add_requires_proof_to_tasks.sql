-- Add requires_proof column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS requires_proof boolean DEFAULT false;
