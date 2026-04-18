import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import {
  Loader2, Search, SlidersHorizontal, ChevronRight, ChevronDown, ChevronUp,
  ArrowRight, Eye, Clock, CheckCircle2, XCircle, Users, Briefcase,
  Sparkles, Send, GraduationCap, Brain, Code, BookOpen, FileText,
  ExternalLink, Download, Building2, ArrowLeft
} from "lucide-react";

// ─── Types ───
interface Profile {
  id: string; name: string; branch: string | null; cgpa: number | null;
  skills: string[] | null; aptitude_score: number | null; programming_score: number | null;
  backlogs: number | null; placement_status: string | null; department: string | null;
  avatar_url: string | null; school: string | null; resume_url: string | null;
  tenth_percent: number | null; twelfth_percent: number | null;
  linkedin_url: string | null; preferred_roles: string[] | null;
  graduation_year: number | null; registration_number: string | null;
}
interface JobPosting {
  id: string; title: string; company_id: string; status: string | null;
  package_lpa: number | null; deadline: string | null; skills_required: string[] | null;
  eligible_branches: string[] | null; min_cgpa: number | null; job_type: string | null;
  companies?: { name: string } | null;
}
interface Application {
  id: string; status: string | null; applied_at: string; student_id: string;
  job_posting_id: string; ai_match_score: number | null;
}

