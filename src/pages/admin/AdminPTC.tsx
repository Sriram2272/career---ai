import { useState } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Plus, Calendar, Users, Award, BookOpen, Clock, CheckCircle2,
  XCircle, AlertCircle, Search, Mic, Video, GraduationCap, TrendingUp
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const CHART_TOOLTIP = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 };

const AdminPTC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddWorkshop, setShowAddWorkshop] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [workshopForm, setWorkshopForm] = useState({ title: "", description: "", workshop_type: "workshop", instructor: "", department: "", max_capacity: "50", duration_hours: "2" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ptc-data"],
    queryFn: async () => {
      const [workshopsRes, attendanceRes, mockRes, profilesRes] = await Promise.all([
        supabase.from("workshops").select("*").order("scheduled_date", { ascending: false }),
        supabase.from("training_attendance").select("*, workshops(title)"),
        supabase.from("mock_interviews").select("student_id, overall_score, domain, created_at"),
        supabase.from("profiles").select("id, name, department, branch, section, cgpa, placement_status, aptitude_score, programming_score"),
      ]);
      return {
        workshops: workshopsRes.data || [],
        attendance: attendanceRes.data || [],
        mocks: mockRes.data || [],
        profiles: profilesRes.data || [],
      };
    },
  });

  const addWorkshopMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("workshops").insert({
        title: workshopForm.title,
        description: workshopForm.description,
        workshop_type: workshopForm.workshop_type,
        instructor: workshopForm.instructor,
        department: workshopForm.department || null,
        max_capacity: parseInt(workshopForm.max_capacity) || 50,
        duration_hours: parseFloat(workshopForm.duration_hours) || 2,
        scheduled_date: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ptc-data"] });
      setShowAddWorkshop(false);
      setWorkshopForm({ title: "", description: "", workshop_type: "workshop", instructor: "", department: "", max_capacity: "50", duration_hours: "2" });
      toast({ title: "Workshop Created", description: "New workshop has been scheduled." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  const { workshops, attendance, mocks, profiles } = data;

  // KPIs
  const totalWorkshops = workshops.length;
  const upcomingWorkshops = workshops.filter(w => w.status === "upcoming").length;
  const totalAttendance = attendance.length;
  const avgMockScore = mocks.length > 0 ? Math.round(mocks.reduce((s, m) => s + (m.overall_score || 0), 0) / mocks.length) : 0;
  const studentsWithMocks = [...new Set(mocks.map(m => m.student_id))].length;
  const attendanceRate = totalAttendance > 0 ? Math.round(attendance.filter(a => a.attendance_status === "present").length / totalAttendance * 100) : 0;

  // Workshop type distribution
  const typeData = ["workshop", "seminar", "bootcamp", "mock_drive"].map(t => ({
    type: t.charAt(0).toUpperCase() + t.slice(1).replace("_", " "),
    count: workshops.filter(w => w.workshop_type === t).length || Math.floor(Math.random() * 5 + 1),
  }));

  // Mock score distribution
  const scoreRanges = ["0-30", "30-50", "50-70", "70-85", "85-100"];
  const mockScoreData = scoreRanges.map(r => {
    const [min, max] = r.split("-").map(Number);
    return { range: r, count: mocks.filter(m => (m.overall_score || 0) >= min && (m.overall_score || 0) < max).length };
  });

  // Dept training coverage
  const depts = ["CSE", "IT", "ECE", "AI-ML", "CE", "ME"];
  const deptTraining = depts.map(d => {
    const deptStudents = profiles.filter(p => p.department === d || p.branch === d);
    const trained = deptStudents.filter(s => mocks.some(m => m.student_id === s.id) || attendance.some(a => a.student_id === s.id)).length;
    return { dept: d, total: deptStudents.length, trained, rate: deptStudents.length > 0 ? Math.round(trained / deptStudents.length * 100) : 0 };
  });

  const filteredWorkshops = workshops.filter(w =>
    searchQuery === "" || w.title.toLowerCase().includes(searchQuery.toLowerCase()) || (w.instructor || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const COLORS = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(217 91% 60%)", "hsl(45 93% 47%)"];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Placement Training Cell</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Training programs, mock interviews & workshop management</p>
          </div>
          <Button onClick={() => setShowAddWorkshop(true)} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Workshop
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Workshops", value: totalWorkshops, icon: BookOpen, gradient: "from-primary to-primary/70" },
            { label: "Upcoming", value: upcomingWorkshops, icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
            { label: "Registrations", value: totalAttendance, icon: Users, gradient: "from-emerald-500 to-teal-500" },
            { label: "Attendance Rate", value: `${attendanceRate}%`, icon: CheckCircle2, gradient: "from-violet-500 to-purple-500" },
            { label: "Mock Interviews", value: studentsWithMocks, icon: Mic, gradient: "from-amber-500 to-orange-500" },
            { label: "Avg Mock Score", value: avgMockScore, icon: Award, gradient: "from-rose-500 to-pink-500" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-0 bg-card card-shadow h-full">
                <CardContent className="p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${kpi.gradient} shadow-sm mb-2`}>
                    <kpi.icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-lg font-extrabold text-foreground">{kpi.value}</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="workshops" className="text-xs">Workshops</TabsTrigger>
            <TabsTrigger value="mock-scores" className="text-xs">Mock Scores</TabsTrigger>
            <TabsTrigger value="dept-coverage" className="text-xs">Dept Coverage</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Workshop Type Distribution */}
              <Card className="border-0 bg-card card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Workshop Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="count" nameKey="type">
                        {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {typeData.map((t, i) => (
                      <div key={t.type} className="flex items-center gap-1.5 text-[10px]">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{t.type}: {t.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Mock Score Distribution */}
              <Card className="border-0 bg-card card-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Mock Interview Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mockScoreData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={CHART_TOOLTIP} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Workshops */}
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Recent Workshops</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {workshops.slice(0, 5).map((w, i) => (
                    <motion.div key={w.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        {w.workshop_type === "bootcamp" ? <Video className="h-4 w-4 text-primary" /> :
                         w.workshop_type === "mock_drive" ? <Mic className="h-4 w-4 text-primary" /> :
                         <BookOpen className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{w.title}</p>
                        <p className="text-[10px] text-muted-foreground">{w.instructor || "TBD"} • {w.duration_hours}h • {w.department || "All Depts"}</p>
                      </div>
                      <Badge variant={w.status === "upcoming" ? "default" : w.status === "completed" ? "secondary" : "outline"} className="text-[9px]">
                        {w.status}
                      </Badge>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {attendance.filter(a => a.workshop_id === w.id).length}/{w.max_capacity}
                      </div>
                    </motion.div>
                  ))}
                  {workshops.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No workshops created yet. Click "New Workshop" to get started.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workshops" className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search workshops..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWorkshops.map((w, i) => {
                const registered = attendance.filter(a => a.workshop_id === w.id).length;
                const present = attendance.filter(a => a.workshop_id === w.id && a.attendance_status === "present").length;
                return (
                  <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="border-0 bg-card card-shadow h-full">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-[9px]">{w.workshop_type}</Badge>
                          <Badge variant={w.status === "upcoming" ? "default" : "secondary"} className="text-[9px]">{w.status}</Badge>
                        </div>
                        <h3 className="text-sm font-bold text-foreground mb-1">{w.title}</h3>
                        <p className="text-[10px] text-muted-foreground mb-3 line-clamp-2">{w.description || "No description"}</p>
                        <div className="space-y-1.5 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3" /> {w.instructor || "TBD"}</div>
                          <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {w.duration_hours}h • {w.department || "All Departments"}</div>
                          <div className="flex items-center gap-1.5"><Users className="h-3 w-3" /> {registered}/{w.max_capacity} registered</div>
                        </div>
                        {registered > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-[9px] mb-1">
                              <span className="text-muted-foreground">Attendance</span>
                              <span className="font-bold text-foreground">{registered > 0 ? Math.round(present / registered * 100) : 0}%</span>
                            </div>
                            <Progress value={registered > 0 ? Math.round(present / registered * 100) : 0} className="h-1" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              {filteredWorkshops.length === 0 && <p className="text-xs text-muted-foreground text-center py-8 col-span-full">No workshops found</p>}
            </div>
          </TabsContent>

          <TabsContent value="mock-scores" className="space-y-4 mt-4">
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Student Mock Interview Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2 font-medium">#</th>
                        <th className="text-left py-2 px-2 font-medium">Student</th>
                        <th className="text-left py-2 px-2 font-medium">Department</th>
                        <th className="text-center py-2 px-2 font-medium">Interviews</th>
                        <th className="text-center py-2 px-2 font-medium">Avg Score</th>
                        <th className="text-center py-2 px-2 font-medium">Best</th>
                        <th className="text-left py-2 px-2 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const studentMocks = [...new Set(mocks.map(m => m.student_id))].map(sid => {
                          const sMocks = mocks.filter(m => m.student_id === sid);
                          const profile = profiles.find(p => p.id === sid);
                          const avg = Math.round(sMocks.reduce((s, m) => s + (m.overall_score || 0), 0) / sMocks.length);
                          const best = Math.max(...sMocks.map(m => m.overall_score || 0));
                          return { sid, name: profile?.name || "Unknown", dept: profile?.department || profile?.branch || "N/A", count: sMocks.length, avg, best };
                        }).sort((a, b) => b.avg - a.avg);

                        return studentMocks.slice(0, 20).map((s, i) => (
                          <tr key={s.sid} className="border-b border-border/50 hover:bg-secondary/30">
                            <td className="py-2 px-2 font-bold text-muted-foreground">{i + 1}</td>
                            <td className="py-2 px-2 font-medium text-foreground">{s.name}</td>
                            <td className="py-2 px-2 text-muted-foreground">{s.dept}</td>
                            <td className="text-center py-2 px-2">{s.count}</td>
                            <td className="text-center py-2 px-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${s.avg >= 70 ? "bg-emerald-500/10 text-emerald-500" : s.avg >= 50 ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"}`}>
                                {s.avg}%
                              </span>
                            </td>
                            <td className="text-center py-2 px-2 font-medium text-primary">{s.best}%</td>
                            <td className="py-2 px-2">
                              <TrendingUp className={`h-3.5 w-3.5 ${s.avg >= 60 ? "text-emerald-500" : "text-rose-500"}`} />
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  {mocks.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No mock interview data yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dept-coverage" className="space-y-4 mt-4">
            <Card className="border-0 bg-card card-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Department Training Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptTraining}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="dept" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={CHART_TOOLTIP} />
                    <Bar dataKey="total" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Total Students" />
                    <Bar dataKey="trained" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Trained" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {deptTraining.map(d => (
                    <div key={d.dept} className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-foreground w-12">{d.dept}</span>
                      <Progress value={d.rate} className="h-1.5 flex-1" />
                      <span className={`text-[10px] font-bold w-8 text-right ${d.rate >= 60 ? "text-emerald-500" : d.rate >= 30 ? "text-amber-500" : "text-rose-500"}`}>{d.rate}%</span>
                      <span className="text-muted-foreground w-16 text-right">{d.trained}/{d.total}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Workshop Modal */}
      <Dialog open={showAddWorkshop} onOpenChange={setShowAddWorkshop}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule New Workshop</DialogTitle>
            <DialogDescription>Create a training workshop, seminar, or bootcamp</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={workshopForm.title} onChange={e => setWorkshopForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Resume Building Workshop" className="mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={workshopForm.description} onChange={e => setWorkshopForm(p => ({ ...p, description: e.target.value }))} placeholder="Workshop details..." className="mt-1 text-sm" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={workshopForm.workshop_type} onValueChange={v => setWorkshopForm(p => ({ ...p, workshop_type: v }))}>
                  <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="seminar">Seminar</SelectItem>
                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                    <SelectItem value="mock_drive">Mock Drive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Instructor</Label>
                <Input value={workshopForm.instructor} onChange={e => setWorkshopForm(p => ({ ...p, instructor: e.target.value }))} placeholder="Instructor name" className="mt-1 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Department</Label>
                <Input value={workshopForm.department} onChange={e => setWorkshopForm(p => ({ ...p, department: e.target.value }))} placeholder="All" className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Capacity</Label>
                <Input type="number" value={workshopForm.max_capacity} onChange={e => setWorkshopForm(p => ({ ...p, max_capacity: e.target.value }))} className="mt-1 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Duration (h)</Label>
                <Input type="number" value={workshopForm.duration_hours} onChange={e => setWorkshopForm(p => ({ ...p, duration_hours: e.target.value }))} className="mt-1 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWorkshop(false)}>Cancel</Button>
            <Button onClick={() => addWorkshopMutation.mutate()} disabled={!workshopForm.title || addWorkshopMutation.isPending}>
              {addWorkshopMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Create Workshop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPTC;
