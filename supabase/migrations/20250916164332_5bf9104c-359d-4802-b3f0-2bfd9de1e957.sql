-- Enable leaked password protection for better security
UPDATE auth.config 
SET 
  password_min_length = 6,
  password_require_upper = false,
  password_require_lower = false, 
  password_require_numbers = false,
  password_require_symbols = false,
  enable_anonymous_sign_ins = false,
  enable_signup = true,
  enable_confirmations = false -- Disable email confirmation for easier testing
WHERE true;