ALTER TABLE public.referrals
  ADD COLUMN forwarded_to uuid DEFAULT NULL,
  ADD COLUMN forwarded_by uuid DEFAULT NULL,
  ADD COLUMN forwarded_at timestamptz DEFAULT NULL,
  ADD COLUMN forward_remarks text DEFAULT NULL;