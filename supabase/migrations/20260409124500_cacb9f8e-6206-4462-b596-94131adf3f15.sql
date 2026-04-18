
-- =============================================
-- 1. DROP OLD TABLES
-- =============================================
DROP TABLE IF EXISTS public.achievement_reviews CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.faculty CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- =============================================
-- 2. UPDATE PROFILES
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cgpa numeric,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS placement_status text DEFAULT 'unplaced',
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_roles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS graduation_year int,
  ADD COLUMN IF NOT EXISTS backlogs int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tenth_percent numeric,
  ADD COLUMN IF NOT EXISTS twelfth_percent numeric;

-- =============================================
-- 3. NEW TABLES
-- =============================================

-- Companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  website text,
  logo_url text,
  description text,
  package_min numeric,
  package_max numeric,
  locations text[] DEFAULT '{}',
  hiring_history jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Job Postings
CREATE TABLE public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  skills_required text[] DEFAULT '{}',
  min_cgpa numeric DEFAULT 0,
  eligible_branches text[] DEFAULT '{}',
  job_type text DEFAULT 'full-time',
  package_lpa numeric,
  deadline timestamptz,
  max_applications int,
  status text DEFAULT 'open',
  interview_process jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Applications
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'applied',
  resume_url text,
  cover_note text,
  ai_match_score numeric,
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Student Skills
CREATE TABLE public.student_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  skill_name text NOT NULL,
  proficiency text DEFAULT 'beginner',
  verified boolean DEFAULT false,
  source text DEFAULT 'self',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Student Activities (engagement tracking)
CREATE TABLE public.student_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  activity_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Risk Scores
CREATE TABLE public.risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  overall_score numeric DEFAULT 0,
  category text DEFAULT 'unprepared',
  factors jsonb DEFAULT '{}',
  computed_at timestamptz NOT NULL DEFAULT now()
);

-- Career Plans (AI-generated)
CREATE TABLE public.career_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  target_company text,
  plan_data jsonb DEFAULT '{}',
  progress_pct numeric DEFAULT 0,
  ai_model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mock Interviews
CREATE TABLE public.mock_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  domain text,
  job_type text,
  difficulty text DEFAULT 'medium',
  questions jsonb DEFAULT '[]',
  responses jsonb DEFAULT '[]',
  ai_feedback jsonb DEFAULT '{}',
  overall_score numeric,
  duration_seconds int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Placement Drives
CREATE TABLE public.placement_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  drive_date date,
  status text DEFAULT 'scheduled',
  rounds jsonb DEFAULT '[]',
  offers_count int DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Featured Placements
CREATE TABLE public.featured_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid,
  company_name text NOT NULL,
  package_lpa numeric,
  photo_url text,
  featured_date date DEFAULT CURRENT_DATE,
  is_active boolean DEFAULT true,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- 4. ENABLE RLS ON ALL NEW TABLES
-- =============================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_placements ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. RLS POLICIES
-- =============================================

-- COMPANIES: all authenticated can read, TPC/Admin can mutate
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "TPC/Admin can insert companies" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "TPC/Admin can update companies" ON public.companies FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "TPC/Admin can delete companies" ON public.companies FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- JOB POSTINGS: all authenticated can read, TPC/Admin can mutate
CREATE POLICY "Anyone can view job postings" ON public.job_postings FOR SELECT TO authenticated USING (true);
CREATE POLICY "TPC/Admin can insert job postings" ON public.job_postings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "TPC/Admin can update job postings" ON public.job_postings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "TPC/Admin can delete job postings" ON public.job_postings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- APPLICATIONS: students own, TPC/Admin can view/update all
CREATE POLICY "Students can view own applications" ON public.applications FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "TPC/Admin can view all applications" ON public.applications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can insert own applications" ON public.applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own applications" ON public.applications FOR UPDATE TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "TPC/Admin can update all applications" ON public.applications FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- STUDENT SKILLS: students own, TPC/Admin can view
CREATE POLICY "Students can manage own skills" ON public.student_skills FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "TPC/Admin can view all skills" ON public.student_skills FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- STUDENT ACTIVITIES: students can view own, insert own. TPC/Admin can view all
CREATE POLICY "Students can view own activities" ON public.student_activities FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Students can insert own activities" ON public.student_activities FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "TPC/Admin can view all activities" ON public.student_activities FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- RISK SCORES: students can view own. TPC/Admin can manage all
CREATE POLICY "Students can view own risk scores" ON public.risk_scores FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "TPC/Admin can manage risk scores" ON public.risk_scores FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- CAREER PLANS: students own, TPC/Admin can view
CREATE POLICY "Students can manage own career plans" ON public.career_plans FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "TPC/Admin can view all career plans" ON public.career_plans FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- MOCK INTERVIEWS: students own, TPC/Admin can view
CREATE POLICY "Students can manage own mock interviews" ON public.mock_interviews FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "TPC/Admin can view all mock interviews" ON public.mock_interviews FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- PLACEMENT DRIVES: all authenticated can read, TPC/Admin can mutate
CREATE POLICY "Anyone can view placement drives" ON public.placement_drives FOR SELECT TO authenticated USING (true);
CREATE POLICY "TPC/Admin can insert placement drives" ON public.placement_drives FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "TPC/Admin can update placement drives" ON public.placement_drives FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "TPC/Admin can delete placement drives" ON public.placement_drives FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- FEATURED PLACEMENTS: all authenticated can read active, TPC/Admin can mutate
CREATE POLICY "Anyone can view active featured placements" ON public.featured_placements FOR SELECT TO authenticated
  USING (is_active = true);
CREATE POLICY "TPC/Admin can manage featured placements" ON public.featured_placements FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin'));

-- =============================================
-- 6. TRIGGERS FOR updated_at
-- =============================================
CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_career_plans_updated_at BEFORE UPDATE ON public.career_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_placement_drives_updated_at BEFORE UPDATE ON public.placement_drives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 7. STORAGE: Create resumes bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false)
  ON CONFLICT (id) DO NOTHING;

-- Students can upload own resumes
CREATE POLICY "Students can upload own resumes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Students can read own resumes
CREATE POLICY "Students can read own resumes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Students can update own resumes
CREATE POLICY "Students can update own resumes" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- TPC/Admin can read all resumes
CREATE POLICY "TPC/Admin can read all resumes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND (
    has_role(auth.uid(), 'concern-hod') OR has_role(auth.uid(), 'school-hod') OR 
    has_role(auth.uid(), 'daa') OR has_role(auth.uid(), 'admin')
  ));
