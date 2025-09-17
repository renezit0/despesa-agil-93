-- Disable email confirmation to make testing easier
-- Note: This is for development/testing purposes
-- In production, you may want to keep email confirmation enabled

-- First, let's check current auth settings
SELECT 
  enable_signup,
  enable_confirmations,
  enable_anonymous_sign_ins
FROM auth.config 
LIMIT 1;

-- Update auth settings to disable email confirmation
UPDATE auth.config 
SET enable_confirmations = false
WHERE true;