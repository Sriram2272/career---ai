import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Target, TrendingUp, CheckCircle } from "lucide-react";

type Category = { label: string; score: number; max: 20 };

const PlacementReadiness = () => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["readiness-score", user?.id],
    queryFn: async () => {
      const cats: Category[] = [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("cgpa, resume_url, skills, phone, branch, registration_number, tenth_percent, twelfth_percent, linkedin_url, preferred_roles")
        .eq("id", user!.id)
        .maybeSingle();

      // 1. Profile Completeness (20)
      if (profile) {
        const fields = [profile.cgpa, profile.phone, profile.branch, profile.registration_number, profile.tenth_percent, profile.twelfth_percent, profile.linkedin_url, (profile.preferred_roles as string[] | null)?.length ? true : null];
        const filled = fields.filter(Boolean).length;
        cats.push({ label: "Profile", score: Math.min(Math.round((filled / fields.length) * 20), 20) as any, max: 20 });
      } else {
        cats.push({ label: "Profile", score: 0, max: 20 });
      }

      // 2. Resume Upload (20)
      const hasResume = !!profile?.resume_url;
      const hasSkillsInProfile = ((profile?.skills as string[] | null)?.length || 0) >= 3;
      let resumeScore = 0;
      if (hasResume) resumeScore += 14;
      if (hasSkillsInProfile) resumeScore += 6;
      cats.push({ label: "Resume", score: Math.min(resumeScore, 20) as any, max: 20 });

      // 3. Skills (20)
      const { count: skillCount } = await supabase
        .from("student_skills")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user!.id);
      cats.push({ label: "Skills", score: Math.min((skillCount || 0) * 4, 20) as any, max: 20 });

      // 4. Applications (20)
      const { count: appCount } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user!.id);
      cats.push({ label: "Applications", score: Math.min((appCount || 0) * 5, 20) as any, max: 20 });

      // 5. Mock Interviews (20)
      const { count: mockCount } = await supabase
        .from("mock_interviews")
        .select("*", { count: "exact", head: true })
        .eq("student_id", user!.id);
      cats.push({ label: "Interviews", score: Math.min((mockCount || 0) * 7, 20) as any, max: 20 });

      const total = cats.reduce((s, c) => s + c.score, 0);
      return { categories: cats, total: Math.min(total, 100) };
    },
    enabled: !!user?.id,
  });

  const score = data?.total ?? 0;
  const categories = data?.categories ?? [];
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 50) return "text-amber-500";
    return "text-destructive";
  };

  const getMessage = (s: number) => {
    if (s >= 80) return "You're placement-ready! Keep the momentum going.";
    if (s >= 50) return "Almost there — fill profile gaps & practice interviews.";
    if (s >= 25) return "Good start! Add skills, upload resume, and apply to jobs.";
    return "Let's begin — complete your profile to unlock opportunities.";
  };

  const barColor = (s: number, max: number) => {
    const pct = (s / max) * 100;
    if (pct >= 80) return "bg-emerald-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl card-border bg-card p-6 card-shadow h-full"
    >
      <div className="flex items-start gap-5">
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" className="-rotate-90">
            <circle cx="50" cy="50" r="45" stroke="hsl(var(--border))" strokeWidth="8" fill="none" />
            <motion.circle
              cx="50" cy="50" r="45"
              stroke={score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "hsl(var(--destructive))"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
              strokeDasharray={circumference}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getColor(score)}`}>{score}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Placement Readiness</h3>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{getMessage(score)}</p>

          {/* 5 category bars */}
          <div className="mt-3 space-y-1.5">
            {categories.map((cat) => (
              <div key={cat.label} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground w-16 truncate">{cat.label}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.score / cat.max) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className={`h-full rounded-full ${barColor(cat.score, cat.max)}`}
                  />
                </div>
                <span className="text-[10px] font-bold text-foreground w-8 text-right">
                  {cat.score === cat.max ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500 inline" />
                  ) : (
                    `${cat.score}/${cat.max}`
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlacementReadiness;
