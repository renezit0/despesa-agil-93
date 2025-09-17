-- Fix CPF unique constraint issue - make CPF nullable and add username constraint
ALTER TABLE public.profiles ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Create contacts table for adding known people
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contact_user_id)
);

-- Enable RLS for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for contacts
CREATE POLICY "Users can view their own contacts" 
ON public.contacts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
ON public.contacts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
ON public.contacts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for contacts timestamp updates
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add financing and payment approval fields to expenses
ALTER TABLE public.expenses 
ADD COLUMN is_financing BOOLEAN DEFAULT false,
ADD COLUMN financing_total_amount NUMERIC,
ADD COLUMN financing_paid_amount NUMERIC DEFAULT 0,
ADD COLUMN financing_discount_amount NUMERIC DEFAULT 0,
ADD COLUMN financing_months_total INTEGER,
ADD COLUMN financing_months_paid INTEGER DEFAULT 0,
ADD COLUMN early_payment_discount_rate NUMERIC DEFAULT 0,
ADD COLUMN needs_approval BOOLEAN DEFAULT false,
ADD COLUMN approved_by UUID,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN shared_with_user_id UUID,
ADD COLUMN payment_proof_url TEXT;

-- Add foreign key for approved_by
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_approved_by_fkey 
FOREIGN KEY (approved_by) REFERENCES auth.users(id);

-- Add foreign key for shared_with_user_id  
ALTER TABLE public.expenses 
ADD CONSTRAINT expenses_shared_with_user_id_fkey 
FOREIGN KEY (shared_with_user_id) REFERENCES auth.users(id);

-- Create payment requests table
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL,
  requester_user_id UUID NOT NULL,
  approver_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payment_requests
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_requests
CREATE POLICY "Users can view payment requests they created or need to approve" 
ON public.payment_requests 
FOR SELECT 
USING (auth.uid() = requester_user_id OR auth.uid() = approver_user_id);

CREATE POLICY "Users can create payment requests" 
ON public.payment_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_user_id);

CREATE POLICY "Approvers can update payment requests" 
ON public.payment_requests 
FOR UPDATE 
USING (auth.uid() = approver_user_id);

-- Add foreign keys for payment_requests
ALTER TABLE public.payment_requests 
ADD CONSTRAINT payment_requests_expense_id_fkey 
FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;

ALTER TABLE public.payment_requests 
ADD CONSTRAINT payment_requests_requester_user_id_fkey 
FOREIGN KEY (requester_user_id) REFERENCES auth.users(id);

ALTER TABLE public.payment_requests 
ADD CONSTRAINT payment_requests_approver_user_id_fkey 
FOREIGN KEY (approver_user_id) REFERENCES auth.users(id);

-- Create trigger for payment_requests timestamp updates
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();