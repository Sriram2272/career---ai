import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from "recharts";
import {
  Search, SlidersHorizontal, Users, Loader2, FileText,
  Sparkles, GraduationCap, Code, Brain, BookOpen, ChevronRight,
  ExternalLink, Download, GitCompare, X, CheckCircle2, XCircle,
  Send, School, Layers, LayoutGrid, ArrowLeft,
  ZoomIn, ZoomOut, Maximize2, RotateCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string; name: string; branch: string | null; cgpa: number | null;
  skills: string[] | null; aptitude_score: number | null; programming_score: number | null;
  backlogs: number | null; placement_status: string | null; department: string | null;
  avatar_url: string | null; school: string | null; resume_url: string | null;
  tenth_percent: number | null; twelfth_percent: number | null;
  linkedin_url: string | null; preferred_roles: string[] | null;
  graduation_year: number | null; registration_number: string | null;
  programme: string | null; section: string | null;
}

interface StudentSkill {
  id: string; skill_name: string; proficiency: string | null; verified: boolean | null; source: string | null;
}

const RADAR_COLORS = ["hsl(var(--primary))", "hsl(24, 95%, 53%)", "hsl(142, 71%, 45%)"];

// Hierarchy levels
type ViewLevel = "schools" | "programmes" | "sections" | "students";

