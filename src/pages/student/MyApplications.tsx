import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format, formatDistanceToNow } from "date-fns";
import {
  FileText, Briefcase, CheckCircle, Clock, Send, XCircle, Award,
  ArrowRight, Search, LayoutGrid, List, TrendingUp, Target,
  Building2, Calendar, IndianRupee, ExternalLink, Filter, Sparkles,
  ArrowUpRight, BarChart3, Zap
} from "lucide-react";

type Application = {
  id: string;
  status: string | null;
  applied_at: string;
  ai_match_score: number | null;
  cover_note: string | null;
  job_postings: {
    title: string;
    package_lpa: number | null;
    deadline: string | null;
    companies: { name: string; logo_url: string | null } | null;
  } | null;
};

const STAGES = [
  { key: "applied", label: "Applied", icon: Send, color: "bg-blue-500", textColor: "text-blue-600 dark:text-blue-400", bgLight: "bg-blue-50 dark:bg-blue-500/10", borderColor: "border-blue-200 dark:border-blue-500/20" },
  { key: "shortlisted", label: "Shortlisted", icon: CheckCircle, color: "bg-violet-500", textColor: "text-violet-600 dark:text-violet-400", bgLight: "bg-violet-50 dark:bg-violet-500/10", borderColor: "border-violet-200 dark:border-violet-500/20" },
  { key: "interview", label: "Interview", icon: Clock, color: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400", bgLight: "bg-amber-50 dark:bg-amber-500/10", borderColor: "border-amber-200 dark:border-amber-500/20" },
  { key: "offered", label: "Offered", icon: Award, color: "bg-emerald-500", textColor: "text-emerald-600 dark:text-emerald-400", bgLight: "bg-emerald-50 dark:bg-emerald-500/10", borderColor: "border-emerald-200 dark:border-emerald-500/20" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", bgLight: "bg-red-50 dark:bg-red-500/10", borderColor: "border-red-200 dark:border-red-500/20" },
];

const getStage = (key: string) => STAGES.find(s => s.key === key) || STAGES[0];

const StatusBadge = ({ status }: { status: string }) => {
  const stage = getStage(status);
  const Icon = stage.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${stage.bgLight} ${stage.textColor} border ${stage.borderColor}`}>
      <Icon className="h-3 w-3" />
      {stage.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
  <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
    <CardContent className="p-4 flex items-start gap-3">
      <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

const MyApplications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["my-applications-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, applied_at, ai_match_score, cover_note, job_postings(title, package_lpa, deadline, companies(name, logo_url))")
        .eq("student_id", user!.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Application[];
    },
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    let list = applications || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.job_postings?.title?.toLowerCase().includes(q) ||
        a.job_postings?.companies?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (sortBy === "newest") list = [...list].sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
    if (sortBy === "oldest") list = [...list].sort((a, b) => new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime());
    if (sortBy === "match") list = [...list].sort((a, b) => (b.ai_match_score || 0) - (a.ai_match_score || 0));
    if (sortBy === "package") list = [...list].sort((a, b) => (b.job_postings?.package_lpa || 0) - (a.job_postings?.package_lpa || 0));
    return list;
  }, [applications, search, statusFilter, sortBy]);

  const grouped = STAGES.map(s => ({ ...s, apps: filtered.filter(a => a.status === s.key) }));

  const stats = useMemo(() => {
    const all = applications || [];
    const total = all.length;
    const offered = all.filter(a => a.status === "offered").length;
    const interviewing = all.filter(a => a.status === "interview").length;
    const avgMatch = total > 0 ? Math.round(all.reduce((s, a) => s + (a.ai_match_score || 0), 0) / total) : 0;
    const successRate = total > 0 ? Math.round(((offered + interviewing) / total) * 100) : 0;
    return { total, offered, interviewing, avgMatch, successRate };
  }, [applications]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              My Applications
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track and manage your placement journey
            </p>
          </div>
          <Button onClick={() => navigate("/jobs")} className="gap-2 gradient-primary text-primary-foreground rounded-xl shadow-sm hover:shadow-glow">
            <Zap className="h-4 w-4" /> Browse New Jobs
          </Button>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={FileText} label="Total Applied" value={stats.total} sub={`${stats.offered} offers received`} color="bg-blue-500" />
            <StatCard icon={TrendingUp} label="Success Rate" value={`${stats.successRate}%`} sub="Shortlist + Interview + Offered" color="bg-emerald-500" />
            <StatCard icon={Target} label="Avg Match Score" value={`${stats.avgMatch}%`} sub="AI compatibility rating" color="bg-violet-500" />
            <StatCard icon={BarChart3} label="In Progress" value={stats.interviewing} sub="Currently interviewing" color="bg-amber-500" />
          </div>
        )}

        {/* Pipeline Progress Bar */}
        {!isLoading && stats.total > 0 && (
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-foreground">Application Pipeline</p>
                <p className="text-[11px] text-muted-foreground">{stats.total} total applications</p>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-secondary gap-px">
                {STAGES.map(stage => {
                  const count = (applications || []).filter(a => a.status === stage.key).length;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <motion.div
                      key={stage.key}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`${stage.color} rounded-full`}
                      title={`${stage.label}: ${count}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2.5">
                {STAGES.map(stage => {
                  const count = (applications || []).filter(a => a.status === stage.key).length;
                  return (
                    <div key={stage.key} className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                      <span className="text-[11px] text-muted-foreground">{stage.label}</span>
                      <span className="text-[11px] font-bold text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toolbar - Search, Filter, Sort, View Toggle */}
        {!isLoading && stats.total > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-xl h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs">
                  <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="package">Highest Package</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
                <TabsList className="h-9 p-0.5 rounded-xl">
                  <TabsTrigger value="table" className="rounded-lg px-2.5 text-xs gap-1.5">
                    <List className="h-3.5 w-3.5" /> Table
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="rounded-lg px-2.5 text-xs gap-1.5">
                    <LayoutGrid className="h-3.5 w-3.5" /> Board
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : !applications?.length ? (
          <EmptyState onBrowse={() => navigate("/jobs")} />
        ) : filtered.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-12 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-foreground">No matching applications</h3>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        ) : view === "table" ? (
          <TableView apps={filtered} />
        ) : (
          <KanbanView grouped={grouped} />
        )}
      </motion.div>
    </DashboardLayout>
  );
};

/* ======================= TABLE VIEW ======================= */
const TableView = ({ apps }: { apps: Application[] }) => (
  <Card className="border-border/60 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Company & Role</th>
            <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Package</th>
            <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Applied</th>
            <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Match</th>
            <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {apps.map((app, i) => (
              <motion.tr
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-border/50 hover:bg-accent/5 transition-colors group cursor-pointer"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                      {app.job_postings?.companies?.logo_url ? (
                        <img src={app.job_postings.companies.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {app.job_postings?.title || "Role"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.job_postings?.companies?.name || "Company"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  {app.job_postings?.package_lpa ? (
                    <span className="text-sm font-semibold text-foreground flex items-center gap-0.5">
                      <IndianRupee className="h-3 w-3" />{app.job_postings.package_lpa} LPA
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <div>
                    <p className="text-xs text-foreground">{format(new Date(app.applied_at), "MMM d, yyyy")}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {app.ai_match_score ? (
                    <div className="flex items-center gap-2">
                      <div className="w-14">
                        <Progress value={app.ai_match_score} className="h-1.5" />
                      </div>
                      <span className={`text-xs font-bold ${app.ai_match_score >= 75 ? "text-emerald-600" : app.ai_match_score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                        {Math.round(app.ai_match_score)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={app.status || "applied"} />
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  </Card>
);

/* ======================= KANBAN VIEW ======================= */
const KanbanView = ({ grouped }: { grouped: (typeof STAGES[0] & { apps: Application[] })[] }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
    {grouped.map(stage => (
      <div key={stage.key} className="space-y-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${stage.bgLight} border ${stage.borderColor}`}>
          <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${stage.textColor}`}>{stage.label}</span>
          <span className="ml-auto text-[10px] font-bold text-muted-foreground bg-background/60 rounded-full px-2 py-0.5">{stage.apps.length}</span>
        </div>
        <div className="space-y-2 min-h-[120px]">
          <AnimatePresence>
            {stage.apps.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                        {app.job_postings?.companies?.logo_url ? (
                          <img src={app.job_postings.companies.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {app.job_postings?.title || "Role"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {app.job_postings?.companies?.name || "Company"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(app.applied_at), "MMM d")}
                      </span>
                      {app.ai_match_score && (
                        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${app.ai_match_score >= 75 ? "text-emerald-600" : "text-amber-600"}`}>
                          <Sparkles className="h-3 w-3" /> {Math.round(app.ai_match_score)}%
                        </span>
                      )}
                    </div>
                    {app.job_postings?.package_lpa && (
                      <div className="flex items-center gap-0.5 text-[11px] font-semibold text-foreground">
                        <IndianRupee className="h-3 w-3" /> {app.job_postings.package_lpa} LPA
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {stage.apps.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-border/40 p-6 text-center">
              <stage.icon className="h-5 w-5 mx-auto text-muted-foreground/20 mb-1" />
              <p className="text-[10px] text-muted-foreground">No applications</p>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

/* ======================= EMPTY STATE ======================= */
const EmptyState = ({ onBrowse }: { onBrowse: () => void }) => (
  <Card className="border-border/60">
    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Briefcase className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground">No applications yet</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
        Start applying to companies from the Job Board. Your applications will appear here with real-time tracking.
      </p>
      <Button onClick={onBrowse} className="gap-2 gradient-primary text-primary-foreground rounded-xl shadow-sm hover:shadow-glow">
        <Zap className="h-4 w-4" /> Explore Job Board
      </Button>
    </CardContent>
  </Card>
);

export default MyApplications;
