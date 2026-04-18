
-- Add faculty_uid to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty_uid TEXT;

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  faculty_id UUID NOT NULL,
  job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  faculty_remarks TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Students can create their own referral requests
CREATE POLICY "Students can insert own referrals"
ON public.referrals FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can view their own referral requests
CREATE POLICY "Students can view own referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Faculty can view referrals addressed to them
CREATE POLICY "Faculty can view their referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (faculty_id = auth.uid());

-- Faculty can update referrals addressed to them (approve/decline)
CREATE POLICY "Faculty can update their referrals"
ON public.referrals FOR UPDATE
TO authenticated
USING (faculty_id = auth.uid());

-- TPC/Admin can view all referrals
CREATE POLICY "TPC/Admin can view all referrals"
ON public.referrals FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'school-hod') OR
  has_role(auth.uid(), 'daa') OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'concern-hod')
);
