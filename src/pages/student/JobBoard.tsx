import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Filter, Briefcase, MapPin, IndianRupee, GraduationCap,
  Clock, CheckCircle, XCircle, AlertTriangle, Building2, Send, Loader2, UserPlus
} from "lucide-react";
import { format } from "date-fns";

type Job = {
  id: string;
  title: string;
  description: string | null;
  skills_required: string[] | null;
  min_cgpa: number | null;
  eligible_branches: string[] | null;
  job_type: string | null;
  package_lpa: number | null;
  deadline: string | null;
  status: string | null;
  interview_process: any;
  companies: { name: string; logo_url: string | null; locations: string[] | null; industry: string | null } | null;
};

const JobBoard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [matchFilter, setMatchFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [referralFacultyId, setReferralFacultyId] = useState("");
  const [referralMessage, setReferralMessage] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-profile-job", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("cgpa, skills, branch, preferred_roles, aptitude_score, programming_score").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["job-board"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select("id, title, description, skills_required, min_cgpa, eligible_branches, job_type, package_lpa, deadline, status, interview_process, companies(name, logo_url, locations, industry)")
        .eq("status", "open")
        .order("deadline", { ascending: true });
      return (data || []) as Job[];
    },
  });

  const { data: appliedIds } = useQuery({
    queryKey: ["applied-job-ids", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("job_posting_id").eq("student_id", user!.id);
      return new Set((data || []).map(a => a.job_posting_id));
    },
    enabled: !!user?.id,
  });

  // Fetch faculty members (HOD, Dean, etc.) for referral requests
  const { data: facultyList } = useQuery({
    queryKey: ["faculty-for-referral"],
    queryFn: async () => {
      // Get all non-student roles
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").neq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, name, department, faculty_uid").in("id", ids);
      return (profiles || []).map(p => ({
        ...p,
        role: roles.find(r => r.user_id === p.id)?.role || "staff",
      })).filter(p => p.faculty_uid); // Only show those with UIDs
    },
  });

  // Fetch existing referrals for current user
  const { data: myReferrals } = useQuery({
    queryKey: ["my-referrals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("referrals").select("job_posting_id, faculty_id, status").eq("student_id", user!.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const referralMutation = useMutation({
    mutationFn: async ({ jobId, facultyId }: { jobId: string; facultyId: string }) => {
      const { error } = await supabase.from("referrals").insert({
        student_id: user!.id,
        faculty_id: facultyId,
        job_posting_id: jobId,
        message: referralMessage || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-referrals"] });
      setShowReferralDialog(false);
      setReferralFacultyId("");
      setReferralMessage("");
      toast({ title: "Referral Requested! 🤝", description: "Your referral request has been sent to the faculty member." });
    },
    onError: () => toast({ title: "Failed", description: "Could not send referral request.", variant: "destructive" }),
  });


  const getMatchScore = (job: Job) => {
    if (!profile) return 0;
    let score = 0, total = 0;
    const mySkills = ((profile.skills as string[] | null) || []).map(s => s.toLowerCase());
    const required = (job.skills_required || []).map(s => s.toLowerCase());
    
    // Skills match (40%)
    if (required.length > 0) {
      const matched = required.filter(s => mySkills.some(ms => ms.includes(s) || s.includes(ms))).length;
      score += (matched / required.length) * 40;
      total += 40;
    }
    
    // CGPA match (20%)
    if (job.min_cgpa && profile.cgpa) {
      score += (profile.cgpa as number) >= job.min_cgpa ? 20 : ((profile.cgpa as number) / job.min_cgpa) * 15;
      total += 20;
    }
    
    // Branch match (15%)
    if (job.eligible_branches?.length && profile.branch) {
      score += job.eligible_branches.includes(profile.branch) ? 15 : 0;
      total += 15;
    }
    
    // Aptitude score contribution (12%)
    const aptitude = ((profile as any).aptitude_score as number) || 50;
    score += (aptitude / 100) * 12;
    total += 12;
    
    // Programming score contribution (13%)
    const programming = ((profile as any).programming_score as number) || 50;
    score += (programming / 100) * 13;
    total += 13;
    
    return total > 0 ? Math.round((score / total) * 100) : 50;
  };

  const getSkillStatus = (job: Job) => {
    const mySkills = ((profile?.skills as string[] | null) || []).map(s => s.toLowerCase());
    return (job.skills_required || []).map(skill => ({
      name: skill,
      have: mySkills.some(ms => ms.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ms)),
    }));
  };

  const isEligible = (job: Job) => {
    if (job.min_cgpa && profile?.cgpa && (profile.cgpa as number) < job.min_cgpa) return false;
    if (job.eligible_branches?.length && profile?.branch && !job.eligible_branches.includes(profile.branch)) return false;
    return true;
  };

  const applyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      setApplyingId(jobId);
      const matchScore = getMatchScore(jobs!.find(j => j.id === jobId)!);
      const { error } = await supabase.from("applications").insert({
        student_id: user!.id,
        job_posting_id: jobId,
        cover_note: coverNote || null,
        ai_match_score: matchScore,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applied-job-ids"] });
      queryClient.invalidateQueries({ queryKey: ["student-placement-stats"] });
      setSelectedJob(null);
      setCoverNote("");
      setApplyingId(null);
      toast({ title: "Applied successfully! 🎉", description: "Your application has been submitted." });
    },
    onError: () => {
      setApplyingId(null);
      toast({ title: "Application failed", description: "Something went wrong. Try again.", variant: "destructive" });
    },
  });

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter(job => {
      if (search) {
        const q = search.toLowerCase();
        if (!job.title.toLowerCase().includes(q) && !job.companies?.name.toLowerCase().includes(q)) return false;
      }
      if (typeFilter !== "all" && job.job_type !== typeFilter) return false;
      if (matchFilter === "80+" && getMatchScore(job) < 80) return false;
      if (matchFilter === "60+" && getMatchScore(job) < 60) return false;
      return true;
    });
  }, [jobs, search, typeFilter, matchFilter, profile]);

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-500/15";
    if (score >= 60) return "text-amber-600 bg-amber-500/15";
    return "text-destructive bg-destructive/15";
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Job Board</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Discover opportunities matched to your profile</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies or roles..." className="pl-9 rounded-xl bg-secondary/50 border-border/50 h-10" />
          </div>
          <div className="flex gap-2">
            {[
              { label: "All", value: "all" },
              { label: "Full-time", value: "full-time" },
              { label: "Internship", value: "internship" },
            ].map(t => (
              <button key={t.value} onClick={() => setTypeFilter(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === t.value ? "gradient-primary text-primary-foreground shadow-sm" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
            <button onClick={() => setMatchFilter(matchFilter === "all" ? "80+" : matchFilter === "80+" ? "60+" : "all")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${matchFilter !== "all" ? "bg-emerald-500/15 text-emerald-600" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <Filter className="h-3 w-3" />
              {matchFilter === "all" ? "Match %" : `≥${matchFilter}`}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredJobs.map((job, i) => {
                const match = getMatchScore(job);
                const skills = getSkillStatus(job);
                const eligible = isEligible(job);
                const applied = appliedIds?.has(job.id);
                const daysLeft = job.deadline ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000) : null;
                const expired = daysLeft !== null && daysLeft < 0;

                return (
                  <motion.div key={job.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                    className={`relative rounded-2xl card-border bg-card p-5 card-shadow transition-all duration-200 hover:card-shadow-hover ${!eligible ? "opacity-70" : ""}`}>
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      {match >= 75 && (
                        <span className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold bg-emerald-500/15 text-emerald-600">
                          <CheckCircle className="h-3 w-3" /> Recommended
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getMatchColor(match)}`}>{match}%</span>
                    </div>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {job.companies?.logo_url ? <img src={job.companies.logo_url} alt="" className="h-6 w-6 rounded" /> : <Building2 className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1 pr-16">
                        <p className="font-semibold text-foreground text-sm truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.companies?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.companies?.locations?.[0] && <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> {job.companies.locations[0]}</span>}
                      {job.package_lpa && <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><IndianRupee className="h-3 w-3" /> {job.package_lpa} LPA</span>}
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">{job.job_type}</Badge>
                      {daysLeft !== null && !expired && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${daysLeft <= 3 ? "bg-destructive/15 text-destructive" : daysLeft <= 7 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"}`}>
                          <Clock className="h-2.5 w-2.5" /> {daysLeft}d left
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skills.slice(0, 5).map(s => (
                        <span key={s.name} className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${s.have ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"}`}>
                          {s.have ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />} {s.name}
                        </span>
                      ))}
                    </div>
                    {!eligible && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-500/10 rounded-lg px-3 py-1.5 mb-3">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {job.min_cgpa && profile?.cgpa && (profile.cgpa as number) < job.min_cgpa ? `CGPA ${profile.cgpa} below minimum ${job.min_cgpa}` : "Branch not eligible"}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs h-8" onClick={() => { setSelectedJob(job); setCoverNote(""); }}>View Details</Button>
                      {applied ? (
                        <Button size="sm" disabled className="rounded-xl text-xs h-8 bg-emerald-500/15 text-emerald-600 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Applied</Button>
                      ) : (
                        <Button size="sm" disabled={!eligible || !!expired} className="rounded-xl text-xs h-8 gradient-primary text-primary-foreground" onClick={() => { setSelectedJob(job); setCoverNote(""); }}>Apply</Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No jobs match your filters</p>
          </div>
        )}
      </motion.div>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedJob && (() => {
            const match = getMatchScore(selectedJob);
            const skills = getSkillStatus(selectedJob);
            const eligible = isEligible(selectedJob);
            const applied = appliedIds?.has(selectedJob.id);
            const process = selectedJob.interview_process as any[] || [];

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">{selectedJob.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedJob.companies?.name}</p>
                </DialogHeader>
                <div className="rounded-xl bg-secondary/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Fit Analysis</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getMatchColor(match)}`}>{match}% match</span>
                  </div>
                  <div className="space-y-1.5">
                    {skills.map(s => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        {s.have ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                        <span className={s.have ? "text-foreground" : "text-muted-foreground"}>{s.name}</span>
                        {!s.have && <span className="text-[10px] text-destructive ml-auto">Gap</span>}
                      </div>
                    ))}
                  </div>
                  {selectedJob.min_cgpa && (
                    <div className="flex items-center gap-2 text-xs">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>CGPA: {profile?.cgpa || "N/A"} / {selectedJob.min_cgpa} required</span>
                      {profile?.cgpa && (profile.cgpa as number) >= (selectedJob.min_cgpa || 0) ? <CheckCircle className="h-3 w-3 text-emerald-500 ml-auto" /> : <XCircle className="h-3 w-3 text-destructive ml-auto" />}
                    </div>
                  )}
                </div>
                {selectedJob.description && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h4>
                    <p className="text-sm text-foreground leading-relaxed">{selectedJob.description}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {selectedJob.companies?.locations?.[0] && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedJob.companies.locations.join(", ")}</span>}
                  {selectedJob.package_lpa && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{selectedJob.package_lpa} LPA</span>}
                  {selectedJob.deadline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Deadline: {format(new Date(selectedJob.deadline), "MMM d, yyyy")}</span>}
                </div>
                {process.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Interview Process</h4>
                    <div className="space-y-2">
                      {process.map((round: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg bg-background px-3 py-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">{i + 1}</span>
                          <div>
                            <p className="text-xs font-medium text-foreground">{round.round}</p>
                            {round.duration && <p className="text-[10px] text-muted-foreground">{round.duration}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!applied ? (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Textarea value={coverNote} onChange={e => setCoverNote(e.target.value)} placeholder="Add a cover note (optional)..." className="rounded-xl bg-secondary/50 border-border/50 text-sm" rows={3} />
                    <Button disabled={!eligible || applyingId === selectedJob.id} onClick={() => applyMutation.mutate(selectedJob.id)} className="w-full gradient-primary text-primary-foreground rounded-xl gap-2">
                      {applyingId === selectedJob.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {eligible ? "Apply Now" : "Not Eligible"}
                    </Button>
                    {!eligible && <p className="text-[11px] text-amber-600 text-center">You don't meet the minimum requirements for this role.</p>}
                  </div>
                ) : (
                  <div className="rounded-xl bg-emerald-500/10 p-4 text-center">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
                    <p className="text-sm font-medium text-emerald-600">You've already applied!</p>
                  </div>
                )}

                {/* Ask for Referral */}
                {(() => {
                  const existingRef = myReferrals?.find(r => r.job_posting_id === selectedJob.id);
                  return existingRef ? (
                    <div className="rounded-xl bg-primary/5 p-3 text-center border border-primary/10">
                      <p className="text-xs text-primary font-medium">Referral {existingRef.status === "approved" ? "approved ✅" : existingRef.status === "declined" ? "declined" : "requested — pending"}</p>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full rounded-xl gap-2 text-xs" onClick={() => { setShowReferralDialog(true); }}>
                      <UserPlus className="h-3.5 w-3.5" /> Ask for Referral
                    </Button>
                  );
                })()}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Referral Request Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Request Referral</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Select a faculty member to request a referral for <span className="font-medium text-foreground">{selectedJob?.title}</span></p>
          <Select value={referralFacultyId} onValueChange={setReferralFacultyId}>
            <SelectTrigger className="rounded-xl bg-secondary/50">
              <SelectValue placeholder="Select faculty..." />
            </SelectTrigger>
            <SelectContent>
              {(facultyList || []).map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name} — {f.role === "concern-hod" ? "HOD" : f.role === "school-hod" ? "Dean" : f.role === "daa" ? "Director" : "Admin"} ({f.department}) [UID: {f.faculty_uid}]
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea value={referralMessage} onChange={e => setReferralMessage(e.target.value)} placeholder="Why should they refer you? (optional)" className="rounded-xl bg-secondary/50 border-border/50" rows={3} />
          <Button disabled={!referralFacultyId || !selectedJob} className="w-full gradient-primary text-primary-foreground rounded-xl gap-2"
            onClick={() => selectedJob && referralMutation.mutate({ jobId: selectedJob.id, facultyId: referralFacultyId })}>
            <UserPlus className="h-4 w-4" /> Send Request
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default JobBoard;
