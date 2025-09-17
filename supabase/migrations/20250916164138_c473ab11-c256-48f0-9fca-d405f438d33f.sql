-- First, let's check if there's a trigger on auth.users
-- Drop existing trigger if it exists to recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  -- Use INSERT ... ON CONFLICT to handle duplicates gracefully
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    username,
    full_name,
    cpf,
    birth_date,
    address,
    cep
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'cpf',
    (NEW.raw_user_meta_data ->> 'birth_date')::date,
    NEW.raw_user_meta_data ->> 'address',
    NEW.raw_user_meta_data ->> 'cep'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    cpf = EXCLUDED.cpf,
    birth_date = EXCLUDED.birth_date,
    address = EXCLUDED.address,
    cep = EXCLUDED.cep;
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();