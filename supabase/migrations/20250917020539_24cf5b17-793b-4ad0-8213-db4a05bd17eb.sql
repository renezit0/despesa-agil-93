-- Add start_date field for recurring expenses
ALTER TABLE expenses ADD COLUMN recurring_start_date date;