-- Create a function to generate recurring expenses for a given month
CREATE OR REPLACE FUNCTION generate_recurring_expenses_for_month(target_month date)
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
) LANGUAGE plpgsql AS $$
DECLARE
  expense_record RECORD;
  new_due_date date;
  installment_amount numeric;
BEGIN
  -- Get the first day of the target month
  target_month := date_trunc('month', target_month);
  
  -- Return actual expenses for the target month
  RETURN QUERY
  SELECT e.* 
  FROM expenses e
  WHERE date_trunc('month', e.due_date) = target_month;
  
  -- Generate recurring expenses that should appear in target month
  FOR expense_record IN 
    SELECT e.* 
    FROM expenses e
    WHERE e.is_recurring = true 
    AND e.due_date <= target_month + interval '1 month' - interval '1 day'
  LOOP
    -- Calculate new due date based on recurring type
    CASE expense_record.recurring_type
      WHEN 'monthly' THEN
        new_due_date := target_month + (EXTRACT(day FROM expense_record.due_date) - 1) * interval '1 day';
      WHEN 'weekly' THEN
        new_due_date := target_month + (EXTRACT(dow FROM expense_record.due_date)) * interval '1 day';
      ELSE
        new_due_date := target_month + (EXTRACT(day FROM expense_record.due_date) - 1) * interval '1 day';
    END CASE;
    
    -- Only return if the calculated date is within the target month
    IF date_trunc('month', new_due_date) = target_month THEN
      -- Check if this recurring expense doesn't already exist for this month
      IF NOT EXISTS (
        SELECT 1 FROM expenses 
        WHERE user_id = expense_record.user_id 
        AND title = expense_record.title 
        AND date_trunc('month', due_date) = target_month
        AND id != expense_record.id
      ) THEN
        RETURN QUERY
        SELECT 
          gen_random_uuid(),
          expense_record.user_id,
          expense_record.title,
          expense_record.description,
          expense_record.amount,
          expense_record.category_id,
          new_due_date,
          false, -- is_paid (new occurrence, not paid yet)
          expense_record.is_recurring,
          expense_record.installments,
          expense_record.current_installment,
          expense_record.recurring_type,
          expense_record.tags,
          expense_record.notes,
          expense_record.original_amount,
          null::timestamp with time zone, -- paid_at
          expense_record.is_financing,
          expense_record.financing_total_amount,
          expense_record.financing_paid_amount,
          expense_record.financing_discount_amount,
          expense_record.financing_months_total,
          expense_record.financing_months_paid,
          expense_record.early_payment_discount_rate,
          expense_record.needs_approval,
          expense_record.approved_by,
          expense_record.approved_at,
          expense_record.shared_with_user_id,
          expense_record.payment_proof_url,
          expense_record.created_at,
          expense_record.updated_at;
      END IF;
    END IF;
  END LOOP;
  
  -- Generate financing installments for the target month
  FOR expense_record IN 
    SELECT e.* 
    FROM expenses e
    WHERE e.is_financing = true 
    AND e.financing_months_total > 0
    AND e.due_date <= target_month + interval '1 month' - interval '1 day'
  LOOP
    -- Calculate installment amount
    installment_amount := expense_record.financing_total_amount / expense_record.financing_months_total;
    
    -- Calculate due date (same day each month)
    new_due_date := target_month + (EXTRACT(day FROM expense_record.due_date) - 1) * interval '1 day';
    
    -- Only return if within target month and installment is still pending
    IF date_trunc('month', new_due_date) = target_month 
    AND expense_record.financing_months_paid < expense_record.financing_months_total THEN
      -- Check if this financing installment doesn't already exist for this month
      IF NOT EXISTS (
        SELECT 1 FROM expenses 
        WHERE user_id = expense_record.user_id 
        AND title = expense_record.title || ' - Parcela ' || (expense_record.financing_months_paid + 1)
        AND date_trunc('month', due_date) = target_month
      ) THEN
        RETURN QUERY
        SELECT 
          gen_random_uuid(),
          expense_record.user_id,
          expense_record.title || ' - Parcela ' || (expense_record.financing_months_paid + 1),
          expense_record.description,
          installment_amount,
          expense_record.category_id,
          new_due_date,
          false, -- is_paid
          false, -- is_recurring (it's a financing installment)
          expense_record.installments,
          expense_record.current_installment,
          expense_record.recurring_type,
          expense_record.tags,
          expense_record.notes || ' (Financiamento)',
          expense_record.original_amount,
          null::timestamp with time zone, -- paid_at
          true, -- is_financing
          expense_record.financing_total_amount,
          expense_record.financing_paid_amount,
          expense_record.financing_discount_amount,
          expense_record.financing_months_total,
          expense_record.financing_months_paid,
          expense_record.early_payment_discount_rate,
          expense_record.needs_approval,
          expense_record.approved_by,
          expense_record.approved_at,
          expense_record.shared_with_user_id,
          expense_record.payment_proof_url,
          expense_record.created_at,
          expense_record.updated_at;
      END IF;
    END IF;
  END LOOP;
END;
$$;