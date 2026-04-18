
-- Create faculty table
CREATE TABLE public.faculty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  uid TEXT NOT NULL UNIQUE,
  department TEXT,
  designation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read faculty (for dropdown)
CREATE POLICY "Authenticated users can view faculty"
ON public.faculty FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage faculty
CREATE POLICY "Admins can insert faculty"
ON public.faculty FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update faculty"
ON public.faculty FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete faculty"
ON public.faculty FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed sample faculty data
INSERT INTO public.faculty (name, uid, department, designation) VALUES
  ('Dr. Sharma', '2272', 'Computer Science & Engineering', 'Professor'),
  ('Dr. Verma', '1225', 'Computer Science & Engineering', 'Associate Professor'),
  ('Dr. Gupta', '3341', 'Computer Science & Engineering', 'Assistant Professor'),
  ('Dr. Kaur', '4456', 'Electronics & Communication', 'Professor'),
  ('Dr. Singh', '5578', 'Electronics & Communication', 'Associate Professor'),
  ('Dr. Patel', '6689', 'Mechanical Engineering', 'Professor'),
  ('Dr. Kumar', '7791', 'Information Technology', 'Assistant Professor'),
  ('Dr. Mishra', '8802', 'Civil Engineering', 'Associate Professor'),
  ('Dr. Joshi', '9913', 'Computer Applications', 'Professor'),
  ('Dr. Rao', '1024', 'Data Science', 'Assistant Professor');
