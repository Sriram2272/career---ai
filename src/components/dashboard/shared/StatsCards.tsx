import { Briefcase, CheckCircle, Clock, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useAnimatedCounter } from "@/hooks/use-dashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const StatCard = ({ stat, index, compact }: { stat: { title: string; value: number; icon: any; change: string; gradient: string }; index: number; compact?: boolean }) => {
  const count = useAnimatedCounter(stat.value, 1000, index * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative overflow-hidden rounded-2xl card-border bg-card card-shadow transition-all duration-300 hover:card-shadow-hover hover:scale-[1.02] hover:-translate-y-0.5 ${compact ? "p-3" : "p-5"}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-80`} />
      <div className="flex items-start justify-between">
        <div>
          <p className={`font-semibold uppercase tracking-widest text-muted-foreground ${compact ? "text-[9px]" : "text-[11px]"}`}>{stat.title}</p>
          <p className={`stat-number mt-1 text-foreground ${compact ? "text-xl" : "mt-2 text-3xl"}`}>{count}</p>
          {!compact && <p className="mt-1.5 text-xs text-muted-foreground font-medium">{stat.change}</p>}
        </div>
        <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${compact ? "h-8 w-8" : "h-11 w-11"}`}>
          <stat.icon className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} />
        </div>
      </div>
    </motion.div>
  );
};

const StatsCards = ({ compact }: { compact?: boolean }) => {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["student-placement-stats", user?.id],
    queryFn: async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select("id, status")
        .eq("student_id", user!.id);

      const all = apps || [];
      return {
        applied: all.length,
        shortlisted: all.filter(a => a.status === "shortlisted").length,
        interview: all.filter(a => a.status === "interview").length,
        offered: all.filter(a => a.status === "offered").length,
      };
    },
    enabled: !!user?.id,
  });

  const stats = [
    { title: "Applied", value: data?.applied || 0, icon: Briefcase, change: "Total applications", gradient: "from-primary to-primary-glow" },
    { title: "Shortlisted", value: data?.shortlisted || 0, icon: CheckCircle, change: "Moved forward", gradient: "from-emerald-500 to-teal-500" },
    { title: "Interviews", value: data?.interview || 0, icon: Clock, change: "Scheduled", gradient: "from-amber-500 to-orange-500" },
    { title: "Offers", value: data?.offered || 0, icon: Award, change: "Congratulations!", gradient: "from-violet-500 to-purple-500" },
  ];

  return (
    <div className={`grid gap-3 h-full ${compact ? "grid-cols-2 grid-rows-2" : "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"}`}>
      {stats.map((stat, i) => (
        <StatCard key={stat.title} stat={stat} index={i} compact={compact} />
      ))}
    </div>
  );
};

export default StatsCards;
