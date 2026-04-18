import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnimatedCounter } from "@/hooks/use-dashboard";
import { useNavigate } from "react-router-dom";
import {
  Users, Briefcase, TrendingUp, UserPlus, Clock, CheckCircle2,
  XCircle, Loader2, GraduationCap, BarChart3, ArrowRight, Sparkles
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color, delay }: any) => {
  const count = useAnimatedCounter(value, 1200, delay);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay / 1000 }}>
      <Card className="relative overflow-hidden p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{count}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const ConcernHOD = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["tpc-dashboard-full", user?.id],
    queryFn: async () => {
      const [apps, jobs, drives, profiles, referrals] = await Promise.all([
        supabase.from("applications").select("id, status", { count: "exact" }),
        supabase.from("job_postings").select("id, title, status, package_lpa, deadline, companies(name)").order("created_at", { ascending: false }).limit(10),
        supabase.from("placement_drives").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("id, name, department, branch, cgpa, placement_status, avatar_url").limit(500),
        supabase.from("referrals").select("*").order("requested_at", { ascending: false }).limit(20),
      ]);

      const allApps = apps.data || [];
      const studentProfiles = profiles.data || [];
      const placed = studentProfiles.filter(p => p.placement_status === "placed").length;

      return {
        totalApplications: apps.count || allApps.length,
        openJobs: (jobs.data || []).filter((j: any) => j.status === "open").length,
        recentJobs: jobs.data || [],
        drives: drives.count || 0,
        totalStudents: studentProfiles.length,
        placedStudents: placed,
        placementRate: studentProfiles.length > 0 ? ((placed / studentProfiles.length) * 100).toFixed(1) : "0",
        referrals: referrals.data || [],
        profiles: studentProfiles,
        applicationsByStatus: {
          applied: allApps.filter((a: any) => a.status === "applied").length,
          shortlisted: allApps.filter((a: any) => a.status === "shortlisted").length,
          interviewing: allApps.filter((a: any) => a.status === "interviewing").length,
          hired: allApps.filter((a: any) => ["hired", "accepted"].includes(a.status || "")).length,
          rejected: allApps.filter((a: any) => a.status === "rejected").length,
        },
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const pendingReferrals = (data?.referrals || []).filter((r: any) => r.status === "pending");
  const approvedReferrals = (data?.referrals || []).filter((r: any) => r.status === "approved");

  const pipeline = data?.applicationsByStatus || { applied: 0, shortlisted: 0, interviewing: 0, hired: 0, rejected: 0 };
  const pipelineMax = Math.max(pipeline.applied, 1);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
              TPC Coordinator Dashboard
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Welcome back, {user?.name?.split(" ")[0]}. Here's your department overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/referrals")}>
              <UserPlus className="h-4 w-4 mr-1" /> Referrals
              {pendingReferrals.length > 0 && (
                <Badge className="ml-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] gradient-primary text-primary-foreground">
                  {pendingReferrals.length}
                </Badge>
              )}
            </Button>
            <Button size="sm" onClick={() => navigate("/hod-ai")} className="gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4 mr-1" /> AI Assistant
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={GraduationCap} label="Total Students" value={data?.totalStudents || 0} color="gradient-primary" delay={0} />
          <StatCard icon={Users} label="Placed" value={data?.placedStudents || 0} color="bg-emerald-500" delay={100} />
          <StatCard icon={Briefcase} label="Open Positions" value={data?.openJobs || 0} color="bg-blue-500" delay={200} />
          <StatCard icon={TrendingUp} label="Placement Rate" value={Number(data?.placementRate || 0)} color="bg-violet-500" delay={300} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Hiring Pipeline */}
          <Card className="p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground">Hiring Pipeline</h3>
            <div className="space-y-3">
              {[
                { label: "Applied", count: pipeline.applied, color: "bg-primary" },
                { label: "Shortlisted", count: pipeline.shortlisted, color: "bg-blue-500" },
                { label: "Interviewing", count: pipeline.interviewing, color: "bg-amber-500" },
                { label: "Hired", count: pipeline.hired, color: "bg-emerald-500" },
                { label: "Rejected", count: pipeline.rejected, color: "bg-destructive" },
              ].map((stage, i) => {
                const pct = pipelineMax > 0 ? (stage.count / pipelineMax) * 100 : 0;
                return (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{stage.label}</span>
                      <span className="text-sm font-bold text-foreground">{stage.count}</span>
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

          {/* Pending Referrals */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" /> Pending Referrals
              </h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/referrals")} className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            {pendingReferrals.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/30 mb-2" />
                <p className="text-sm text-muted-foreground">All caught up! No pending referrals.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingReferrals.slice(0, 5).map((ref: any, i: number) => {
                  const student = data?.profiles?.find((p: any) => p.id === ref.student_id);
                  return (
                    <motion.div
                      key={ref.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate("/referrals")}
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                        {(student?.name || "S").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{student?.name || "Student"}</p>
                        <p className="text-[11px] text-muted-foreground">{student?.branch} • CGPA: {student?.cgpa || "N/A"}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">
                        <Clock className="h-2.5 w-2.5 mr-1" /> Pending
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Job Postings */}
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-bold text-foreground">Recent Job Postings</h3>
          {(data?.recentJobs || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No job postings yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.recentJobs || []).slice(0, 6).map((job: any, i: number) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className="text-[10px]">
                      {job.status}
                    </Badge>
                    {job.package_lpa && (
                      <span className="text-[11px] font-bold text-emerald-600">₹{job.package_lpa} LPA</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{job.companies?.name || "Company"}</p>
                  {job.deadline && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default ConcernHOD;
