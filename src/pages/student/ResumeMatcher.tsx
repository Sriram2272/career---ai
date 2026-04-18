import { useState, useRef, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Upload, FileText, User, CheckCircle, Building2, MapPin,
  IndianRupee, Sparkles, Target, Zap, Search, Briefcase,
  Filter, AlertTriangle, TrendingUp, Eye, ShieldCheck,
  Brain, BarChart3, ArrowRight, Loader2, XCircle, Star,
  FileSearch, ClipboardPaste
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ResumeAnalysisReport from "@/components/resume/ResumeAnalysisReport";
import JDMatchReport from "@/components/resume/JDMatchReport";
import TopMatchedRoles from "@/components/resume/TopMatchedRoles";

const ResumeMatcher = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [activeTab, setActiveTab] = useState("analyze");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [jdMatchResult, setJdMatchResult] = useState<any>(null);
  const [extractedResumeText, setExtractedResumeText] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-profile-matcher", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: jobs } = useQuery({
    queryKey: ["matcher-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("job_postings")
        .select("id, title, description, skills_required, min_cgpa, eligible_branches, job_type, package_lpa, deadline, status, companies(name, logo_url, locations, industry)")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
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

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return file.text();
    }
    
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        pages.push(pageText);
      }
      return pages.join("\n\n");
    }
    
    // DOCX fallback - read as text
    const text = await file.text();
    return text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n");
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5MB allowed.", variant: "destructive" });
      return;
    }
    setResumeFile(file);
    try {
      const text = await extractTextFromFile(file);
      setExtractedResumeText(text);
      toast({ title: "Resume loaded!", description: "Ready for AI analysis." });
    } catch {
      toast({ title: "Error reading file", description: "Please try pasting your resume text instead.", variant: "destructive" });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".docx") || file.name.endsWith(".txt"))) {
      handleFileUpload(file);
    } else {
      toast({ title: "Invalid file", description: "Please upload PDF, DOCX, or TXT.", variant: "destructive" });
    }
  };

  const getResumeContent = () => {
    if (resumeText.trim()) return resumeText.trim();
    if (extractedResumeText.trim()) return extractedResumeText.trim();
    // Fallback: build from profile
    if (profile) {
      const skills = ((profile.skills as string[] | null) || []).join(", ");
      const roles = ((profile.preferred_roles as string[] | null) || []).join(", ");
      return `Name: ${profile.name}\nBranch: ${profile.branch || "N/A"}\nProgramme: ${profile.programme || "N/A"}\nCGPA: ${profile.cgpa || "N/A"}\nSkills: ${skills || "None listed"}\nPreferred Roles: ${roles || "None listed"}\nPlacement Status: ${profile.placement_status || "unplaced"}\nGraduation Year: ${profile.graduation_year || "N/A"}`;
    }
    return "";
  };

  const runAnalysis = async () => {
    const content = getResumeContent();
    if (!content) {
      toast({ title: "No resume data", description: "Upload a resume, paste text, or complete your profile.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("resume-analyzer", {
        body: { resumeText: content, mode: "analyze" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysisResult(data);
      toast({ title: "Analysis complete!", description: `Overall Score: ${data.overall_score}/100` });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const runJDMatch = async () => {
    const content = getResumeContent();
    if (!content) {
      toast({ title: "No resume data", description: "Upload a resume or paste text first.", variant: "destructive" });
      return;
    }
    if (!jobDescription.trim()) {
      toast({ title: "No job description", description: "Paste the job description to match against.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setJdMatchResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("resume-analyzer", {
        body: { resumeText: content, jobDescription: jobDescription.trim(), mode: "jd-match" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setJdMatchResult(data);
      toast({ title: "JD Match complete!", description: `Match Score: ${data.match_score}%` });
    } catch (err: any) {
      toast({ title: "Match failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* HERO */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Resume Intelligence</h1>
            <p className="text-xs text-muted-foreground">AI-powered resume analysis, HR feedback & JD matching</p>
          </div>
        </div>

        {/* UPLOAD + PASTE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left - Upload / Paste */}
          <Card className="lg:col-span-3 border-border/60 shadow-sm">
            <CardContent className="p-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="analyze" className="gap-1.5 text-xs">
                    <FileSearch className="h-3.5 w-3.5" /> Resume Analysis
                  </TabsTrigger>
                  <TabsTrigger value="jd-match" className="gap-1.5 text-xs">
                    <ClipboardPaste className="h-3.5 w-3.5" /> JD Match
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analyze" className="space-y-4 mt-0">
                  {/* File upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    {resumeFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{resumeFile.name}</span>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-foreground">Drop resume here or click to upload</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT (Max 5MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  <div className="relative">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Or paste your resume text</p>
                    <Textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your full resume content here... Include education, experience, projects, skills, certifications etc."
                      className="min-h-[120px] text-xs rounded-xl resize-none"
                    />
                  </div>

                  <Button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="w-full gradient-primary text-primary-foreground rounded-xl gap-2"
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {analyzing ? "Analyzing Resume..." : "Analyze with AI"}
                  </Button>
                </TabsContent>

                <TabsContent value="jd-match" className="space-y-4 mt-0">
                  {/* Resume input summary */}
                  <div className="bg-secondary/50 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">
                          {resumeFile ? resumeFile.name : resumeText ? "Pasted resume" : extractedResumeText ? "Profile data" : "No resume loaded"}
                        </span>
                      </div>
                      {(resumeFile || resumeText || extractedResumeText) && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    {!resumeFile && !resumeText && (
                      <p className="text-[10px] text-muted-foreground mt-1">Upload a resume in the Analysis tab first, or your profile data will be used.</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">Paste the Job Description</p>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here... Include role title, requirements, responsibilities, qualifications etc."
                      className="min-h-[160px] text-xs rounded-xl resize-none"
                    />
                  </div>

                  <Button
                    onClick={runJDMatch}
                    disabled={analyzing}
                    className="w-full gradient-primary text-primary-foreground rounded-xl gap-2"
                  >
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                    {analyzing ? "Matching..." : "Match Resume vs JD"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right - Profile Card */}
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardContent className="p-5 flex flex-col items-center text-center h-full">
              <div className="flex items-center gap-2 self-stretch justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground">Your Profile</span>
                {profile?.skills && (profile.skills as string[]).length > 0 && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                    <CheckCircle className="h-3 w-3 mr-1" /> Profile Ready
                  </Badge>
                )}
              </div>

              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2 ring-2 ring-primary/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-primary" />
                )}
              </div>
              <p className="font-bold text-foreground">{profile?.name || "Student"}</p>
              <p className="text-xs text-primary font-semibold">{profile?.branch || "Branch"} {profile?.programme ? `• ${profile.programme}` : ""}</p>

              <div className="mt-3 w-full">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5">Skills</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {((profile?.skills as string[] | null) || []).slice(0, 8).map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                  {((profile?.skills as string[] | null) || []).length > 8 && (
                    <Badge variant="outline" className="text-[10px]">+{((profile?.skills as string[] | null) || []).length - 8}</Badge>
                  )}
                  {((profile?.skills as string[] | null) || []).length === 0 && (
                    <p className="text-[10px] text-muted-foreground">No skills in profile yet</p>
                  )}
                </div>
              </div>

              <div className="flex gap-6 mt-3 w-full justify-center">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">CGPA</p>
                  <p className="text-sm font-bold">{profile?.cgpa ? String(profile.cgpa) : "N/A"}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
                  <p className="text-sm font-bold capitalize">{profile?.placement_status || "Unplaced"}</p>
                </div>
              </div>

              <Button variant="outline" size="sm" className="mt-auto rounded-xl text-xs gap-1.5 w-full"
                onClick={() => navigate("/profile")}>
                <Eye className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ANALYSIS RESULT */}
        <AnimatePresence mode="wait">
          {analysisResult && activeTab === "analyze" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ResumeAnalysisReport data={analysisResult} />
            </motion.div>
          )}

          {jdMatchResult && activeTab === "jd-match" && (
            <motion.div
              key="jd-match"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <JDMatchReport data={jdMatchResult} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP MATCHED ROLES FROM PORTAL */}
        <TopMatchedRoles
          jobs={jobs || []}
          profile={profile}
          appliedIds={appliedIds}
          extractedSkills={analysisResult?.extracted_skills}
        />

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Search className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-base font-bold">{(jobs || []).length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Open Roles</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-bold">{analysisResult?.ats_score || "--"}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">ATS Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-base font-bold">{analysisResult?.overall_score || "--"}/100</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Resume Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">AI Powered</p>
                <p className="text-[10px] text-muted-foreground">HR-grade analysis</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ResumeMatcher;
