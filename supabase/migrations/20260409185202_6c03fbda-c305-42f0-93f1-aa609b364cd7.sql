
-- Workshops table
CREATE TABLE public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  workshop_type text NOT NULL DEFAULT 'workshop',
  instructor text,
  scheduled_date timestamptz,
  duration_hours numeric DEFAULT 2,
  department text,
  max_capacity integer DEFAULT 50,
  status text DEFAULT 'upcoming',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workshops" ON public.workshops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/staff can manage workshops" ON public.workshops FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concern-hod'::app_role) OR has_role(auth.uid(), 'school-hod'::app_role) OR has_role(auth.uid(), 'daa'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concern-hod'::app_role) OR has_role(auth.uid(), 'school-hod'::app_role) OR has_role(auth.uid(), 'daa'::app_role));

-- Training attendance table
CREATE TABLE public.training_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  attendance_status text DEFAULT 'registered',
  score numeric,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own attendance" ON public.training_attendance FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Admin/staff can view all attendance" ON public.training_attendance FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concern-hod'::app_role) OR has_role(auth.uid(), 'school-hod'::app_role) OR has_role(auth.uid(), 'daa'::app_role));
CREATE POLICY "Admin/staff can manage attendance" ON public.training_attendance FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concern-hod'::app_role) OR has_role(auth.uid(), 'school-hod'::app_role) OR has_role(auth.uid(), 'daa'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concern-hod'::app_role) OR has_role(auth.uid(), 'school-hod'::app_role) OR has_role(auth.uid(), 'daa'::app_role));
CREATE POLICY "Students can register for workshops" ON public.training_attendance FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
