import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertTriangle, Search, Users, TrendingDown, Mail, Bell, Send, CheckCheck,
  ExternalLink, Loader2, ChevronDown, ChevronUp, GraduationCap
} from "lucide-react";

type StudentRisk = {
  id: string;
  name: string;
  branch: string | null;
  section: string | null;
  cgpa: number | null;
  placement_status: string | null;
  resume_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  skills: string[] | null;
  phone: string | null;
  registration_number: string | null;
  tenth_percent: number | null;
  twelfth_percent: number | null;
  preferred_roles: string[] | null;
  readiness: number;
  riskFactors: string[];
};

function computeReadiness(p: any, skillCount: number, appCount: number, mockCount: number): { score: number; factors: string[] } {
  const factors: string[] = [];
  let total = 0;

  // Profile (20)
  const fields = [p.cgpa, p.phone, p.branch, p.registration_number, p.tenth_percent, p.twelfth_percent, p.linkedin_url, (p.preferred_roles as string[] | null)?.length ? true : null];
  const filled = fields.filter(Boolean).length;
  const profileScore = Math.min(Math.round((filled / fields.length) * 20), 20);
  total += profileScore;
  if (profileScore < 10) factors.push("Incomplete profile");

  // Resume (20)
  let resumeScore = 0;
  if (p.resume_url) resumeScore += 14;
  else factors.push("No resume uploaded");
  if (((p.skills as string[] | null)?.length || 0) >= 3) resumeScore += 6;
  else factors.push("Less than 3 skills listed");
  total += Math.min(resumeScore, 20);

  // Skills (20)
  const skScore = Math.min(skillCount * 4, 20);
  total += skScore;
  if (skScore < 8) factors.push("Few verified skills");

  // Applications (20)
  const apScore = Math.min(appCount * 5, 20);
  total += apScore;
  if (apScore === 0) factors.push("No job applications");

  // Mock Interviews (20)
  const mkScore = Math.min(mockCount * 7, 20);
  total += mkScore;
  if (mkScore === 0) factors.push("No mock interviews");

  return { score: Math.min(total, 100), factors };
}

const AtRiskStudents = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"readiness" | "cgpa" | "name">("readiness");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["at-risk-students", user?.id],
    queryFn: async () => {
      const [profilesRes, skillsRes, appsRes, mocksRes] = await Promise.all([
        supabase.from("profiles").select("id, name, branch, section, cgpa, placement_status, resume_url, linkedin_url, github_url, skills, phone, registration_number, tenth_percent, twelfth_percent, preferred_roles").limit(500),
        supabase.from("student_skills").select("student_id"),
        supabase.from("applications").select("student_id"),
        supabase.from("mock_interviews").select("student_id"),
      ]);

      const profiles = profilesRes.data || [];
      const skillsByStudent: Record<string, number> = {};
      (skillsRes.data || []).forEach((s: any) => { skillsByStudent[s.student_id] = (skillsByStudent[s.student_id] || 0) + 1; });
      const appsByStudent: Record<string, number> = {};
      (appsRes.data || []).forEach((a: any) => { appsByStudent[a.student_id] = (appsByStudent[a.student_id] || 0) + 1; });
      const mocksByStudent: Record<string, number> = {};
      (mocksRes.data || []).forEach((m: any) => { mocksByStudent[m.student_id] = (mocksByStudent[m.student_id] || 0) + 1; });

      const students: StudentRisk[] = profiles.map((p: any) => {
        const { score, factors } = computeReadiness(p, skillsByStudent[p.id] || 0, appsByStudent[p.id] || 0, mocksByStudent[p.id] || 0);
        return { ...p, readiness: score, riskFactors: factors };
      });

      return students.filter(s => s.readiness < 50 && s.placement_status !== "placed");
    },
    enabled: !!user?.id,
  });

  const branches = useMemo(() => {
    const set = new Set((data || []).map(s => s.branch).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [data]);

  const sendReminder = async (student: StudentRisk) => {
    setSendingId(student.id);
    try {
      const issues = student.riskFactors.slice(0, 3).join(", ");
      const { error } = await supabase.from("notifications").insert({
        recipient_id: student.id,
        sender_id: user!.id,
        title: "Complete Your Profile",
        message: `Your placement readiness is at ${student.readiness}%. Please address: ${issues}. Complete your profile to unlock more opportunities.`,
        type: "warning" as any,
        priority: student.readiness < 20 ? "urgent" as any : "normal" as any,
        link: "/profile",
      });
      if (error) throw error;
      setSentReminders(prev => new Set(prev).add(student.id));
      toast.success(`Reminder sent to ${student.name}`);
    } catch (e: any) {
      toast.error("Failed to send reminder: " + (e.message || "Unknown error"));
    } finally {
      setSendingId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = data || [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.registration_number?.toLowerCase().includes(q));
    }
    if (branchFilter !== "all") list = list.filter(s => s.branch === branchFilter);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "readiness") cmp = a.readiness - b.readiness;
      else if (sortBy === "cgpa") cmp = (a.cgpa || 0) - (b.cgpa || 0);
      else cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data, search, branchFilter, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />;
  };

  const getRiskBadge = (score: number) => {
    if (score < 20) return <Badge variant="destructive" className="text-[10px]">Critical</Badge>;
    if (score < 35) return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">High Risk</Badge>;
    return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/20 text-[10px]">Moderate</Badge>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const criticalCount = (data || []).filter(s => s.readiness < 20).length;
  const highCount = (data || []).filter(s => s.readiness >= 20 && s.readiness < 35).length;
  const moderateCount = (data || []).filter(s => s.readiness >= 35).length;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> At-Risk Students
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Students with placement readiness below 50% who need attention
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total At-Risk</p>
                <p className="text-2xl font-bold text-foreground">{(data || []).length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Critical (&lt;20%)</p>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-amber-600">{highCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-yellow-500/15 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Moderate</p>
                <p className="text-2xl font-bold text-yellow-700">{moderateCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or reg no..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>Student <SortIcon col="name" /></TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("cgpa")}>CGPA <SortIcon col="cgpa" /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("readiness")}>Readiness <SortIcon col="readiness" /></TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Key Issues</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No at-risk students found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{s.name}</p>
                          <p className="text-[11px] text-muted-foreground">{s.registration_number || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{s.branch || "—"}</span>
                        {s.section && <span className="text-[10px] text-muted-foreground ml-1">({s.section})</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold ${(s.cgpa || 0) < 6 ? "text-destructive" : "text-foreground"}`}>
                          {s.cgpa?.toFixed(1) || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={s.readiness} className="h-2 flex-1" />
                          <span className="text-xs font-bold text-foreground w-8">{s.readiness}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(s.readiness)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {s.riskFactors.slice(0, 3).map((f, idx) => (
                            <span key={idx} className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                          {s.riskFactors.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{s.riskFactors.length - 3} more</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {s.linkedin_url && (
                            <a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {s.github_url && (
                            <a href={s.github_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {!s.linkedin_url && !s.github_url && (
                            <span className="text-[10px] text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sentReminders.has(s.id) ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <CheckCheck className="h-3 w-3 mr-1" /> Sent
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] gap-1"
                            disabled={sendingId === s.id}
                            onClick={() => sendReminder(s)}
                          >
                            {sendingId === s.id ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Sending</>
                            ) : (
                              <><Bell className="h-3 w-3" /> Remind</>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {(data || []).length} at-risk students • Readiness is computed from profile completeness, resume, skills, applications & mock interviews
        </p>
      </motion.div>
    </DashboardLayout>
  );
};

export default AtRiskStudents;
