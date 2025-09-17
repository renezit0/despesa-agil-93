-- Adicionar foreign key constraint para limpar transações quando expense for deletado
ALTER TABLE public.payment_transactions 
ADD CONSTRAINT fk_payment_transactions_expense_id 
FOREIGN KEY (expense_id) 
REFERENCES public.expenses(id) 
ON DELETE CASCADE;

-- Limpar transações órfãs (sem expense correspondente)
DELETE FROM public.payment_transactions 
WHERE expense_id NOT IN (SELECT id FROM public.expenses);