const RecruiterCandidates = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [allRequiredSkills, setAllRequiredSkills] = useState<string[]>([]);

  // Hierarchy navigation
  const [viewLevel, setViewLevel] = useState<ViewLevel>("schools");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedProgramme, setSelectedProgramme] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Student search within section
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("cgpa-desc");

  // Profile deep-dive
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profileSkills, setProfileSkills] = useState<StudentSkill[]>([]);
  const [profileApps, setProfileApps] = useState<any[]>([]);
  const [aiFit, setAiFit] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  // PDF viewer
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfRotation, setPdfRotation] = useState(0);
  const [showFullPdf, setShowFullPdf] = useState(false);

  // Comparison
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<Profile[]>([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  // Notification
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyType, setNotifyType] = useState<"offer" | "rejection">("offer");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifySending, setNotifySending] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [profilesRes, jobsRes] = await Promise.all([
        supabase.from("profiles")
          .select("id, name, branch, cgpa, skills, aptitude_score, programming_score, backlogs, placement_status, department, avatar_url, school, resume_url, tenth_percent, twelfth_percent, linkedin_url, preferred_roles, graduation_year, registration_number, programme, section")
          .not("school", "is", null)
          .limit(500),
        supabase.from("job_postings").select("skills_required").eq("status", "open"),
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data as any);
      if (jobsRes.data) {
        const skills = new Set<string>();
        jobsRes.data.forEach((j: any) => (j.skills_required || []).forEach((s: string) => skills.add(s.toLowerCase())));
        setAllRequiredSkills([...skills]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // ─── COMPUTED DATA ───
  const totalStats = useMemo(() => ({
    students: profiles.length,
    batches: new Set(profiles.map(p => p.graduation_year).filter(Boolean)).size,
    programmes: new Set(profiles.map(p => p.programme).filter(Boolean)).size,
    sections: new Set(profiles.map(p => p.section).filter(Boolean)).size,
  }), [profiles]);

  const schools = useMemo(() => {
    const map = new Map<string, { count: number; programmes: Set<string>; sections: Set<string> }>();
    profiles.forEach(p => {
      if (!p.school) return;
      if (!map.has(p.school)) map.set(p.school, { count: 0, programmes: new Set(), sections: new Set() });
      const entry = map.get(p.school)!;
      entry.count++;
      if (p.programme) entry.programmes.add(p.programme);
      if (p.section) entry.sections.add(p.section);
    });
    return [...map.entries()].map(([name, data]) => ({ name, ...data, programmes: [...data.programmes], sections: [...data.sections] }));
  }, [profiles]);

  const programmesInSchool = useMemo(() => {
    if (!selectedSchool) return [];
    const map = new Map<string, { count: number; branches: Set<string>; sections: Set<string> }>();
    profiles.filter(p => p.school === selectedSchool).forEach(p => {
      const prog = p.programme || "Unknown";
      if (!map.has(prog)) map.set(prog, { count: 0, branches: new Set(), sections: new Set() });
      const entry = map.get(prog)!;
      entry.count++;
      if (p.branch) entry.branches.add(p.branch);
      if (p.section) entry.sections.add(p.section);
    });
    return [...map.entries()].map(([name, data]) => ({ name, ...data, branches: [...data.branches], sections: [...data.sections] }));
  }, [profiles, selectedSchool]);

  const sectionsInProgramme = useMemo(() => {
    if (!selectedSchool || !selectedProgramme) return [];
    const map = new Map<string, { count: number; branch: string | null; avgCgpa: number; totalCgpa: number }>();
    profiles.filter(p => p.school === selectedSchool && p.programme === selectedProgramme).forEach(p => {
      const sec = p.section || "Unknown";
      if (!map.has(sec)) map.set(sec, { count: 0, branch: p.branch, avgCgpa: 0, totalCgpa: 0 });
      const entry = map.get(sec)!;
      entry.count++;
      entry.totalCgpa += p.cgpa || 0;
      entry.avgCgpa = entry.totalCgpa / entry.count;
    });
    return [...map.entries()].map(([name, data]) => ({ name, ...data }));
  }, [profiles, selectedSchool, selectedProgramme]);

  const studentsInSection = useMemo(() => {
    let list = profiles.filter(p =>
      p.school === selectedSchool && p.programme === selectedProgramme && p.section === selectedSection
    );
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q) || p.skills?.some(s => s.toLowerCase().includes(q)));
    }
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
  }, [profiles, selectedSchool, selectedProgramme, selectedSection, searchQuery, sortBy]);

  const isSkillMatched = (skill: string) => allRequiredSkills.includes(skill.toLowerCase());
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const getRadarData = (p: Profile) => [
    { subject: "CGPA", value: ((p.cgpa || 0) / 10) * 100, fullMark: 100 },
    { subject: "Aptitude", value: p.aptitude_score || 0, fullMark: 100 },
    { subject: "Programming", value: p.programming_score || 0, fullMark: 100 },
    { subject: "10th", value: p.tenth_percent || 0, fullMark: 100 },
    { subject: "12th", value: p.twelfth_percent || 0, fullMark: 100 },
    { subject: "Skills", value: Math.min((p.skills?.length || 0) * 15, 100), fullMark: 100 },
  ];

  // ─── NAVIGATION ───
  const navigateTo = (level: ViewLevel, school?: string, programme?: string, section?: string) => {
    setViewLevel(level);
    if (school !== undefined) setSelectedSchool(school);
    if (programme !== undefined) setSelectedProgramme(programme);
    if (section !== undefined) setSelectedSection(section);
    setSearchQuery("");
    setCompareMode(false);
    setCompareList([]);
  };

  const goBack = () => {
    if (viewLevel === "students") navigateTo("sections", selectedSchool!, selectedProgramme!);
    else if (viewLevel === "sections") navigateTo("programmes", selectedSchool!);
    else if (viewLevel === "programmes") navigateTo("schools");
  };

  const breadcrumb = () => {
    const parts: { label: string; onClick?: () => void }[] = [{ label: "All Schools", onClick: () => navigateTo("schools") }];
    if (selectedSchool && viewLevel !== "schools") {
      parts.push({ label: selectedSchool.replace("School of ", ""), onClick: () => navigateTo("programmes", selectedSchool!) });
    }
    if (selectedProgramme && (viewLevel === "sections" || viewLevel === "students")) {
      parts.push({ label: selectedProgramme, onClick: () => navigateTo("sections", selectedSchool!, selectedProgramme!) });
    }
    if (selectedSection && viewLevel === "students") {
      parts.push({ label: selectedSection });
    }
    return parts;
  };

  // ─── PROFILE OPEN ───
  const openProfile = async (profile: Profile) => {
    setSelectedProfile(profile);
    setDetailLoading(true);
    setAiFit("");
    setResumeUrl(null);
    setPdfZoom(100);
    setPdfRotation(0);

    const [skillsRes, appsRes] = await Promise.all([
      supabase.from("student_skills").select("*").eq("student_id", profile.id),
      supabase.from("applications").select("*, job_postings(title, companies(name))").eq("student_id", profile.id),
    ]);
    setProfileSkills(skillsRes.data || []);
    setProfileApps(appsRes.data || []);

    if (profile.resume_url) {
      const { data: signedData } = await supabase.storage.from("resumes").createSignedUrl(profile.resume_url, 3600);
      if (signedData) setResumeUrl(signedData.signedUrl);
    }
    setDetailLoading(false);
  };

  const runAiFit = async () => {
    if (!selectedProfile) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommend", {
        body: {
          message: `Provide a concise AI fit assessment for this candidate for a recruiter.\n\nStudent: ${selectedProfile.name}\nBranch: ${selectedProfile.branch || "N/A"}\nCGPA: ${selectedProfile.cgpa || "N/A"}\nSkills: ${selectedProfile.skills?.join(", ") || "None"}\nAptitude: ${selectedProfile.aptitude_score || "N/A"}/100\nProgramming: ${selectedProfile.programming_score || "N/A"}/100\nBacklogs: ${selectedProfile.backlogs || 0}\n10th: ${selectedProfile.tenth_percent || "N/A"}%\n12th: ${selectedProfile.twelfth_percent || "N/A"}%\nPlacement: ${selectedProfile.placement_status || "unplaced"}\nPreferred Roles: ${selectedProfile.preferred_roles?.join(", ") || "Not specified"}\n\nGive: Overall Rating (A/B/C/D), Key Strengths, Concerns, Recommended Roles, one-line recommendation. Under 200 words.`
        }
      });
      if (error) throw error;
      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) { text += content; setAiFit(text); }
            } catch {}
          }
        }
      } else if (typeof data === "string") setAiFit(data);
    } catch (e: any) {
      toast({ title: "AI Assessment Failed", description: e.message, variant: "destructive" });
    } finally { setAiLoading(false); }
  };

  const toggleCompare = (p: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompareList(prev => {
      if (prev.find(c => c.id === p.id)) return prev.filter(c => c.id !== p.id);
      if (prev.length >= 3) { toast({ title: "Max 3", variant: "destructive" }); return prev; }
      return [...prev, p];
    });
  };

  const sendNotification = async () => {
    if (!selectedProfile || !user) return;
    setNotifySending(true);
    try {
      const title = notifyType === "offer"
        ? `🎉 Offer Letter — Congratulations ${selectedProfile.name}!`
        : `Application Update — ${selectedProfile.name}`;
      const message = notifyMessage || (notifyType === "offer"
        ? "Congratulations! We are pleased to offer you a position. Check your dashboard for details."
        : "Thank you for your interest. After careful review, we will not be moving forward with your application.");
      const { error } = await supabase.from("notifications").insert({
        title, message, recipient_id: selectedProfile.id, sender_id: user.id,
        type: notifyType === "offer" ? "approved" as const : "rejected" as const,
        priority: notifyType === "offer" ? "urgent" as const : "normal" as const,
      });
      if (error) throw error;
      toast({ title: notifyType === "offer" ? "Offer sent!" : "Rejection sent", description: `Notification delivered to ${selectedProfile.name}` });
      setShowNotifyDialog(false);
      setNotifyMessage("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setNotifySending(false); }
  };

  const radarData = selectedProfile ? getRadarData(selectedProfile) : [];

  // School icon colors
  const schoolColors = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-orange-500 to-red-500", "from-purple-500 to-pink-600", "from-cyan-500 to-blue-600"];

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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* ─── STATS CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Students", value: totalStats.students, icon: Users, color: "text-blue-500 bg-blue-500/10" },
            { label: "Total Batches", value: totalStats.batches, icon: GraduationCap, color: "text-emerald-500 bg-emerald-500/10" },
            { label: "Programmes", value: totalStats.programmes, icon: Layers, color: "text-orange-500 bg-orange-500/10" },
            { label: "Total Sections", value: totalStats.sections, icon: LayoutGrid, color: "text-purple-500 bg-purple-500/10" },
          ].map(stat => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ─── BREADCRUMB + NAVIGATION ─── */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewLevel !== "schools" && (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1 h-7 text-xs">
              <ArrowLeft className="h-3 w-3" /> Back
            </Button>
          )}
          {breadcrumb().map((part, i) => (
            <span key={i} className="flex items-center gap-1 text-xs">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              {part.onClick ? (
                <button onClick={part.onClick} className="text-primary hover:underline font-medium">{part.label}</button>
              ) : (
                <span className="text-foreground font-semibold">{part.label}</span>
              )}
            </span>
          ))}
        </div>

        {/* ─── LEVEL: SCHOOLS ─── */}
        {viewLevel === "schools" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {schools.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="p-5 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                  onClick={() => navigateTo("programmes", s.name)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${schoolColors[i % schoolColors.length]} text-white shadow-lg`}>
                      <School className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">{s.name}</h3>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{s.count}</p>
                          <p className="text-[10px] text-muted-foreground">Students</p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{s.programmes.length}</p>
                          <p className="text-[10px] text-muted-foreground">Programmes</p>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground">{s.sections.length}</p>
                          <p className="text-[10px] text-muted-foreground">Sections</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* ─── LEVEL: PROGRAMMES ─── */}
        {viewLevel === "programmes" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {programmesInSchool.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                  onClick={() => navigateTo("sections", selectedSchool!, p.name)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{p.count} Students</Badge>
                    <Badge variant="outline" className="text-xs">{p.sections.length} Sections</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.branches.map(b => (
                      <Badge key={b} variant="secondary" className="text-[9px] bg-primary/5 text-primary">{b}</Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
            {programmesInSchool.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">No programmes found</p>
            )}
          </div>
        )}

        {/* ─── LEVEL: SECTIONS ─── */}
        {viewLevel === "sections" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sectionsInProgramme.map((s, i) => (
              <motion.div key={s.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card
                  className="p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                  onClick={() => navigateTo("students", selectedSchool!, selectedProgramme!, s.name)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <LayoutGrid className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{s.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{s.branch}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{s.count} Students</Badge>
                    <Badge variant="outline" className="text-xs">Avg CGPA: {s.avgCgpa.toFixed(1)}</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
            {sectionsInProgramme.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">No sections found</p>
            )}
          </div>
        )}

        {/* ─── LEVEL: STUDENTS ─── */}
        {viewLevel === "students" && (
          <>
            {/* Search + Compare + Sort */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name or skill..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
              </div>
              <Button
                variant={compareMode ? "default" : "outline"} size="sm"
                onClick={() => { setCompareMode(!compareMode); if (compareMode) setCompareList([]); }}
                className="gap-1"
              >
                <GitCompare className="h-4 w-4" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cgpa-desc">CGPA ↓</SelectItem>
                  <SelectItem value="cgpa-asc">CGPA ↑</SelectItem>
                  <SelectItem value="aptitude-desc">Aptitude ↓</SelectItem>
                  <SelectItem value="programming-desc">Programming ↓</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{studentsInSection.length} students</span>
            </div>

            {/* Compare bar */}
            <AnimatePresence>
              {compareMode && compareList.length > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-xs font-semibold text-primary">Comparing {compareList.length}/3:</span>
                    <div className="flex items-center gap-2 flex-1">
                      {compareList.map(c => (
                        <Badge key={c.id} className="gap-1 bg-primary/10 text-primary border-primary/20 pr-1">
                          {c.name}
                          <button onClick={(e) => toggleCompare(c, e)} className="ml-1 hover:bg-primary/20 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" disabled={compareList.length < 2} onClick={() => setShowCompareDialog(true)}>Compare Now</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Student cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {studentsInSection.map((p, i) => {
                const isSelected = compareList.some(c => c.id === p.id);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                    <Card
                      className={`p-4 cursor-pointer hover:shadow-md transition-all group ${isSelected ? "border-primary ring-1 ring-primary/20" : "hover:border-primary/30"}`}
                      onClick={() => compareMode ? toggleCompare(p, { stopPropagation: () => {} } as any) : openProfile(p)}
                    >
                      <div className="flex items-start gap-3">
                        {compareMode && (
                          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 mt-0.5 transition-colors ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          </div>
                        )}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {getInitials(p.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>
                          <p className="text-[11px] text-muted-foreground">{p.branch || "—"} • {p.section || "—"}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              <span className={`text-xs font-bold ${(p.cgpa || 0) >= 8 ? "text-emerald-500" : (p.cgpa || 0) >= 6 ? "text-amber-500" : "text-destructive"}`}>
                                {p.cgpa?.toFixed(1) || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Brain className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-foreground">{p.aptitude_score || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Code className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-foreground">{p.programming_score || "—"}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.skills?.slice(0, 4).map(s => (
                              <Badge key={s} variant="secondary"
                                className={`text-[9px] px-1.5 py-0 ${isSkillMatched(s) ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" : ""}`}
                              >
                                {s}{isSkillMatched(s) && " ✓"}
                              </Badge>
                            ))}
                            {(p.skills?.length || 0) > 4 && <span className="text-[9px] text-muted-foreground">+{(p.skills?.length || 0) - 4}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                        <Badge variant={p.placement_status === "placed" ? "default" : "secondary"} className={`text-[9px] ${p.placement_status === "placed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
                          {p.placement_status || "unplaced"}
                        </Badge>
                        {p.resume_url && <Badge variant="outline" className="text-[9px] gap-1"><FileText className="h-2.5 w-2.5" /> Resume</Badge>}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            {studentsInSection.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No students in this section</p>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* ─── PROFILE DEEP-DIVE DIALOG ─── */}
      <Dialog open={!!selectedProfile} onOpenChange={(o) => { if (!o) { setSelectedProfile(null); setShowFullPdf(false); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          {selectedProfile && (
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                    {getInitials(selectedProfile.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-foreground">{selectedProfile.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedProfile.branch} • {selectedProfile.department} • {selectedProfile.section}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {selectedProfile.registration_number && <span className="text-xs text-muted-foreground">Reg: {selectedProfile.registration_number}</span>}
                      {selectedProfile.graduation_year && <span className="text-xs text-muted-foreground">Batch: {selectedProfile.graduation_year}</span>}
                      <Badge variant={selectedProfile.placement_status === "placed" ? "default" : "secondary"} className={`text-[10px] ${selectedProfile.placement_status === "placed" ? "bg-emerald-500/10 text-emerald-600" : ""}`}>
                        {selectedProfile.placement_status || "unplaced"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedProfile.linkedin_url && (
                        <a href={selectedProfile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                        onClick={() => { setNotifyType("offer"); setNotifyMessage(""); setShowNotifyDialog(true); }}>
                        <CheckCircle2 className="h-3 w-3" /> Send Offer
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => { setNotifyType("rejection"); setNotifyMessage(""); setShowNotifyDialog(true); }}>
                        <XCircle className="h-3 w-3" /> Send Rejection
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Academic Stats + Radar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground">Academic Profile</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "CGPA", value: selectedProfile.cgpa?.toFixed(2) || "—", icon: GraduationCap },
                        { label: "Aptitude", value: `${selectedProfile.aptitude_score || "—"}/100`, icon: Brain },
                        { label: "Programming", value: `${selectedProfile.programming_score || "—"}/100`, icon: Code },
                        { label: "Backlogs", value: selectedProfile.backlogs || 0, icon: BookOpen },
                        { label: "10th %", value: selectedProfile.tenth_percent ? `${selectedProfile.tenth_percent}%` : "—", icon: GraduationCap },
                        { label: "12th %", value: selectedProfile.twelfth_percent ? `${selectedProfile.twelfth_percent}%` : "—", icon: GraduationCap },
                      ].map(stat => (
                        <div key={stat.label} className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                          <stat.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                            <p className="text-sm font-bold text-foreground">{stat.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-2">Skills Radar</h3>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">
                    Skills & Proficiency
                    {allRequiredSkills.length > 0 && <span className="text-[10px] font-normal text-muted-foreground ml-2">Green = matches job requirements</span>}
                  </h3>
                  {detailLoading ? (
                    <div className="h-16 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(profileSkills.length > 0 ? profileSkills : (selectedProfile.skills || []).map((s, i) => ({ id: String(i), skill_name: s, proficiency: null, verified: false, source: "profile" }))).map((sk: any) => {
                        const matched = isSkillMatched(sk.skill_name);
                        return (
                          <Badge key={sk.id || sk.skill_name} variant="secondary"
                            className={`text-xs gap-1 px-2 py-1 ${matched ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" : ""}`}>
                            {matched && <CheckCircle2 className="h-3 w-3" />}
                            {sk.skill_name}
                            {sk.proficiency && <span className="text-[9px] text-muted-foreground">({sk.proficiency})</span>}
                            {sk.verified && <span className="text-[9px] text-emerald-500">✓</span>}
                          </Badge>
                        );
                      })}
                      {profileSkills.length === 0 && (!selectedProfile.skills || selectedProfile.skills.length === 0) && (
                        <p className="text-xs text-muted-foreground">No skills listed</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Resume with full controls */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Resume
                  </h3>
                  {detailLoading ? (
                    <div className="h-12 flex items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : resumeUrl ? (
                    <div className="space-y-2">
                      {/* PDF Controls Bar */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPdfZoom(z => Math.max(50, z - 25))}>
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-mono text-muted-foreground min-w-[40px] text-center">{pdfZoom}%</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPdfZoom(z => Math.min(200, z + 25))}>
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-5" />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPdfRotation(r => (r + 90) % 360)}>
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setPdfZoom(100); setShowFullPdf(true); }}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-5" />
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setPdfZoom(100)}>
                          Reset
                        </Button>
                        <div className="flex-1" />
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Download className="h-3 w-3" /> Download
                          </Button>
                        </a>
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <ExternalLink className="h-3 w-3" /> Open in Tab
                          </Button>
                        </a>
                      </div>
                      {/* PDF Viewer */}
                      <div className="rounded-lg border border-border overflow-auto bg-muted/30" style={{ maxHeight: "500px" }}>
                        <div style={{ transform: `scale(${pdfZoom / 100}) rotate(${pdfRotation}deg)`, transformOrigin: "top left", transition: "transform 0.2s ease" }}>
                          <iframe
                            src={`${resumeUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                            className="w-full border-0"
                            style={{ height: `${Math.max(500, 500 * (pdfZoom / 100))}px`, minWidth: "100%" }}
                            title="Resume"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">No resume uploaded</p>
                    </div>
                  )}
                </div>

                {/* Application History */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground">Application History</h3>
                  {detailLoading ? (
                    <div className="h-12 flex items-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  ) : profileApps.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No applications yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {profileApps.map((app: any) => (
                        <div key={app.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{app.job_postings?.title || "Position"}</p>
                            <p className="text-[10px] text-muted-foreground">{app.job_postings?.companies?.name || "Company"} • {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <Badge variant="secondary" className={`text-[10px] ${app.status === "hired" ? "bg-emerald-500/10 text-emerald-500" : app.status === "rejected" ? "bg-destructive/10 text-destructive" : ""}`}>
                            {app.status || "applied"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* AI Fit Assessment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> AI Fit Assessment
                    </h3>
                    <Button size="sm" onClick={runAiFit} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      {aiFit ? "Re-assess" : "Generate Assessment"}
                    </Button>
                  </div>
                  {aiFit ? (
                    <div className="rounded-lg bg-secondary/30 border border-border p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{aiFit}</div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Click "Generate Assessment" for an AI-powered hiring recommendation.</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── FULLSCREEN PDF DIALOG ─── */}
      <Dialog open={showFullPdf} onOpenChange={setShowFullPdf}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <div className="p-2 flex items-center gap-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground ml-2">{selectedProfile?.name} — Resume</span>
            <div className="flex-1" />
            {resumeUrl && (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Download className="h-3 w-3" /> Download</Button>
              </a>
            )}
          </div>
          {resumeUrl && (
            <iframe src={`${resumeUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`} className="w-full border-0" style={{ height: "calc(95vh - 50px)" }} title="Resume Fullscreen" />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── OFFER / REJECTION DIALOG ─── */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notifyType === "offer" ? <><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Send Offer Letter</> : <><XCircle className="h-5 w-5 text-destructive" /> Send Rejection Notice</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">To: <span className="font-semibold text-foreground">{selectedProfile?.name}</span></p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Message (optional)</label>
              <Textarea
                placeholder={notifyType === "offer" ? "Congratulations! We are pleased to offer you..." : "Thank you for your interest. After careful review..."}
                value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} rows={5}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>Cancel</Button>
              <Button onClick={sendNotification} disabled={notifySending}
                className={notifyType === "offer" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}>
                {notifySending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Send {notifyType === "offer" ? "Offer" : "Rejection"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── COMPARISON DIALOG ─── */}
      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6 space-y-5">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5 text-primary" /> Candidate Comparison
                </DialogTitle>
              </DialogHeader>
              <div className={`grid gap-4 ${compareList.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {compareList.map((c, idx) => (
                  <div key={c.id} className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">{getInitials(c.name)}</div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.branch}</p>
                      </div>
                    </div>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={getRadarData(c)} cx="50%" cy="50%" outerRadius="70%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name={c.name} dataKey="value" stroke={RADAR_COLORS[idx]} fill={RADAR_COLORS[idx]} fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-semibold">Metric</th>
                      {compareList.map((c, idx) => (
                        <th key={c.id} className="text-center py-2 font-semibold" style={{ color: RADAR_COLORS[idx] }}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "CGPA", get: (p: Profile) => p.cgpa?.toFixed(2) || "—", best: (v: number[]) => Math.max(...v) },
                      { label: "Aptitude", get: (p: Profile) => `${p.aptitude_score || "—"}`, best: (v: number[]) => Math.max(...v) },
                      { label: "Programming", get: (p: Profile) => `${p.programming_score || "—"}`, best: (v: number[]) => Math.max(...v) },
                      { label: "10th %", get: (p: Profile) => p.tenth_percent ? `${p.tenth_percent}%` : "—", best: (v: number[]) => Math.max(...v) },
                      { label: "12th %", get: (p: Profile) => p.twelfth_percent ? `${p.twelfth_percent}%` : "—", best: (v: number[]) => Math.max(...v) },
                      { label: "Backlogs", get: (p: Profile) => `${p.backlogs || 0}`, best: (v: number[]) => Math.min(...v) },
                      { label: "Skills", get: (p: Profile) => `${p.skills?.length || 0}`, best: (v: number[]) => Math.max(...v) },
                      { label: "Matched Skills", get: (p: Profile) => `${p.skills?.filter(s => isSkillMatched(s)).length || 0}`, best: (v: number[]) => Math.max(...v) },
                      { label: "Status", get: (p: Profile) => p.placement_status || "unplaced", best: () => -1 },
                    ].map(row => {
                      const nums = compareList.map(c => parseFloat(row.get(c).replace("%", "")) || 0);
                      const best = row.best(nums);
                      return (
                        <tr key={row.label} className="border-b border-border/50">
                          <td className="py-2 text-muted-foreground font-medium">{row.label}</td>
                          {compareList.map((c, idx) => {
                            const val = row.get(c);
                            const num = parseFloat(val.replace("%", "")) || 0;
                            const isBest = row.label !== "Status" && num === best && compareList.length > 1;
                            return (
                              <td key={c.id} className={`text-center py-2 font-semibold ${isBest ? "text-emerald-500" : "text-foreground"}`}>
                                {val}{isBest && " ★"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground">Skills Comparison</h3>
                <div className={`grid gap-4 ${compareList.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {compareList.map(c => (
                    <div key={c.id} className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">{c.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.skills?.map(s => (
                          <Badge key={s} variant="secondary"
                            className={`text-[9px] px-1.5 py-0 ${isSkillMatched(s) ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : ""}`}>
                            {s}{isSkillMatched(s) && " ✓"}
                          </Badge>
                        )) || <span className="text-[10px] text-muted-foreground">No skills</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RecruiterCandidates;
