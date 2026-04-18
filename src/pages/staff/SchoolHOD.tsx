import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnimatedCounter } from "@/hooks/use-dashboard";
import ComposeNotificationModal from "@/components/dashboard/shared/ComposeNotificationModal";
import { toast } from "@/hooks/use-toast";
import {
  Briefcase, Users, TrendingUp, Target, Plus, Search, Sparkles, Bell,
  Building2, Clock, CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp,
  Filter, SlidersHorizontal, Loader2, Zap, UserCheck, BarChart3, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Types ───
interface Profile {
  id: string; name: string; branch: string | null; cgpa: number | null;
  skills: string[] | null; aptitude_score: number | null; programming_score: number | null;
  backlogs: number | null; placement_status: string | null; department: string | null;
  avatar_url: string | null; school: string | null;
}
interface JobPosting {
  id: string; title: string; company_id: string; status: string | null;
  package_lpa: number | null; deadline: string | null; created_at: string;
  skills_required: string[] | null; eligible_branches: string[] | null;
  companies?: { name: string } | null;
}
interface Application {
  id: string; status: string | null; applied_at: string; student_id: string;
  job_posting_id: string; ai_match_score: number | null;
}

// ─── Stat Card ───
const StatCard = ({ icon: Icon, label, value, sub, color, delay }: any) => {
  const count = useAnimatedCounter(value, 1200, delay);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay / 1000, duration: 0.4 }} className="h-full">
      <Card className="relative overflow-hidden p-4 group hover:shadow-md transition-shadow h-full">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{typeof value === 'string' ? value : count}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const SchoolHOD = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [minCgpa, setMinCgpa] = useState([0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("cgpa-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // AI Talent Scout
  const [aiQuery, setAiQuery] = useState("");
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Expanded rows
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [profilesRes, jobsRes, appsRes] = await Promise.all([
        supabase.from("profiles").select("id, name, branch, cgpa, skills, aptitude_score, programming_score, backlogs, placement_status, department, avatar_url, school").limit(500),
        supabase.from("job_postings").select("*, companies(name)").order("created_at", { ascending: false }).limit(100),
        supabase.from("applications").select("id, status, applied_at, student_id, job_posting_id, ai_match_score").limit(500),
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data as any);
      if (jobsRes.data) setJobs(jobsRes.data as any);
      if (appsRes.data) setApplications(appsRes.data as any);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ─── Derived Data ───
  const openPositions = jobs.filter(j => j.status === "open").length;
  const totalApplicants = applications.length;
  const shortlisted = applications.filter(a => ["shortlisted", "interviewing"].includes(a.status || "")).length;
  const hired = applications.filter(a => ["hired", "accepted"].includes(a.status || "")).length;
  const conversionRate = totalApplicants > 0 ? ((hired / totalApplicants) * 100).toFixed(1) : "0";

  // Pipeline counts
  const pipeline = {
    applied: applications.filter(a => a.status === "applied").length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    interviewing: applications.filter(a => a.status === "interviewing").length,
    hired,
    rejected: applications.filter(a => a.status === "rejected").length,
  };
  const pipelineMax = Math.max(pipeline.applied, 1);

  // Unique values for filters
  const departments = useMemo(() => [...new Set(profiles.map(p => p.department).filter(Boolean))].sort(), [profiles]);
  const branches = useMemo(() => [...new Set(profiles.map(p => p.branch).filter(Boolean))].sort(), [profiles]);

  // Filtered + sorted profiles
  const filteredProfiles = useMemo(() => {
    let list = profiles.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(q);
        const skillMatch = p.skills?.some(s => s.toLowerCase().includes(q));
        const branchMatch = p.branch?.toLowerCase().includes(q);
        if (!nameMatch && !skillMatch && !branchMatch) return false;
      }
      if (deptFilter !== "all" && p.department !== deptFilter) return false;
      if (branchFilter !== "all" && p.branch !== branchFilter) return false;
      if ((p.cgpa || 0) < minCgpa[0]) return false;
      if (statusFilter === "placed" && p.placement_status !== "placed") return false;
      if (statusFilter === "unplaced" && p.placement_status === "placed") return false;
      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case "cgpa-desc": return (b.cgpa || 0) - (a.cgpa || 0);
        case "cgpa-asc": return (a.cgpa || 0) - (b.cgpa || 0);
        case "aptitude-desc": return (b.aptitude_score || 0) - (a.aptitude_score || 0);
        case "programming-desc": return (b.programming_score || 0) - (a.programming_score || 0);
        case "name-asc": return (a.name || "").localeCompare(b.name || "");
        default: return 0;
      }
    });
    return list;
  }, [profiles, searchQuery, deptFilter, branchFilter, minCgpa, statusFilter, sortBy]);

  // AI Talent Scout
  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const studentData = profiles.map(p => ({
        id: p.id, name: p.name, branch: p.branch, cgpa: p.cgpa,
        skills: p.skills, aptitude_score: p.aptitude_score,
        programming_score: p.programming_score, backlogs: p.backlogs,
        placement_status: p.placement_status,
      }));
      const { data, error } = await supabase.functions.invoke("ai-talent-scout", {
        body: { query: aiQuery, students: studentData },
      });
      if (error) throw error;
      setAiResults(data?.results || []);
    } catch (e: any) {
      toast({ title: "AI Search Failed", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selectedStudents.size === filteredProfiles.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredProfiles.map(p => p.id)));
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const daysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return d;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
              Recruiter Command Center
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Welcome back, {user?.name?.split(" ")[0] || "Recruiter"}. Here's your hiring overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotifOpen(true)}>
              <Bell className="h-4 w-4 mr-1" /> Notify Students
            </Button>
            <Button size="sm" onClick={() => navigate("/recruiter/post-job")} className="gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Post Job
            </Button>
          </div>
        </div>

        {/* ─── STATS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Briefcase} label="Open Positions" value={openPositions} color="gradient-primary" delay={0} />
          <StatCard icon={Users} label="Total Applicants" value={totalApplicants} color="bg-violet-500" delay={100} />
          <StatCard icon={UserCheck} label="Shortlisted" value={shortlisted} sub="interviewing + shortlisted" color="bg-blue-500" delay={200} />
          <StatCard icon={Target} label="Conversion Rate" value={conversionRate + "%"} sub={`${hired} hired of ${totalApplicants}`} color="bg-emerald-500" delay={300} />
        </div>


        {/* ─── AI TALENT SCOUT ─── */}
        <Card className="p-5 space-y-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">AI Talent Scout</h3>
            <Badge variant="secondary" className="text-[10px]">Powered by AI</Badge>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder='Try: "Top 10 CSE students with React, CGPA above 8, no backlogs"'
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiSearch()}
              className="flex-1"
            />
            <Button onClick={handleAiSearch} disabled={aiLoading || !aiQuery.trim()}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Search
            </Button>
          </div>

          <AnimatePresence>
            {showAiPanel && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                {aiLoading ? (
                  <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> Analyzing {profiles.length} student profiles...
                  </div>
                ) : aiResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No matches found. Try a different query.</p>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top {aiResults.length} Matches</p>
                      {aiResults.length > 0 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                          // Select all AI matched students and open notify
                          const matchedIds = aiResults.map((r: any) => r.id).filter((id: string) => profiles.find(p => p.id === id));
                          setSelectedStudents(new Set(matchedIds));
                          setNotifOpen(true);
                        }}>
                          <Bell className="h-3 w-3 mr-1" /> Notify All Matched
                        </Button>
                      )}
                    </div>
                    {aiResults.map((r: any, i: number) => {
                      const student = profiles.find(p => p.id === r.id);
                      if (!student) return null;
                      return (
                        <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/30 transition-colors">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            #{r.rank || i + 1}
                          </div>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-xs">
                            {getInitials(student.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{student.name}</p>
                            <p className="text-[11px] text-muted-foreground">{student.branch} • CGPA: {student.cgpa || "N/A"}</p>
                          </div>
                          <div className="hidden sm:flex flex-wrap gap-1 max-w-[200px]">
                            {student.skills?.slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                            ))}
                          </div>
                          <p className="text-[11px] text-muted-foreground max-w-[200px] hidden lg:block truncate">{r.reason}</p>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => navigate("/recruiter/candidates")} title="View Profile">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Hiring Pipeline */}
          <Card className="p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground">Hiring Pipeline</h3>
            <div className="space-y-4">
              {[
                { label: "Applied", count: pipeline.applied, color: "bg-primary", icon: ArrowRight },
                { label: "Shortlisted", count: pipeline.shortlisted, color: "bg-blue-500", icon: Eye },
                { label: "Interviewing", count: pipeline.interviewing, color: "bg-amber-500", icon: Clock },
                { label: "Hired", count: pipeline.hired, color: "bg-emerald-500", icon: CheckCircle2 },
                { label: "Rejected", count: pipeline.rejected, color: "bg-destructive", icon: XCircle },
              ].map((stage, i) => {
                const pct = pipelineMax > 0 ? (stage.count / pipelineMax) * 100 : 0;
                const convPct = i > 0 && pipeline.applied > 0 ? ((stage.count / pipeline.applied) * 100).toFixed(0) : null;
                return (
                  <div key={stage.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <stage.icon className={`h-3.5 w-3.5 ${stage.color.replace("bg-", "text-")}`} />
                        <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{stage.count}</span>
                        {convPct && <span className="text-[10px] text-muted-foreground">({convPct}%)</span>}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, stage.count > 0 ? 3 : 0)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full rounded-full ${stage.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active Job Listings */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Active Listings</h3>
              <Badge variant="secondary" className="text-[10px]">{openPositions} open</Badge>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {jobs.filter(j => j.status === "open").slice(0, 8).map(job => {
                const dl = daysLeft(job.deadline);
                const appCount = applications.filter(a => a.job_posting_id === job.id).length;
                return (
                  <div key={job.id} className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                        <p className="text-[11px] text-muted-foreground">{(job as any).companies?.name || "Company"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="flex items-center gap-2 justify-end">
                        {job.package_lpa && <span className="text-xs font-bold text-foreground">{job.package_lpa} LPA</span>}
                        <Badge variant="secondary" className="text-[9px]">{appCount} apps</Badge>
                      </div>
                      {dl !== null && (
                        <p className={`text-[10px] font-medium ${dl < 3 ? "text-destructive" : dl < 7 ? "text-amber-500" : "text-muted-foreground"}`}>
                          {dl <= 0 ? "Expired" : `${dl}d left`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {openPositions === 0 && (
                <div className="text-center py-8">
                  <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No active listings</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => navigate("/recruiter/post-job")}>Post a Job</Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ─── RECENT ACTIVITY ─── */}
        <Card className="p-5 space-y-3">
          <h3 className="text-base font-bold text-foreground">Recent Activity</h3>
          {applications.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No activity yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {applications.slice(0, 6).map(app => {
                const student = profiles.find(p => p.id === app.student_id);
                const job = jobs.find(j => j.id === app.job_posting_id);
                return (
                  <div key={app.id} className="flex items-center gap-3 rounded-lg p-2.5 border border-border/50 hover:bg-secondary/30 transition-colors">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground font-bold text-[10px]">
                      {student ? getInitials(student.name) : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">
                        <span className="font-semibold">{student?.name || "Student"}</span>
                        {" → "}
                        <span className="text-primary">{job?.title || "Position"}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {" • "}
                        <span className={app.status === "hired" ? "text-emerald-500" : app.status === "rejected" ? "text-destructive" : "text-muted-foreground"}>
                          {app.status || "applied"}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      <ComposeNotificationModal open={notifOpen} onOpenChange={setNotifOpen} />
    </DashboardLayout>
  );
};

export default SchoolHOD;
