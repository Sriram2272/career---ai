-- School HOD and DAA need to see all forwarded achievements, not just their department
-- Drop the restrictive HOD policy and create separate ones
DROP POLICY IF EXISTS "HODs can read achievements in their department" ON public.achievements;

-- Concern HODs can read achievements in their department
CREATE POLICY "Concern HODs can read dept achievements"
ON public.achievements FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'concern-hod'::app_role) 
  AND student_id IN (
    SELECT id FROM profiles WHERE department = get_user_department(auth.uid())
  )
);

-- School HODs can read all achievements (they review cross-department)
CREATE POLICY "School HODs can read all achievements"
ON public.achievements FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'school-hod'::app_role));

-- Also fix profiles RLS so School HOD can see all profiles
DROP POLICY IF EXISTS "HODs can read profiles in their department" ON public.profiles;

CREATE POLICY "Concern HODs can read dept profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  department = get_user_department(auth.uid()) 
  AND has_role(auth.uid(), 'concern-hod'::app_role)
);

CREATE POLICY "School HODs can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'school-hod'::app_role));