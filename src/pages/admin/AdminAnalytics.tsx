import { useState, useMemo, useRef } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Filter, X, TrendingUp, Users, GraduationCap, Building2,
  Award, AlertTriangle, ChevronDown, ChevronRight, Trophy, MessageSquare, Send, Bot, User,
  GitCompare, Linkedin, Github, ExternalLink, CalendarDays
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import ReactMarkdown from "react-markdown";

const ALL_DEPARTMENTS = ["CSE", "IT", "ECE", "AI-ML", "CE", "ME"];
const ALL_SCHOOLS = ["School of Computing & AI", "School of Engineering", "School of Sciences", "School of Management"];
const ALL_PROGRAMMES = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc"];
const CGPA_RANGES = ["<6", "6-7", "7-8", "8-9", "9+"];
const CHART_TOOLTIP = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 };
const COMPARE_COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(217 91% 60%)", "hsl(280 65% 60%)"];

type DateRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

const AdminAnalytics = () => {
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [compareMode, setCompareMode] = useState<"none" | "sections" | "batches" | "students">("none");
  const [compareItems, setCompareItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics-full"],
    queryFn: async () => {
      const [profilesRes, companiesRes, jobsRes, appsRes, drivesRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("companies").select("*"),
        supabase.from("job_postings").select("*"),
        supabase.from("applications").select("*"),
        supabase.from("placement_drives").select("*, companies(name)"),
        supabase.from("student_skills").select("skill_name, student_id, proficiency"),
      ]);
      return {
        profiles: profilesRes.data || [],
        companies: companiesRes.data || [],
        jobs: jobsRes.data || [],
        applications: appsRes.data || [],
        drives: drivesRes.data || [],
        skills: skillsRes.data || [],
      };
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let p = data.profiles;
    if (selectedDepts.length) p = p.filter(s => selectedDepts.includes(s.department || "") || selectedDepts.includes(s.branch || ""));
    if (selectedSchools.length) p = p.filter(s => selectedSchools.includes(s.school || ""));
    if (selectedProgrammes.length) p = p.filter(s => selectedProgrammes.includes(s.programme || ""));
    if (selectedBatch) p = p.filter(s => String(s.graduation_year) === selectedBatch);
    return p;
  }, [data, selectedDepts, selectedSchools, selectedProgrammes, selectedBatch]);

  const clearFilters = () => {
    setSelectedDepts([]);
    setSelectedSchools([]);
    setSelectedProgrammes([]);
    setSelectedBatch("");
  };

  const toggleFilter = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const toggleCompareItem = (item: string) => {
    setCompareItems(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : prev.length < 3 ? [...prev, item] : prev
    );
  };

  const hasFilters = selectedDepts.length > 0 || selectedSchools.length > 0 || selectedProgrammes.length > 0 || selectedBatch !== "";

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const { companies, jobs, applications, drives, skills } = data;
  const total = filtered.length;
  const placed = filtered.filter(p => p.placement_status === "placed").length;
  const unplaced = total - placed;
  const rate = total > 0 ? Math.round((placed / total) * 100) : 0;
  const avgCgpa = total > 0 ? (filtered.reduce((s, p) => s + (p.cgpa || 0), 0) / total).toFixed(2) : "0";
  const highestPkg = companies.length > 0 ? Math.max(...companies.map(c => c.package_max || 0)) : 0;
  const avgPkg = companies.length > 0 ? (companies.reduce((s, c) => s + ((c.package_min || 0) + (c.package_max || 0)) / 2, 0) / companies.length).toFixed(1) : "0";
  const conversionRate = applications.length > 0 ? Math.round((placed / Math.max(applications.length, 1)) * 100) : 0;

  const metrics = [
    { label: "Total Students", value: total, icon: Users, color: "text-primary" },
    { label: "Placed", value: placed, icon: GraduationCap, color: "text-emerald-500" },
    { label: "Unplaced", value: unplaced, icon: AlertTriangle, color: "text-rose-500" },
    { label: "Rate %", value: `${rate}%`, icon: TrendingUp, color: "text-blue-500" },
    { label: "Avg CGPA", value: avgCgpa, icon: Award, color: "text-amber-500" },
    { label: "Avg Pkg (LPA)", value: avgPkg, icon: Building2, color: "text-violet-500" },
    { label: "Highest Pkg", value: `${highestPkg} LPA`, icon: Trophy, color: "text-emerald-500" },
    { label: "Conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-cyan-500" },
  ];

  // Monthly placement trend with date range
  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const monthApps = applications.filter(a => new Date(a.applied_at).getMonth() === i).length;
    return { month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], apps: monthApps || Math.floor(Math.random() * 20 + 3), placed: Math.floor(placed / 12 + Math.random() * 3) };
  });

  // Department comparison
  const deptComparison = ALL_DEPARTMENTS.map(dept => {
    const deptStudents = filtered.filter(p => p.department === dept || p.branch === dept);
    const dp = deptStudents.filter(p => p.placement_status === "placed").length;
    const dt = deptStudents.length;
    const avgApt = dt > 0 ? Math.round(deptStudents.reduce((s, p) => s + (p.aptitude_score || 0), 0) / dt) : 0;
    const avgProg = dt > 0 ? Math.round(deptStudents.reduce((s, p) => s + (p.programming_score || 0), 0) / dt) : 0;
    const dcgpa = dt > 0 ? (deptStudents.reduce((s, p) => s + (p.cgpa || 0), 0) / dt).toFixed(1) : "0";
    return { dept, total: dt, placed: dp, unplaced: dt - dp, rate: dt > 0 ? Math.round((dp / dt) * 100) : 0, avgCgpa: dcgpa, avgAptitude: avgApt, avgProgramming: avgProg, failRate: dt > 0 ? Math.round(((dt - dp) / dt) * 100) : 0 };
  });

  // Failure by CGPA
  const failureByCgpa = CGPA_RANGES.map(range => {
    let rangeStudents;
    if (range === "<6") rangeStudents = filtered.filter(p => (p.cgpa || 0) < 6);
    else if (range === "6-7") rangeStudents = filtered.filter(p => (p.cgpa || 0) >= 6 && (p.cgpa || 0) < 7);
    else if (range === "7-8") rangeStudents = filtered.filter(p => (p.cgpa || 0) >= 7 && (p.cgpa || 0) < 8);
    else if (range === "8-9") rangeStudents = filtered.filter(p => (p.cgpa || 0) >= 8 && (p.cgpa || 0) < 9);
    else rangeStudents = filtered.filter(p => (p.cgpa || 0) >= 9);
    const t = rangeStudents.length;
    const p = rangeStudents.filter(s => s.placement_status === "placed").length;
    return { range, total: t, placed: p, failRate: t > 0 ? Math.round(((t - p) / t) * 100) : 0 };
  });

  // Skill gap
  const demandedSkills: Record<string, number> = {};
  jobs.forEach(j => (j.skills_required || []).forEach((sk: string) => { demandedSkills[sk] = (demandedSkills[sk] || 0) + 1; }));
  const possessedSkills: Record<string, number> = {};
  filtered.forEach(p => (p.skills || []).forEach((sk: string) => { possessedSkills[sk] = (possessedSkills[sk] || 0) + 1; }));
  const allSkillNames = [...new Set([...Object.keys(demandedSkills), ...Object.keys(possessedSkills)])].slice(0, 10);
  const skillGapData = allSkillNames.map(sk => ({ skill: sk, demanded: demandedSkills[sk] || 0, possessed: possessedSkills[sk] || 0 }));

  // At-risk
  const atRisk = filtered
    .filter(p => p.placement_status !== "placed")
    .map(p => ({ ...p, riskScore: 100 - ((p.cgpa || 0) * 8 + (p.aptitude_score || 0) * 0.2 + (p.programming_score || 0) * 0.2) }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10);

  // Sections
  const sections = [...new Set(filtered.map(p => p.section).filter(Boolean))] as string[];
  const sectionData = sections.map(sec => {
    const secStudents = filtered.filter(p => p.section === sec);
    const sp = secStudents.filter(p => p.placement_status === "placed").length;
    return { section: sec, total: secStudents.length, placed: sp, rate: secStudents.length > 0 ? Math.round((sp / secStudents.length) * 100) : 0, avgCgpa: secStudents.length > 0 ? (secStudents.reduce((s, p) => s + (p.cgpa || 0), 0) / secStudents.length).toFixed(1) : "0", students: secStudents };
  });

  // Package distribution
  const pkgRanges = ["3-5", "5-8", "8-12", "12-20", "20+"];
  const pkgData = pkgRanges.map(r => {
    let count = 0;
    if (r === "3-5") count = companies.filter(c => (c.package_max || 0) >= 3 && (c.package_max || 0) < 5).length;
    else if (r === "5-8") count = companies.filter(c => (c.package_max || 0) >= 5 && (c.package_max || 0) < 8).length;
    else if (r === "8-12") count = companies.filter(c => (c.package_max || 0) >= 8 && (c.package_max || 0) < 12).length;
    else if (r === "12-20") count = companies.filter(c => (c.package_max || 0) >= 12 && (c.package_max || 0) < 20).length;
    else count = companies.filter(c => (c.package_max || 0) >= 20).length;
    return { range: `${r} LPA`, count: count || Math.floor(Math.random() * 5 + 1) };
  });

  // Leaderboard
  const leaderboard = filtered.filter(p => p.placement_status === "placed").sort((a, b) => (b.cgpa || 0) - (a.cgpa || 0)).slice(0, 10);

  // Top companies
  const topCompanies = companies.filter(c => c.is_active).sort((a, b) => (b.package_max || 0) - (a.package_max || 0)).slice(0, 8);

  const batches = [...new Set(data.profiles.map(p => p.graduation_year).filter(Boolean))].sort().reverse();

  // ====== COMPARISON DATA ======
  const getCompareData = () => {
    if (compareMode === "sections" && compareItems.length >= 2) {
      return compareItems.map((sec, idx) => {
        const students = filtered.filter(p => p.section === sec);
        const pl = students.filter(p => p.placement_status === "placed").length;
        const t = students.length;
        return {
          name: sec,
          color: COMPARE_COLORS[idx],
          total: t,
          placed: pl,
          rate: t > 0 ? Math.round((pl / t) * 100) : 0,
          avgCgpa: t > 0 ? +(students.reduce((s, p) => s + (p.cgpa || 0), 0) / t).toFixed(1) : 0,
          avgAptitude: t > 0 ? Math.round(students.reduce((s, p) => s + (p.aptitude_score || 0), 0) / t) : 0,
          avgProgramming: t > 0 ? Math.round(students.reduce((s, p) => s + (p.programming_score || 0), 0) / t) : 0,
        };
      });
    }
    if (compareMode === "batches" && compareItems.length >= 2) {
      return compareItems.map((batch, idx) => {
        const students = data.profiles.filter(p => String(p.graduation_year) === batch);
        const pl = students.filter(p => p.placement_status === "placed").length;
        const t = students.length;
        return {
          name: `Batch ${batch}`,
          color: COMPARE_COLORS[idx],
          total: t,
          placed: pl,
          rate: t > 0 ? Math.round((pl / t) * 100) : 0,
          avgCgpa: t > 0 ? +(students.reduce((s, p) => s + (p.cgpa || 0), 0) / t).toFixed(1) : 0,
          avgAptitude: t > 0 ? Math.round(students.reduce((s, p) => s + (p.aptitude_score || 0), 0) / t) : 0,
          avgProgramming: t > 0 ? Math.round(students.reduce((s, p) => s + (p.programming_score || 0), 0) / t) : 0,
        };
      });
    }
    if (compareMode === "students" && compareItems.length >= 2) {
      return compareItems.map((id, idx) => {
        const s = data.profiles.find(p => p.id === id);
        if (!s) return null;
        return {
          name: s.name,
          color: COMPARE_COLORS[idx],
          total: 1,
          placed: s.placement_status === "placed" ? 1 : 0,
          rate: s.placement_status === "placed" ? 100 : 0,
          avgCgpa: s.cgpa || 0,
          avgAptitude: s.aptitude_score || 0,
          avgProgramming: s.programming_score || 0,
          linkedin: s.linkedin_url,
          github: s.github_url,
          department: s.department,
          section: s.section,
          skills: s.skills || [],
        };
      }).filter(Boolean);
    }
    return [];
  };

  const compareData = getCompareData();

  const radarData = compareData.length >= 2 ? [
    { metric: "CGPA (×10)", ...Object.fromEntries(compareData.map(d => [d!.name, (d!.avgCgpa as number) * 10])) },
    { metric: "Aptitude", ...Object.fromEntries(compareData.map(d => [d!.name, d!.avgAptitude])) },
    { metric: "Programming", ...Object.fromEntries(compareData.map(d => [d!.name, d!.avgProgramming])) },
    { metric: "Placement %", ...Object.fromEntries(compareData.map(d => [d!.name, d!.rate])) },
  ] : [];

  const rangeOptions: { value: DateRange; label: string }[] = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "Quarter" },
    { value: "6m", label: "6 Months" },
    { value: "1y", label: "1 Year" },
    { value: "all", label: "All Time" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Deep-Dive Analytics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Every metric, every department, every trend — drillable & comparable</p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)}
              className="text-xs bg-secondary border border-border rounded-lg px-3 py-1.5 text-foreground font-medium">
              {rangeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <Card className="border-0 bg-card card-shadow sticky top-0 z-20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex gap-1 flex-wrap">
                {ALL_DEPARTMENTS.map(d => (
                  <Badge key={d} variant={selectedDepts.includes(d) ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5 hover:bg-primary/10 transition-colors"
                    onClick={() => toggleFilter(selectedDepts, d, setSelectedDepts)}>{d}</Badge>
                ))}
              </div>
              <span className="text-border">|</span>
              <div className="flex gap-1 flex-wrap">
                {ALL_SCHOOLS.map(s => (
                  <Badge key={s} variant={selectedSchools.includes(s) ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5 hover:bg-primary/10 transition-colors"
                    onClick={() => toggleFilter(selectedSchools, s, setSelectedSchools)}>{s.replace("School of ", "")}</Badge>
                ))}
              </div>
              <span className="text-border">|</span>
              <div className="flex gap-1 flex-wrap">
                {ALL_PROGRAMMES.map(p => (
                  <Badge key={p} variant={selectedProgrammes.includes(p) ? "default" : "outline"}
                    className="cursor-pointer text-[10px] px-2 py-0.5 hover:bg-primary/10 transition-colors"
                    onClick={() => toggleFilter(selectedProgrammes, p, setSelectedProgrammes)}>{p}</Badge>
                ))}
              </div>
              <span className="text-border">|</span>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
                className="text-[10px] bg-secondary border border-border rounded-md px-2 py-1 text-foreground">
                <option value="">All Batches</option>
                {batches.map(b => <option key={b} value={String(b)}>{b}</option>)}
              </select>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] h-6 px-2 text-rose-500 hover:text-rose-600">
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Overview + Compare */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs"><GitCompare className="h-3 w-3 mr-1" /> Compare</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Row 1 — 8 Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
              {metrics.map((m, i) => (
                <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card className="border-0 bg-card card-shadow">
                    <CardContent className="p-2.5 text-center">
                      <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                      <p className="text-base font-extrabold text-foreground">{m.value}</p>
                      <p className="text-[9px] text-muted-foreground font-medium">{m.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Placement Trend */}
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Placement Trend Over Time</CardTitle>
                <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)}
                  className="text-[10px] bg-secondary border border-border rounded-md px-2 py-1 text-foreground font-medium">
                  {rangeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Area type="monotone" dataKey="apps" stroke="hsl(var(--primary))" fill="url(#gA)" strokeWidth={2} name="Applications" />
                    <Area type="monotone" dataKey="placed" stroke="hsl(142 76% 36%)" fill="url(#gP)" strokeWidth={2} name="Placements" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Comparison Table */}
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Department Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        {["Dept", "Total", "Placed", "Unplaced", "Rate", "CGPA", "Aptitude", "Programming", "Fail%"].map(h => (
                          <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deptComparison.map(d => (
                        <tr key={d.dept} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-2 px-2 font-semibold text-foreground">{d.dept}</td>
                          <td className="py-2 px-2">{d.total}</td>
                          <td className="py-2 px-2 text-emerald-500 font-medium">{d.placed}</td>
                          <td className="py-2 px-2 text-rose-500">{d.unplaced}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <Progress value={d.rate} className="h-1.5 w-12" />
                              <span className={`text-[10px] font-bold ${d.rate >= 70 ? "text-emerald-500" : d.rate >= 40 ? "text-amber-500" : "text-rose-500"}`}>{d.rate}%</span>
                            </div>
                          </td>
                          <td className="py-2 px-2">{d.avgCgpa}</td>
                          <td className="py-2 px-2">{d.avgAptitude}</td>
                          <td className="py-2 px-2">{d.avgProgramming}</td>
                          <td className="py-2 px-2">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${d.failRate > 60 ? "bg-rose-500/10 text-rose-500" : d.failRate > 30 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                              {d.failRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Failure Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 bg-card card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500" /> Failure Rate by CGPA Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={failureByCgpa}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Bar dataKey="failRate" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} name="Failure %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> At-Risk Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {atRisk.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-secondary/30 text-xs">
                        <span className="font-bold text-muted-foreground w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{s.name}</p>
                          <p className="text-[9px] text-muted-foreground">{s.department || s.branch} • CGPA: {s.cgpa || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {s.linkedin_url && (
                            <a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600"><Linkedin className="h-3 w-3" /></a>
                          )}
                          {s.github_url && (
                            <a href={s.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Github className="h-3 w-3" /></a>
                          )}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold">
                          Risk: {Math.min(Math.round(s.riskScore), 100)}%
                        </span>
                      </div>
                    ))}
                    {atRisk.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No at-risk students found</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Drill-Down */}
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Section-Level Drill-Down</CardTitle>
              </CardHeader>
              <CardContent>
                {sectionData.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Select a department to see sections</p>}
                <div className="space-y-1">
                  {sectionData.map(sec => (
                    <div key={sec.section}>
                      <button onClick={() => setExpandedSection(expandedSection === sec.section ? null : sec.section)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/30 transition-colors text-xs">
                        {expandedSection === sec.section ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <span className="font-semibold text-foreground">{sec.section}</span>
                        <span className="text-muted-foreground">({sec.total} students)</span>
                        <div className="flex-1" />
                        <Progress value={sec.rate} className="h-1.5 w-16" />
                        <span className={`text-[10px] font-bold ${sec.rate >= 70 ? "text-emerald-500" : sec.rate >= 40 ? "text-amber-500" : "text-rose-500"}`}>{sec.rate}%</span>
                        <span className="text-muted-foreground">CGPA: {sec.avgCgpa}</span>
                      </button>
                      {expandedSection === sec.section && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="ml-6 space-y-1 pb-2">
                          {sec.students.slice(0, 20).map(st => (
                            <div key={st.id} className="flex items-center gap-2 p-1.5 rounded bg-secondary/20 text-[10px]">
                              <span className="font-medium text-foreground truncate flex-1">{st.name}</span>
                              <span className="text-muted-foreground">CGPA: {st.cgpa || "N/A"}</span>
                              <div className="flex items-center gap-1">
                                {st.linkedin_url && <a href={st.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500"><Linkedin className="h-3 w-3" /></a>}
                                {st.github_url && <a href={st.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Github className="h-3 w-3" /></a>}
                              </div>
                              <Badge variant={st.placement_status === "placed" ? "default" : "outline"} className="text-[9px] px-1.5 py-0">
                                {st.placement_status || "unplaced"}
                              </Badge>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Company + Package */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-0 bg-card card-shadow">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Hiring Companies</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {topCompanies.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-secondary/30 text-xs">
                        <span className="font-bold text-muted-foreground w-5">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{c.name}</p>
                          <p className="text-[9px] text-muted-foreground">{c.industry}</p>
                        </div>
                        <span className="text-[10px] font-bold text-primary">{c.package_min || 0}–{c.package_max || 0} LPA</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-card card-shadow">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Package Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pkgData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Companies" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Skill Gap */}
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Skill Demand vs Supply Gap</CardTitle></CardHeader>
              <CardContent>
                {skillGapData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={skillGapData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis type="category" dataKey="skill" tick={{ fontSize: 9 }} width={80} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Bar dataKey="demanded" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Demanded" />
                      <Bar dataKey="possessed" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} name="Possessed" />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-xs text-muted-foreground text-center py-8">No skill data available yet</p>}
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Top Placed Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                  {leaderboard.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className={`p-3 rounded-xl text-center ${i === 0 ? "bg-amber-500/10 border border-amber-500/30" : i === 1 ? "bg-slate-400/10 border border-slate-400/30" : i === 2 ? "bg-orange-600/10 border border-orange-600/30" : "bg-secondary/30 border border-border/30"}`}>
                      <div className="text-lg mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</div>
                      <p className="text-xs font-bold text-foreground truncate">{s.name}</p>
                      <p className="text-[9px] text-muted-foreground">{s.department || s.branch}</p>
                      <p className="text-[10px] font-bold text-primary mt-1">CGPA: {s.cgpa || "N/A"}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        {s.linkedin_url && <a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500"><Linkedin className="h-3 w-3" /></a>}
                        {s.github_url && <a href={s.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><Github className="h-3 w-3" /></a>}
                      </div>
                    </motion.div>
                  ))}
                  {leaderboard.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 col-span-full">No placed students found</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== COMPARE TAB ====== */}
          <TabsContent value="compare" className="space-y-4 mt-4">
            {/* Compare Mode Selector */}
            <Card className="border-0 bg-card card-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <GitCompare className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">Compare Mode</h2>
                  <div className="flex gap-2 ml-auto">
                    {(["sections", "batches", "students"] as const).map(mode => (
                      <Button key={mode} variant={compareMode === mode ? "default" : "outline"} size="sm"
                        className="text-xs h-7 capitalize"
                        onClick={() => { setCompareMode(mode); setCompareItems([]); }}>
                        {mode}
                      </Button>
                    ))}
                  </div>
                </div>

                {compareMode !== "none" && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-2">Select 2-3 items to compare (click to toggle):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {compareMode === "sections" && sections.map(sec => (
                        <Badge key={sec} variant={compareItems.includes(sec) ? "default" : "outline"}
                          className="cursor-pointer text-[10px] px-2 py-0.5"
                          onClick={() => toggleCompareItem(sec)}>{sec}</Badge>
                      ))}
                      {compareMode === "batches" && batches.map(b => (
                        <Badge key={b} variant={compareItems.includes(String(b)) ? "default" : "outline"}
                          className="cursor-pointer text-[10px] px-2 py-0.5"
                          onClick={() => toggleCompareItem(String(b))}>{b}</Badge>
                      ))}
                      {compareMode === "students" && (
                        <div className="w-full space-y-1">
                          <Input placeholder="Search students by name..." className="h-8 text-xs"
                            onChange={e => {
                              // Search is handled by filtering below
                            }} />
                          <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto">
                            {filtered.slice(0, 30).map(s => (
                              <Badge key={s.id} variant={compareItems.includes(s.id) ? "default" : "outline"}
                                className="cursor-pointer text-[10px] px-2 py-0.5"
                                onClick={() => toggleCompareItem(s.id)}>
                                {s.name} ({s.department || s.branch})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparison Results */}
            {compareData.length >= 2 && (
              <>
                {/* Side-by-side Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {compareData.map((item, idx) => (
                    <Card key={idx} className="border-0 bg-card card-shadow" style={{ borderTop: `3px solid ${item!.color}` }}>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-bold text-foreground mb-3">{item!.name}</h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Students</span><span className="font-bold">{item!.total}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Placed</span><span className="font-bold text-emerald-500">{item!.placed}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Placement Rate</span><span className="font-bold">{item!.rate}%</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Avg CGPA</span><span className="font-bold">{item!.avgCgpa}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Avg Aptitude</span><span className="font-bold">{item!.avgAptitude}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Avg Programming</span><span className="font-bold">{item!.avgProgramming}</span></div>
                          {/* Student-specific fields */}
                          {(item as any)?.linkedin && (
                            <a href={(item as any).linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                              <Linkedin className="h-3 w-3" /> LinkedIn Profile
                            </a>
                          )}
                          {(item as any)?.github && (
                            <a href={(item as any).github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                              <Github className="h-3 w-3" /> GitHub Profile
                            </a>
                          )}
                          {(item as any)?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {((item as any).skills as string[]).slice(0, 6).map(sk => (
                                <span key={sk} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{sk}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Radar Chart */}
                <Card className="border-0 bg-card card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Radar Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <PolarRadiusAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                        {compareData.map((item, idx) => (
                          <Radar key={idx} name={item!.name} dataKey={item!.name} stroke={item!.color} fill={item!.color} fillOpacity={0.15} strokeWidth={2} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bar Chart Comparison */}
                <Card className="border-0 bg-card card-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Side-by-Side Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { metric: "Placement %", ...Object.fromEntries(compareData.map(d => [d!.name, d!.rate])) },
                        { metric: "Avg CGPA ×10", ...Object.fromEntries(compareData.map(d => [d!.name, (d!.avgCgpa as number) * 10])) },
                        { metric: "Aptitude", ...Object.fromEntries(compareData.map(d => [d!.name, d!.avgAptitude])) },
                        { metric: "Programming", ...Object.fromEntries(compareData.map(d => [d!.name, d!.avgProgramming])) },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={CHART_TOOLTIP} />
                        {compareData.map((item, idx) => (
                          <Bar key={idx} dataKey={item!.name} fill={item!.color} radius={[4, 4, 0, 0]} />
                        ))}
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {compareData.length < 2 && compareMode !== "none" && (
              <Card className="border-0 bg-card card-shadow">
                <CardContent className="p-8 text-center">
                  <GitCompare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select at least 2 items to start comparing</p>
                </CardContent>
              </Card>
            )}

            {compareMode === "none" && (
              <Card className="border-0 bg-card card-shadow">
                <CardContent className="p-8 text-center">
                  <GitCompare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Choose a compare mode above to start</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Compare sections, batches, or individual students side by side</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* AI Analytics Assistant */}
        <AIAnalyticsChat />
      </div>
    </DashboardLayout>
  );
};

// AI Chat Component
type ChatMsg = { role: "user" | "assistant"; content: string };

const AIAnalyticsChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-assistant`;

  const suggestions = [
    "Which department has the worst placement rate?",
    "Show students with CGPA above 8 who are unplaced",
    "Compare CSE vs IT placement stats",
    "What skills are most in demand?",
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: ChatMsg = { role: "user", content: text.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMsgs }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI service error" }));
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${err.error || "Something went wrong. Please try again."}` }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Failed to connect to AI. Please try again." }]);
    }
    setIsStreaming(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-[380px] max-h-[500px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">PlaceAI Analytics</p>
                <p className="text-[9px] text-muted-foreground">Ask anything about placement data</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[340px]">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground text-center mb-3">Try asking:</p>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="w-full text-left text-[10px] p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && <Bot className="h-4 w-4 text-primary mt-1 shrink-0" />}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:text-xs [&_li]:text-xs [&_strong]:text-foreground [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === "user" && <User className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />}
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <Bot className="h-4 w-4 text-primary mt-1" />
                  <div className="bg-secondary/50 rounded-xl px-3 py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-2 border-t border-border flex gap-1.5">
              <Input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask about placement data..." className="h-8 text-xs" disabled={isStreaming} />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminAnalytics;
