-- Create a table to track payments for recurring expenses and financing installments
CREATE TABLE expense_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  instance_date date NOT NULL, -- The month/date this instance represents
  instance_type text NOT NULL CHECK (instance_type IN ('recurring', 'financing')),
  installment_number integer, -- For financing, which installment this is
  amount numeric NOT NULL,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(expense_id, instance_date, instance_type, installment_number)
);

-- Enable RLS
ALTER TABLE expense_instances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own expense instances" 
ON expense_instances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense instances" 
ON expense_instances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense instances" 
ON expense_instances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense instances" 
ON expense_instances 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_expense_instances_updated_at
BEFORE UPDATE ON expense_instances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();