const STAGES = [
  { key: "applied", label: "Applied", icon: ArrowRight, color: "text-primary" },
  { key: "shortlisted", label: "Shortlisted", icon: Eye, color: "text-blue-500" },
  { key: "interviewing", label: "Interviewing", icon: Clock, color: "text-amber-500" },
  { key: "hired", label: "Hired", icon: CheckCircle2, color: "text-emerald-500" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-destructive" },
];

const RecruiterApplications = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralFaculty, setReferralFaculty] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Job detail view
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Applicant filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("match-desc");
  const [minCgpa, setMinCgpa] = useState([0]);
  const [showFilters, setShowFilters] = useState(false);

  // Candidate deep-dive
  const [selectedCandidate, setSelectedCandidate] = useState<Profile | null>(null);
  const [candidateApp, setCandidateApp] = useState<Application | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  // AI Chat
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [jobsRes, appsRes, profilesRes, referralsRes] = await Promise.all([
        supabase.from("job_postings").select("*, companies(name)").order("created_at", { ascending: false }),
        supabase.from("applications").select("*").order("applied_at", { ascending: false }).limit(500),
        supabase.from("profiles").select("id, name, branch, cgpa, skills, aptitude_score, programming_score, backlogs, placement_status, department, avatar_url, school, resume_url, tenth_percent, twelfth_percent, linkedin_url, preferred_roles, graduation_year, registration_number").limit(500),
        supabase.from("referrals").select("*").eq("status", "approved"),
      ]);
      if (jobsRes.data) setJobs(jobsRes.data as any);
      if (appsRes.data) setApps(appsRes.data as any);
      if (profilesRes.data) setProfiles(profilesRes.data as any);
      if (referralsRes.data) {
        setReferrals(referralsRes.data);
        // Fetch faculty names for referrals
        const fIds = [...new Set(referralsRes.data.map((r: any) => r.faculty_id))];
        if (fIds.length) {
          const { data: fProfiles } = await supabase.from("profiles").select("id, name, faculty_uid, department").in("id", fIds);
          const map: Record<string, any> = {};
          (fProfiles || []).forEach(f => { map[f.id] = f; });
          setReferralFaculty(map);
        }
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // ─── Job list view ───
  const jobsWithCounts = useMemo(() => jobs.map(j => ({
    ...j,
    appCount: apps.filter(a => a.job_posting_id === j.id).length,
    hiredCount: apps.filter(a => a.job_posting_id === j.id && (a.status === "hired" || a.status === "accepted")).length,
  })), [jobs, apps]);

  // ─── Applicants for selected job ───
  const jobApplicants = useMemo(() => {
    if (!selectedJob) return [];
    let applicants = apps
      .filter(a => a.job_posting_id === selectedJob.id)
      .map(a => ({
        ...a,
        profile: profiles.find(p => p.id === a.student_id) || null,
      }))
      .filter(a => a.profile);

    // Filters
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      applicants = applicants.filter(a =>
        a.profile?.name?.toLowerCase().includes(q) ||
        a.profile?.skills?.some(s => s.toLowerCase().includes(q)) ||
        a.profile?.branch?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      applicants = applicants.filter(a => (a.status || "applied") === statusFilter);
    }
    if (minCgpa[0] > 0) {
      applicants = applicants.filter(a => (a.profile?.cgpa || 0) >= minCgpa[0]);
    }

    // Sort
    applicants.sort((a, b) => {
      switch (sortBy) {
        case "match-desc": return (b.ai_match_score || 0) - (a.ai_match_score || 0);
        case "cgpa-desc": return (b.profile?.cgpa || 0) - (a.profile?.cgpa || 0);
        case "recent": return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case "name": return (a.profile?.name || "").localeCompare(b.profile?.name || "");
        default: return 0;
      }
    });

    return applicants;
  }, [selectedJob, apps, profiles, searchQuery, statusFilter, sortBy, minCgpa]);

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      if (candidateApp?.id === appId) setCandidateApp(prev => prev ? { ...prev, status: newStatus } : null);
      toast({ title: "Updated", description: `Status changed to ${newStatus}` });
    }
  };

  const openCandidate = async (app: Application & { profile: Profile | null }) => {
    if (!app.profile) return;
    setSelectedCandidate(app.profile);
    setCandidateApp(app);
    setAiMessages([]);
    setResumeUrl(null);

    if (app.profile.resume_url) {
      const { data } = await supabase.storage.from("resumes").createSignedUrl(app.profile.resume_url, 3600);
      if (data) setResumeUrl(data.signedUrl);
    }
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || !selectedCandidate || !selectedJob) return;
    const userMsg = aiInput.trim();
    setAiInput("");
    setAiMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setAiLoading(true);

    try {
      const candidateContext = `
Student: ${selectedCandidate.name}
Branch: ${selectedCandidate.branch || "N/A"} | Department: ${selectedCandidate.department || "N/A"}
CGPA: ${selectedCandidate.cgpa || "N/A"} | Aptitude: ${selectedCandidate.aptitude_score || "N/A"}/100 | Programming: ${selectedCandidate.programming_score || "N/A"}/100
Backlogs: ${selectedCandidate.backlogs || 0} | 10th: ${selectedCandidate.tenth_percent || "N/A"}% | 12th: ${selectedCandidate.twelfth_percent || "N/A"}%
Skills: ${selectedCandidate.skills?.join(", ") || "None"}
Preferred Roles: ${selectedCandidate.preferred_roles?.join(", ") || "Not specified"}
Placement Status: ${selectedCandidate.placement_status || "unplaced"}
Match Score: ${candidateApp?.ai_match_score || "N/A"}%

Job: ${selectedJob.title} at ${(selectedJob as any).companies?.name || "Company"}
Required Skills: ${selectedJob.skills_required?.join(", ") || "None specified"}
Package: ${selectedJob.package_lpa || "N/A"} LPA | Min CGPA: ${selectedJob.min_cgpa || "N/A"}
Eligible Branches: ${selectedJob.eligible_branches?.join(", ") || "All"}`;

      const allMessages = [
        ...aiMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg },
      ];

      const { data, error } = await supabase.functions.invoke("ai-recommend", {
        body: {
          message: `You are helping a recruiter evaluate a candidate for a specific job. Here's the context:

${candidateContext}

The recruiter asks: ${userMsg}

Provide a helpful, data-driven response. Be concise (3-5 lines max). Reference specific scores and skills. If asked to compare, suggest what to look for.`,
        },
      });

      if (error) throw error;

      let assistantText = "";
      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantText += content;
                setAiMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                  }
                  return [...prev, { role: "assistant", content: assistantText }];
                });
              }
            } catch {}
          }
        }
      }
    } catch (e: any) {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const getMatchColor = (score: number) => score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-destructive";
  const daysLeft = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

  const radarData = selectedCandidate ? [
    { subject: "CGPA", value: ((selectedCandidate.cgpa || 0) / 10) * 100 },
    { subject: "Aptitude", value: selectedCandidate.aptitude_score || 0 },
    { subject: "Programming", value: selectedCandidate.programming_score || 0 },
    { subject: "10th", value: selectedCandidate.tenth_percent || 0 },
    { subject: "12th", value: selectedCandidate.twelfth_percent || 0 },
    { subject: "Skills", value: Math.min((selectedCandidate.skills?.length || 0) * 15, 100) },
  ] : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ─── CANDIDATE DEEP-DIVE VIEW ───
  if (selectedCandidate && candidateApp) {
    return (
      <DashboardLayout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Back */}
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCandidate(null); setCandidateApp(null); }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Applicants
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* LEFT: Student Profile */}
            <div className="lg:col-span-2 space-y-4">
              {/* Header */}
              <Card className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                    {getInitials(selectedCandidate.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-foreground">{selectedCandidate.name}</h2>
                      <Badge variant={selectedCandidate.placement_status === "placed" ? "default" : "secondary"} className={`text-[10px] ${selectedCandidate.placement_status === "placed" ? "bg-emerald-500/10 text-emerald-600" : ""}`}>
                        {selectedCandidate.placement_status || "unplaced"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.branch} • {selectedCandidate.department} • {selectedCandidate.school}</p>
                    <div className="flex items-center gap-4 mt-2">
                      {selectedCandidate.registration_number && <span className="text-xs text-muted-foreground">Reg: {selectedCandidate.registration_number}</span>}
                      {selectedCandidate.graduation_year && <span className="text-xs text-muted-foreground">Batch: {selectedCandidate.graduation_year}</span>}
                      {selectedCandidate.linkedin_url && (
                        <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Match Score</p>
                    <p className={`text-3xl font-bold ${getMatchColor(candidateApp.ai_match_score || 0)}`}>
                      {candidateApp.ai_match_score ? `${Math.round(candidateApp.ai_match_score)}%` : "—"}
                    </p>
                  </div>
                </div>

                {/* Status controls */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <span className="text-xs text-muted-foreground">Application Status:</span>
                  <Select value={candidateApp.status || "applied"} onValueChange={v => updateStatus(candidateApp.id, v)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    Applied: {new Date(candidateApp.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </Card>

              {/* Stats + Radar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 space-y-3">
                  <h3 className="text-sm font-bold text-foreground">Academic Profile</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "CGPA", value: selectedCandidate.cgpa?.toFixed(2) || "—", icon: GraduationCap },
                      { label: "Aptitude", value: `${selectedCandidate.aptitude_score || "—"}/100`, icon: Brain },
                      { label: "Programming", value: `${selectedCandidate.programming_score || "—"}/100`, icon: Code },
                      { label: "Backlogs", value: selectedCandidate.backlogs || 0, icon: BookOpen },
                      { label: "10th %", value: selectedCandidate.tenth_percent ? `${selectedCandidate.tenth_percent}%` : "—", icon: GraduationCap },
                      { label: "12th %", value: selectedCandidate.twelfth_percent ? `${selectedCandidate.twelfth_percent}%` : "—", icon: GraduationCap },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center gap-2 rounded-lg border border-border p-2">
                        <stat.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                          <p className="text-sm font-bold text-foreground">{stat.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="text-sm font-bold text-foreground mb-2">Skills Radar</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Skills */}
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-foreground">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.skills?.map(s => {
                    const isRequired = selectedJob?.skills_required?.some(r => r.toLowerCase() === s.toLowerCase());
                    return (
                      <Badge key={s} variant={isRequired ? "default" : "secondary"} className={`text-xs ${isRequired ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : ""}`}>
                        {s} {isRequired && "✓"}
                      </Badge>
                    );
                  })}
                  {(!selectedCandidate.skills || selectedCandidate.skills.length === 0) && (
                    <p className="text-xs text-muted-foreground">No skills listed</p>
                  )}
                </div>
                {selectedJob?.skills_required && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-muted-foreground">
                      Skill Match: {selectedCandidate.skills?.filter(s => selectedJob.skills_required?.some(r => r.toLowerCase() === s.toLowerCase())).length || 0} / {selectedJob.skills_required.length} required skills
                    </p>
                  </div>
                )}
              </Card>

              {/* Resume */}
              <Card className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Resume
                </h3>
                {resumeUrl ? (
                  <div className="space-y-2">
                    <iframe src={resumeUrl} className="w-full h-[400px] rounded-lg border border-border" title="Resume" />
                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> Download</Button>
                    </a>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No resume uploaded by this student</p>
                  </div>
                )}
              </Card>
            </div>

            {/* RIGHT: AI Chat */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 h-[calc(100vh-120px)] flex flex-col">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">AI Advisor</h3>
                  <Badge variant="secondary" className="text-[9px] ml-auto">Ask anything</Badge>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {aiMessages.length === 0 && (
                      <div className="text-center py-8 space-y-3">
                        <Sparkles className="h-8 w-8 mx-auto text-primary/30" />
                        <p className="text-xs text-muted-foreground">Ask AI about this candidate</p>
                        <div className="space-y-1.5">
                          {[
                            "Is this a good hire for this role?",
                            "What are the red flags?",
                            "Is there anyone better?",
                            "Summarize this candidate",
                          ].map(q => (
                            <button key={q} onClick={() => { setAiInput(q); }} className="block w-full text-left text-[11px] text-primary hover:bg-primary/5 rounded-lg px-3 py-1.5 transition-colors">
                              → {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-secondary rounded-xl px-3 py-2">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask about this candidate..."
                      value={aiInput}
                      onChange={e => setAiInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAiMessage()}
                      className="text-xs h-9"
                    />
                    <Button size="sm" className="h-9 px-3" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  // ─── JOB DETAIL VIEW (applicant list) ───
  if (selectedJob) {
    return (
      <DashboardLayout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedJob(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Postings
          </Button>

          {/* Job Header */}
          <Card className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedJob.title}</h2>
                <p className="text-sm text-muted-foreground">{(selectedJob as any).companies?.name} • {selectedJob.package_lpa} LPA • {selectedJob.job_type}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedJob.skills_required?.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{jobApplicants.length}</p>
                <p className="text-[10px] text-muted-foreground">Applicants</p>
              </div>
            </div>

            {/* Stage counts */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              {STAGES.map(s => {
                const cnt = apps.filter(a => a.job_posting_id === selectedJob.id && (a.status || "applied") === s.key).length;
                return (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                    <span className="text-xs font-medium text-foreground">{cnt}</span>
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search applicants..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="match-desc">Match ↓</SelectItem>
                <SelectItem value="cgpa-desc">CGPA ↓</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Min CGPA: {minCgpa[0]}</label>
                  <Slider value={minCgpa} onValueChange={setMinCgpa} min={0} max={10} step={0.5} className="mt-2 max-w-xs" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Applicant Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Candidate</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Branch</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">CGPA</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Match</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Skills</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Aptitude</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Coding</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Referred By</th>
                    <th className="text-left py-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobApplicants.map(app => {
                    const p = app.profile!;
                    return (
                      <tr key={app.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => openCandidate(app as any)}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {getInitials(p.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground">{new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground hidden sm:table-cell">{p.branch || "—"}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold ${(p.cgpa || 0) >= 8 ? "text-emerald-500" : (p.cgpa || 0) >= 6 ? "text-amber-500" : "text-destructive"}`}>
                            {p.cgpa?.toFixed(1) || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          {app.ai_match_score ? (
                            <span className={`text-xs font-bold ${getMatchColor(app.ai_match_score)}`}>{Math.round(app.ai_match_score)}%</span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-0.5">
                            {p.skills?.slice(0, 3).map(s => (
                              <Badge key={s} variant="secondary" className="text-[8px] px-1 py-0">{s}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs hidden lg:table-cell">{p.aptitude_score || "—"}</td>
                        <td className="py-3 px-3 text-xs hidden lg:table-cell">{p.programming_score || "—"}</td>
                        <td className="py-3 px-3 hidden md:table-cell">
                          {(() => {
                            const ref = referrals.find(r => r.student_id === app.student_id && r.job_posting_id === app.job_posting_id);
                            if (!ref) return <span className="text-[10px] text-muted-foreground">—</span>;
                            const fac = referralFaculty[ref.faculty_id];
                            return (
                              <Badge variant="secondary" className="text-[9px] bg-primary/10 text-primary">
                                {fac?.name || "Faculty"} ({fac?.faculty_uid || ""})
                              </Badge>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="secondary" className={`text-[9px] ${
                            (app.status === "hired") ? "bg-emerald-500/10 text-emerald-500" :
                            (app.status === "rejected") ? "bg-destructive/10 text-destructive" :
                            (app.status === "interviewing") ? "bg-amber-500/10 text-amber-500" :
                            (app.status === "shortlisted") ? "bg-blue-500/10 text-blue-500" : ""
                          }`}>
                            {app.status || "applied"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openCandidate(app as any)}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {jobApplicants.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No applicants match your filters</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </DashboardLayout>
    );
  }

  // ─── MY JOB POSTINGS VIEW ───
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">My Job Postings</h2>
          <p className="text-sm text-muted-foreground">{jobs.length} postings • Click any job to view applicants</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobsWithCounts.map((job, i) => {
            const dl = daysLeft(job.deadline);
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" onClick={() => setSelectedJob(job)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{job.title}</p>
                        <p className="text-[11px] text-muted-foreground">{(job as any).companies?.name}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    {job.package_lpa && <Badge variant="secondary" className="text-[10px]">{job.package_lpa} LPA</Badge>}
                    <Badge variant="secondary" className="text-[10px]">{job.job_type}</Badge>
                    <Badge variant={job.status === "open" ? "default" : "secondary"} className={`text-[10px] ${job.status === "open" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
                      {job.status}
                    </Badge>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold text-foreground">{job.appCount}</span>
                        <span className="text-[10px] text-muted-foreground">applicants</span>
                      </div>
                      {job.hiredCount > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-500">{job.hiredCount}</span>
                          <span className="text-[10px] text-muted-foreground">hired</span>
                        </div>
                      )}
                    </div>
                    {dl !== null && (
                      <span className={`text-[10px] font-medium ${dl < 3 ? "text-destructive" : dl < 7 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {dl <= 0 ? "Expired" : `${dl}d left`}
                      </span>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No job postings yet</p>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default RecruiterApplications;
