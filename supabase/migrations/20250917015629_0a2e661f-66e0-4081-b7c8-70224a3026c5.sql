-- Drop the problematic function and create a simpler approach
DROP FUNCTION IF EXISTS generate_recurring_expenses_for_month(date);

-- Create a view that shows expenses for a specific month including recurring ones
CREATE OR REPLACE FUNCTION get_expenses_for_month(target_month date, target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  amount numeric,
  category_id uuid,
  due_date date,
  is_paid boolean,
  is_recurring boolean,
  installments integer,
  current_installment integer,
  recurring_type text,
  tags text[],
  notes text,
  original_amount numeric,
  paid_at timestamp with time zone,
  is_financing boolean,
  financing_total_amount numeric,
  financing_paid_amount numeric,
  financing_discount_amount numeric,
  financing_months_total integer,
  financing_months_paid integer,
  early_payment_discount_rate numeric,
  needs_approval boolean,
  approved_by uuid,
  approved_at timestamp with time zone,
  shared_with_user_id uuid,
  payment_proof_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Return expenses for the specific month and user
  RETURN QUERY
  SELECT e.*
  FROM expenses e
  WHERE e.user_id = target_user_id
  AND (
    -- Regular expenses in the target month
    (date_trunc('month', e.due_date) = date_trunc('month', target_month))
    OR
    -- Recurring expenses that should appear in target month
    (e.is_recurring = true AND e.due_date <= target_month)
  )
  ORDER BY e.due_date DESC;
END;
$$;