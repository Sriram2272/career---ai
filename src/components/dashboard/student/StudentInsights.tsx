import { motion } from "framer-motion";
import { TrendingUp, Users, Briefcase, Loader2, Star, Target } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/use-dashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ActivityRow = ({ item, index }: { item: { label: string; value: number; icon: any }; index: number }) => {
  const count = useAnimatedCounter(item.value, 1000, 400 + index * 100);
  return (
    <div className="flex items-center justify-between rounded-xl card-accent-left bg-background px-4 py-3 transition-all duration-200 hover:bg-secondary/50 hover:translate-x-0.5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <item.icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground">{item.label}</span>
      </div>
      <span className="stat-number text-lg text-foreground">{count}</span>
    </div>
  );
};

const StudentInsights = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["platform-placement-stats", user?.id],
    queryFn: async () => {
      const { count: totalJobs } = await supabase
        .from("job_postings")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const { count: totalApplications } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true });

      // Matched positions: jobs where student's skills/branch match
      let matchedCount = 0;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("skills, branch")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          const { data: jobs } = await supabase
            .from("job_postings")
            .select("skills_required, eligible_branches")
            .eq("status", "open");

          const userSkills = ((profile.skills as string[]) || []).map(s => s.toLowerCase());
          const userBranch = (profile.branch || "").toLowerCase();

          matchedCount = (jobs || []).filter(job => {
            const reqSkills = ((job.skills_required as string[]) || []).map(s => s.toLowerCase());
            const branches = ((job.eligible_branches as string[]) || []).map(b => b.toLowerCase());
            const skillMatch = reqSkills.some(s => userSkills.includes(s));
            const branchMatch = branches.length === 0 || branches.includes(userBranch);
            return skillMatch && branchMatch;
          }).length;
        }
      }

      return {
        totalJobs: totalJobs || 0,
        matchedPositions: matchedCount,
        totalApplications: totalApplications || 0,
      };
    },
    enabled: !!user?.id,
  });

  const activityData = [
    { label: "Open Positions", value: stats?.totalJobs || 0, icon: Briefcase },
    { label: "Matched Positions", value: stats?.matchedPositions || 0, icon: Target },
    { label: "Total Applications", value: stats?.totalApplications || 0, icon: TrendingUp },
  ];

  const { data: featuredPlacements } = useQuery({
    queryKey: ["featured-placements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("featured_placements")
        .select("*")
        .eq("is_active", true)
        .order("featured_date", { ascending: false })
        .limit(3);
      // Fetch student names for placements
      const placements = data || [];
      const studentIds = placements.map((p: any) => p.student_id).filter(Boolean);
      let nameMap: Record<string, { name: string; avatar_url: string | null }> = {};
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", studentIds);
        (profiles || []).forEach((p: any) => { nameMap[p.id] = { name: p.name, avatar_url: p.avatar_url }; });
      }
      return placements.map((p: any) => ({
        ...p,
        student_name: nameMap[p.student_id]?.name || null,
        student_avatar: nameMap[p.student_id]?.avatar_url || null,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl card-border bg-card p-6 card-shadow"
      >
        <h3 className="text-sm font-semibold text-foreground">Placement Activity</h3>
        <p className="mt-1 text-xs text-muted-foreground">Platform overview</p>
        <div className="mt-5 space-y-3">
          {activityData.map((item, i) => (
            <ActivityRow key={item.label} item={item} index={i} />
          ))}
        </div>
      </motion.div>

      {(featuredPlacements || []).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl card-border bg-card p-6 card-shadow"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" /> Placement Stars
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Recently placed — you could be next!</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {(featuredPlacements || []).map((p: any, i: number) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex flex-col items-center rounded-2xl bg-background border border-border/50 p-4 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                {p.photo_url || p.student_avatar ? (
                  <img src={p.photo_url || p.student_avatar} alt={p.student_name || ""} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20 ring-offset-2 ring-offset-card mb-3" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-lg font-bold text-primary-foreground mb-3 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                    {(p.student_name || "S").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                {p.student_name && (
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">{p.student_name}</p>
                )}
                <p className="text-sm font-bold text-foreground leading-tight">{p.company_name}</p>
                {p.package_lpa && (
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600">
                    ₹{p.package_lpa} LPA
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentInsights;