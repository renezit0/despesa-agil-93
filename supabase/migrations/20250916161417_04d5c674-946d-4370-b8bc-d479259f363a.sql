-- Update profiles table with additional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;

-- Update the trigger function to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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
  );
  RETURN NEW;
END;
$$;