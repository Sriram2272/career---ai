import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import {
  Trophy, TrendingUp, Target, BarChart3, Clock,
  Building2, Briefcase, ChevronRight, Star
} from "lucide-react";

interface InterviewRecord {
  id: string;
  domain: string | null;
  job_type: string | null;
  difficulty: string | null;
  overall_score: number | null;
  created_at: string;
  ai_feedback: any;
  duration_seconds: number | null;
}

const StatCard = ({ icon: Icon, label, value, sub, gradient }: {
  icon: any; label: string; value: string | number; sub?: string; gradient: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="group relative overflow-hidden rounded-2xl card-border bg-card card-shadow p-4 hover:card-shadow-hover hover:scale-[1.02] transition-all duration-300"
  >
    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-80`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-2xl font-black text-foreground mt-1">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </motion.div>
);

const getGradeFromScore = (score: number) => {
  if (score >= 90) return { grade: "A+", color: "text-green-500" };
  if (score >= 80) return { grade: "A", color: "text-green-500" };
  if (score >= 70) return { grade: "B+", color: "text-blue-500" };
  if (score >= 60) return { grade: "B", color: "text-blue-500" };
  if (score >= 50) return { grade: "C", color: "text-amber-500" };
  return { grade: "D", color: "text-red-500" };
};

const InterviewHistory = () => {
  const { user } = useAuth();

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ["interview-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("mock_interviews")
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as InterviewRecord[];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalInterviews = interviews.length;
  const scoredInterviews = interviews.filter(i => i.overall_score != null);
  const avgScore = scoredInterviews.length
    ? Math.round(scoredInterviews.reduce((a, b) => a + (b.overall_score || 0), 0) / scoredInterviews.length)
    : 0;

  // Improvement: compare last 3 vs first 3
  const first3 = scoredInterviews.slice(-3);
  const last3 = scoredInterviews.slice(0, 3);
  const avgFirst = first3.length ? first3.reduce((a, b) => a + (b.overall_score || 0), 0) / first3.length : 0;
  const avgLast = last3.length ? last3.reduce((a, b) => a + (b.overall_score || 0), 0) / last3.length : 0;
  const improvement = totalInterviews >= 2 ? Math.round(avgLast - avgFirst) : 0;

  const passRate = scoredInterviews.length
    ? Math.round((scoredInterviews.filter(i => (i.overall_score || 0) >= 60).length / scoredInterviews.length) * 100)
    : 0;

  const bestScore = scoredInterviews.length
    ? Math.max(...scoredInterviews.map(i => i.overall_score || 0))
    : 0;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BarChart3} label="Total Interviews" value={totalInterviews} sub="All time" gradient="from-primary to-primary-glow" />
        <StatCard icon={Target} label="Avg Score" value={avgScore ? `${avgScore}%` : "—"} sub={avgScore ? getGradeFromScore(avgScore).grade : "No data"} gradient="from-blue-500 to-cyan-500" />
        <StatCard icon={TrendingUp} label="Improvement" value={improvement > 0 ? `+${improvement}%` : improvement === 0 ? "—" : `${improvement}%`} sub="Recent vs early" gradient="from-emerald-500 to-teal-500" />
        <StatCard icon={Star} label="Best Score" value={bestScore ? `${bestScore}%` : "—"} sub={passRate ? `${passRate}% pass rate` : "No data"} gradient="from-amber-500 to-orange-500" />
      </div>

      {/* Interview History List */}
      {interviews.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No interviews yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Start a video interview to see your history here</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Recent Interviews
            </h3>
          </div>
          <ScrollArea className="max-h-[320px]">
            <div className="divide-y divide-border">
              {interviews.map((interview, idx) => {
                const score = interview.overall_score || 0;
                const { grade, color } = getGradeFromScore(score);
                const hireRec = interview.ai_feedback?.hireRecommendation;
                const date = new Date(interview.created_at);
                const timeAgo = getTimeAgo(date);

                return (
                  <motion.div
                    key={interview.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm ${color} bg-muted/50`}>
                      {grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate">{interview.domain || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Briefcase className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{interview.job_type || "General"}</span>
                        <span className="text-[10px] text-muted-foreground/60">•</span>
                        <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {interview.difficulty && (
                        <Badge variant="outline" className="text-[10px] capitalize">{interview.difficulty}</Badge>
                      )}
                      <div className="text-right">
                        <p className={`text-sm font-bold ${color}`}>{score}%</p>
                        {hireRec && <p className="text-[10px] text-muted-foreground truncate max-w-[80px]">{hireRec}</p>}
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default InterviewHistory;
