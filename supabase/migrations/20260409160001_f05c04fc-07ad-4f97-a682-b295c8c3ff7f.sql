
-- Create the missing trigger for handle_new_user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add aptitude_score and programming_score columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS aptitude_score numeric DEFAULT 50,
  ADD COLUMN IF NOT EXISTS programming_score numeric DEFAULT 50;
