-- Move some forwarded achievements to DAA level
UPDATE public.achievements 
SET current_reviewer_role = 'daa' 
WHERE id IN (
  SELECT id FROM public.achievements 
  WHERE status = 'forwarded' AND current_reviewer_role = 'school-hod' 
  LIMIT 8
);

-- Also create some at under_review for concern-hod variety
UPDATE public.achievements 
SET status = 'under_review' 
WHERE id IN (
  SELECT id FROM public.achievements 
  WHERE status = 'submitted' AND current_reviewer_role = 'concern-hod' 
  LIMIT 5
);