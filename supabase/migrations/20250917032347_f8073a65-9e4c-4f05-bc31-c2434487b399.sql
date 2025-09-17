-- Criar tabela para histórico de pagamentos
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL,
  user_id UUID NOT NULL,
  payment_amount NUMERIC NOT NULL,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL, -- 'installment', 'early_payment', 'partial_payment'
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  instance_id UUID NULL, -- referencia para expense_instances se for pagamento de parcela
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment transactions" 
ON public.payment_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment transactions" 
ON public.payment_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment transactions" 
ON public.payment_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_payment_transactions_expense_id ON public.payment_transactions(expense_id);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_payment_date ON public.payment_transactions(payment_date);