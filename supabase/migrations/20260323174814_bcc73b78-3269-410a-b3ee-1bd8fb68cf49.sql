
-- ============================================
-- EduRev Platform — Full Database Schema
-- ============================================

-- 1. ENUMS
CREATE TYPE public.app_role AS ENUM (
  'student',
  'concern-hod',
  'school-hod',
  'daa',
  'admin'
);

CREATE TYPE public.achievement_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'forwarded'
);

CREATE TYPE public.review_action AS ENUM (
  'approved',
  'rejected',
  'forwarded',
  'returned'
);

CREATE TYPE public.notification_type AS ENUM (
  'approved',
  'rejected',
  'pending',
  'info',
  'warning',
  'announcement'
);

CREATE TYPE public.notification_priority AS ENUM (
  'normal',
  'urgent',
  'critical'
);

-- 2. TABLES

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  registration_number TEXT,
  department TEXT,
  school TEXT,
  section TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB DEFAULT '{}'::jsonb,
  file_urls TEXT[] DEFAULT '{}',
  team_members JSONB DEFAULT '[]'::jsonb,
  status public.achievement_status NOT NULL DEFAULT 'draft',
  current_reviewer_role TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.achievement_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_role public.app_role NOT NULL,
  action public.review_action NOT NULL,
  comments TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  target_audience TEXT,
  target_details TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INDEXES
CREATE INDEX idx_achievements_student_id ON public.achievements(student_id);
CREATE INDEX idx_achievements_status ON public.achievements(status);
CREATE INDEX idx_achievement_reviews_achievement_id ON public.achievement_reviews(achievement_id);
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- 4. SECURITY DEFINER FUNCTIONS

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT department
  FROM public.profiles
  WHERE id = _user_id
$$;

-- 5. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- PROFILES
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HODs can read profiles in their department"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    department = public.get_user_department(auth.uid())
    AND (public.has_role(auth.uid(), 'concern-hod') OR public.has_role(auth.uid(), 'school-hod'))
  );

CREATE POLICY "DAA can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'daa'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- USER_ROLES
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ACHIEVEMENTS
CREATE POLICY "Students can CRUD own achievements"
  ON public.achievements FOR ALL TO authenticated
  USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE POLICY "HODs can read achievements in their department"
  ON public.achievements FOR SELECT TO authenticated
  USING (
    (public.has_role(auth.uid(), 'concern-hod') OR public.has_role(auth.uid(), 'school-hod'))
    AND student_id IN (SELECT id FROM public.profiles WHERE department = public.get_user_department(auth.uid()))
  );

CREATE POLICY "DAA can read all achievements"
  ON public.achievements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'daa'));

CREATE POLICY "Admins can read all achievements"
  ON public.achievements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Reviewers can update achievement status"
  ON public.achievements FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'concern-hod') OR public.has_role(auth.uid(), 'school-hod')
    OR public.has_role(auth.uid(), 'daa') OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'concern-hod') OR public.has_role(auth.uid(), 'school-hod')
    OR public.has_role(auth.uid(), 'daa') OR public.has_role(auth.uid(), 'admin')
  );

-- ACHIEVEMENT_REVIEWS
CREATE POLICY "Reviewers can insert reviews"
  ON public.achievement_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can read reviews on own achievements"
  ON public.achievement_reviews FOR SELECT TO authenticated
  USING (achievement_id IN (SELECT id FROM public.achievements WHERE student_id = auth.uid()));

CREATE POLICY "Reviewers can read own reviews"
  ON public.achievement_reviews FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Admins can read all reviews"
  ON public.achievement_reviews FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- NOTIFICATIONS
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND target_audience = 'all'));

CREATE POLICY "Authenticated users can send notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 9. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('achievement-files', 'achievement-files', false);

CREATE POLICY "Students can upload own files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'achievement-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can read own files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'achievement-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Reviewers can read achievement files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'achievement-files'
    AND (public.has_role(auth.uid(), 'concern-hod') OR public.has_role(auth.uid(), 'school-hod')
         OR public.has_role(auth.uid(), 'daa') OR public.has_role(auth.uid(), 'admin'))
  );
