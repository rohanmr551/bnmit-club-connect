-- Fix function search path security issue
DROP TRIGGER IF EXISTS enforce_club_limit_trigger ON public.Registrations;
DROP FUNCTION IF EXISTS public.check_club_limit();

-- Recreate function with proper search path
CREATE OR REPLACE FUNCTION public.check_club_limit()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.Registrations WHERE phone_number = NEW.phone_number AND payment_status != 'Rejected') >= 3 THEN
    RAISE EXCEPTION 'You have reached your club limit (3). Cannot join more clubs.';
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER enforce_club_limit_trigger
  BEFORE INSERT ON public.Registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_club_limit();