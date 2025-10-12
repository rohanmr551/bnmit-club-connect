-- Create Clubs table
CREATE TABLE public.Clubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  qr_url TEXT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Registrations table
CREATE TABLE public.Registrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT NOT NULL,
  email TEXT NOT NULL,
  branch TEXT,
  year INTEGER,
  club_id INTEGER REFERENCES public.Clubs(id) ON DELETE CASCADE,
  payment_proof_url TEXT,
  upi_transaction_id TEXT,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster USN lookups
CREATE INDEX idx_registrations_usn ON public.Registrations(usn);
CREATE INDEX idx_registrations_club_id ON public.Registrations(club_id);
CREATE INDEX idx_registrations_status ON public.Registrations(payment_status);

-- Enable Row Level Security
ALTER TABLE public.Clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Clubs (public read)
CREATE POLICY "Anyone can view clubs"
  ON public.Clubs
  FOR SELECT
  USING (true);

CREATE POLICY "Allow inserts for all users"
  ON public.Clubs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow updates for all users"
  ON public.Clubs
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow deletes for all users"
  ON public.Clubs
  FOR DELETE
  USING (true);

-- RLS Policies for Registrations (public read/write)
CREATE POLICY "Anyone can view registrations"
  ON public.Registrations
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert registrations"
  ON public.Registrations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update registrations"
  ON public.Registrations
  FOR UPDATE
  USING (true);

-- Function to enforce club limit
CREATE OR REPLACE FUNCTION public.check_club_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.Registrations WHERE usn = NEW.usn AND payment_status != 'Rejected') >= 3 THEN
    RAISE EXCEPTION 'You have reached your club limit (3). Cannot join more clubs.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce club limit before insert
CREATE TRIGGER enforce_club_limit_trigger
  BEFORE INSERT ON public.Registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_club_limit();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('club_logos', 'club_logos', true),
  ('payment_qr', 'payment_qr', true),
  ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for club_logos (public read, unrestricted write)
CREATE POLICY "Public read access for club logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'club_logos');

CREATE POLICY "Anyone can upload club logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'club_logos');

-- Storage policies for payment_qr (public read, unrestricted write)
CREATE POLICY "Public read access for payment QR"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'payment_qr');

CREATE POLICY "Anyone can upload payment QR"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'payment_qr');

-- Storage policies for payment_proofs (restricted read, unrestricted write)
CREATE POLICY "Anyone can view payment proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'payment_proofs');

CREATE POLICY "Anyone can upload payment proofs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'payment_proofs');