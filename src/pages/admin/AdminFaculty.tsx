import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Building2, Plus, Search, Globe, MapPin, IndianRupee, Briefcase, Users,
  Edit, Trash2, ExternalLink, ChevronRight, Calendar, TrendingUp, Eye, X, Filter,
  CalendarPlus, ListChecks, UserCheck, GraduationCap
} from "lucide-react";

interface CompanyForm {
  name: string; industry: string; website: string; description: string;
  package_min: number | null; package_max: number | null;
  locations: string[]; is_active: boolean; logo_url: string;
}

interface DriveForm {
  company_id: string; drive_date: string; rounds: { name: string; type: string }[];
  shortlisted_students: string[];
}

const emptyForm: CompanyForm = {
  name: "", industry: "", website: "", description: "",
  package_min: null, package_max: null, locations: [], is_active: true, logo_url: "",
};

const emptyDriveForm: DriveForm = {
  company_id: "", drive_date: "", rounds: [{ name: "Aptitude Test", type: "aptitude" }], shortlisted_students: [],
};

const industries = ["IT / Software", "Banking / Finance", "Consulting", "Healthcare", "Manufacturing", "E-Commerce", "EdTech", "Automotive", "Telecom", "FMCG", "Other"];
const roundTypes = [
  { value: "aptitude", label: "Aptitude Test" },
  { value: "coding", label: "Coding Round" },
  { value: "technical", label: "Technical Interview" },
  { value: "hr", label: "HR Interview" },
  { value: "gd", label: "Group Discussion" },
  { value: "case_study", label: "Case Study" },
  { value: "presentation", label: "Presentation" },
];

const AdminFaculty = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState("companies");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [locationInput, setLocationInput] = useState("");
  const [viewCompany, setViewCompany] = useState<any>(null);
  const [showDriveDialog, setShowDriveDialog] = useState(false);
  const [driveForm, setDriveForm] = useState<DriveForm>(emptyDriveForm);
  const [roundInput, setRoundInput] = useState({ name: "", type: "aptitude" });
  const [studentSearch, setStudentSearch] = useState("");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: jobPostings = [] } = useQuery({
    queryKey: ["job_postings_all"],
    queryFn: async () => {
      const { data } = await supabase.from("job_postings").select("*, companies(name, logo_url)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: drives = [] } = useQuery({
    queryKey: ["placement_drives_all"],
    queryFn: async () => {
      const { data } = await supabase.from("placement_drives").select("*, companies(name)").order("drive_date", { ascending: false });
      return data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["all-students-for-drives"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, name, department, branch, cgpa, placement_status, section, programme");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CompanyForm & { id?: string }) => {
      const payload = {
        name: data.name, industry: data.industry, website: data.website,
        description: data.description, package_min: data.package_min,
        package_max: data.package_max, locations: data.locations,
        is_active: data.is_active, logo_url: data.logo_url,
      };
      if (data.id) {
        const { error } = await supabase.from("companies").update(payload).eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("companies").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      setShowDialog(false); setEditId(null); setForm(emptyForm);
      toast({ title: editId ? "Company updated" : "Company added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["companies"] }); toast({ title: "Company deleted" }); },
  });

  const createDriveMutation = useMutation({
    mutationFn: async (form: DriveForm) => {
      const { error } = await supabase.from("placement_drives").insert({
        company_id: form.company_id,
        drive_date: form.drive_date || null,
        rounds: form.rounds as any,
        status: "scheduled",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["placement_drives_all"] });
      setShowDriveDialog(false); setDriveForm(emptyDriveForm);
      toast({ title: "Placement drive created successfully!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = companies.filter((c: any) => {
    const matchSearch = c.name?.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === "all" || c.industry === industryFilter;
    return matchSearch && matchIndustry;
  });

  const activeCompanies = companies.filter((c: any) => c.is_active).length;
  const totalJobs = jobPostings.length;
  const openJobs = jobPostings.filter((j: any) => j.status === "open").length;
  const avgPackage = companies.length > 0
    ? (companies.reduce((s: number, c: any) => s + (c.package_max || 0), 0) / companies.length).toFixed(1) : "0";

  const openEdit = (company: any) => {
    setEditId(company.id);
    setForm({
      name: company.name || "", industry: company.industry || "",
      website: company.website || "", description: company.description || "",
      package_min: company.package_min, package_max: company.package_max,
      locations: company.locations || [], is_active: company.is_active ?? true,
      logo_url: company.logo_url || "",
    });
    setShowDialog(true);
  };

  const addLocation = () => {
    if (locationInput.trim() && !form.locations.includes(locationInput.trim())) {
      setForm({ ...form, locations: [...form.locations, locationInput.trim()] });
      setLocationInput("");
    }
  };

  const addRound = () => {
    const name = roundInput.name.trim() || roundTypes.find(r => r.value === roundInput.type)?.label || "Round";
    setDriveForm({ ...driveForm, rounds: [...driveForm.rounds, { name, type: roundInput.type }] });
    setRoundInput({ name: "", type: "aptitude" });
  };

  const removeRound = (idx: number) => {
    setDriveForm({ ...driveForm, rounds: driveForm.rounds.filter((_, i) => i !== idx) });
  };

  const toggleStudent = (studentId: string) => {
    setDriveForm(prev => ({
      ...prev,
      shortlisted_students: prev.shortlisted_students.includes(studentId)
        ? prev.shortlisted_students.filter(id => id !== studentId)
        : [...prev.shortlisted_students, studentId],
    }));
  };

  const filteredStudents = students.filter((s: any) => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.department?.toLowerCase().includes(q) || s.branch?.toLowerCase().includes(q);
  });

  const companyJobs = (companyId: string) => jobPostings.filter((j: any) => j.company_id === companyId);
  const companyDrives = (companyId: string) => drives.filter((d: any) => d.company_id === companyId);

  const openDriveForCompany = (companyId: string) => {
    setDriveForm({ ...emptyDriveForm, company_id: companyId });
    setShowDriveDialog(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Company Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage partner companies, job postings & placement drives</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setDriveForm(emptyDriveForm); setShowDriveDialog(true); }}>
              <CalendarPlus className="h-4 w-4 mr-1" /> Create Drive
            </Button>
            <Button size="sm" onClick={() => { setForm(emptyForm); setEditId(null); setShowDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Company
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Companies", value: companies.length, icon: Building2, color: "text-blue-500" },
            { label: "Active Partners", value: activeCompanies, icon: TrendingUp, color: "text-green-500" },
            { label: "Open Positions", value: openJobs, icon: Briefcase, color: "text-orange-500" },
            { label: "Avg Package (LPA)", value: avgPackage, icon: IndianRupee, color: "text-purple-500" },
          ].map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{k.value}</p>
                </div>
                <k.icon className={`h-8 w-8 ${k.color} opacity-60`} />
              </div>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="jobs">Job Postings ({totalJobs})</TabsTrigger>
            <TabsTrigger value="drives">Placement Drives ({drives.length})</TabsTrigger>
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-[180px] h-9"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading companies...</div>
            ) : filtered.length === 0 ? (
              <Card className="p-12 text-center">
                <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No companies found</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filtered.map((c: any) => {
                  const jobs = companyJobs(c.id);
                  const drv = companyDrives(c.id);
                  return (
                    <Card key={c.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center text-foreground font-bold text-sm shrink-0">
                            {c.logo_url ? <img src={c.logo_url} alt="" className="h-full w-full rounded-xl object-cover" /> : c.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-foreground truncate">{c.name}</h3>
                              <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px] h-5">
                                {c.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              {c.industry && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{c.industry}</span>}
                              {c.locations?.length > 0 && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.locations.slice(0, 2).join(", ")}</span>}
                              {(c.package_min || c.package_max) && (
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-3 w-3" />
                                  {c.package_min || 0}–{c.package_max || "?"} LPA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                              <span className="text-muted-foreground">{jobs.length} jobs</span>
                              <span className="text-muted-foreground">{drv.length} drives</span>
                              {c.website && (
                                <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-0.5 hover:underline">
                                  <Globe className="h-3 w-3" /> Website
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Schedule Drive" onClick={() => openDriveForCompany(c.id)}>
                            <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewCompany(c)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                            if (confirm("Delete this company?")) deleteMutation.mutate(c.id);
                          }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Job Postings Tab */}
          <TabsContent value="jobs">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobPostings.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No job postings yet</TableCell></TableRow>
                  ) : jobPostings.map((j: any) => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium text-sm">{j.title}</TableCell>
                      <TableCell className="text-sm">{(j.companies as any)?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{j.package_lpa ? `${j.package_lpa} LPA` : "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{j.job_type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={j.status === "open" ? "default" : "secondary"} className="text-[10px]">{j.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {j.deadline ? new Date(j.deadline).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Placement Drives Tab */}
          <TabsContent value="drives" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setDriveForm(emptyDriveForm); setShowDriveDialog(true); }}>
                <CalendarPlus className="h-4 w-4 mr-1" /> New Drive
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Drive Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Offers</TableHead>
                    <TableHead>Rounds</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drives.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No placement drives yet</TableCell></TableRow>
                  ) : drives.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-sm">{(d.companies as any)?.name || "—"}</TableCell>
                      <TableCell className="text-sm">{d.drive_date ? new Date(d.drive_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={d.status === "completed" ? "default" : d.status === "scheduled" ? "outline" : "secondary"} className="text-[10px]">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.offers_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(d.rounds) && d.rounds.map((r: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[9px]">{r.name || `Round ${i + 1}`}</Badge>
                          ))}
                          {(!Array.isArray(d.rounds) || d.rounds.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Company Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Company" : "Add New Company"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Company Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Google" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Industry</Label>
                <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Min Package (LPA)</Label>
                <Input type="number" value={form.package_min ?? ""} onChange={(e) => setForm({ ...form, package_min: e.target.value ? Number(e.target.value) : null })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Max Package (LPA)</Label>
                <Input type="number" value={form.package_max ?? ""} onChange={(e) => setForm({ ...form, package_max: e.target.value ? Number(e.target.value) : null })} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Logo URL</Label>
                <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://logo.clearbit.com/..." className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Locations</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} placeholder="Add location" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())} />
                  <Button type="button" size="sm" variant="outline" onClick={addLocation}>Add</Button>
                </div>
                {form.locations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.locations.map((loc) => (
                      <Badge key={loc} variant="secondary" className="text-[10px] gap-1">
                        {loc}
                        <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setForm({ ...form, locations: form.locations.filter((l) => l !== loc) })} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-xs">Active Partner</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...form, id: editId || undefined })} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editId ? "Update" : "Add Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Placement Drive Dialog */}
      <Dialog open={showDriveDialog} onOpenChange={setShowDriveDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5 text-primary" />
              Create Placement Drive
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Company & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Company *</Label>
                <Select value={driveForm.company_id} onValueChange={(v) => setDriveForm({ ...driveForm, company_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Drive Date</Label>
                <Input type="date" value={driveForm.drive_date} onChange={(e) => setDriveForm({ ...driveForm, drive_date: e.target.value })} className="mt-1" />
              </div>
            </div>

            {/* Rounds Configuration */}
            <div>
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                <ListChecks className="h-3.5 w-3.5" /> Interview Rounds
              </Label>
              <div className="space-y-2">
                {driveForm.rounds.map((round, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{idx + 1}</div>
                    <span className="text-sm font-medium flex-1">{round.name}</span>
                    <Badge variant="outline" className="text-[10px]">{roundTypes.find(r => r.value === round.type)?.label || round.type}</Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeRound(idx)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Round name (optional)"
                  value={roundInput.name}
                  onChange={(e) => setRoundInput({ ...roundInput, name: e.target.value })}
                  className="h-8 text-xs"
                />
                <Select value={roundInput.type} onValueChange={(v) => setRoundInput({ ...roundInput, type: v })}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roundTypes.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8" onClick={addRound}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Student Shortlisting */}
            <div>
              <Label className="text-xs font-medium flex items-center gap-1.5 mb-2">
                <UserCheck className="h-3.5 w-3.5" /> Shortlist Students
                {driveForm.shortlisted_students.length > 0 && (
                  <Badge className="text-[10px] ml-1">{driveForm.shortlisted_students.length} selected</Badge>
                )}
              </Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search students by name or department..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>
              <div className="max-h-[200px] overflow-y-auto border border-border rounded-lg divide-y divide-border/50">
                {filteredStudents.slice(0, 50).map((s: any) => {
                  const selected = driveForm.shortlisted_students.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-2.5 hover:bg-secondary/30 cursor-pointer transition-colors ${selected ? "bg-primary/5" : ""}`}
                      onClick={() => toggleStudent(s.id)}
                    >
                      <Checkbox checked={selected} className="pointer-events-none" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.department || s.branch} • {s.programme} • CGPA: {s.cgpa ?? "N/A"}</p>
                      </div>
                      <Badge variant={s.placement_status === "placed" ? "default" : "outline"} className="text-[9px]">
                        {s.placement_status || "unplaced"}
                      </Badge>
                    </div>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">No students found</div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDriveDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createDriveMutation.mutate(driveForm)}
              disabled={!driveForm.company_id || createDriveMutation.isPending}
            >
              {createDriveMutation.isPending ? "Creating..." : "Create Drive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Company Detail Dialog */}
      <Dialog open={!!viewCompany} onOpenChange={() => setViewCompany(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {viewCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                    {viewCompany.logo_url ? <img src={viewCompany.logo_url} alt="" className="h-full w-full rounded-lg object-cover" /> : viewCompany.name?.charAt(0)}
                  </div>
                  {viewCompany.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {viewCompany.description && <p className="text-muted-foreground">{viewCompany.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground text-xs">Industry</span><p className="font-medium">{viewCompany.industry || "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Status</span><p><Badge variant={viewCompany.is_active ? "default" : "secondary"}>{viewCompany.is_active ? "Active" : "Inactive"}</Badge></p></div>
                  <div><span className="text-muted-foreground text-xs">Package Range</span><p className="font-medium">{viewCompany.package_min || 0}–{viewCompany.package_max || "?"} LPA</p></div>
                  <div><span className="text-muted-foreground text-xs">Website</span>
                    {viewCompany.website ? <a href={viewCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 hover:underline"><ExternalLink className="h-3 w-3" />{new URL(viewCompany.website).hostname}</a> : <p>—</p>}
                  </div>
                </div>
                {viewCompany.locations?.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-xs">Locations</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {viewCompany.locations.map((l: string) => <Badge key={l} variant="outline" className="text-[10px]"><MapPin className="h-2.5 w-2.5 mr-0.5" />{l}</Badge>)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Job Postings ({companyJobs(viewCompany.id).length})</span>
                  </div>
                  {companyJobs(viewCompany.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">No postings yet</p>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {companyJobs(viewCompany.id).map((j: any) => (
                        <div key={j.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs">
                          <span className="font-medium">{j.title}</span>
                          <Badge variant={j.status === "open" ? "default" : "secondary"} className="text-[9px]">{j.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Placement Drives ({companyDrives(viewCompany.id).length})</span>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-primary" onClick={() => { setViewCompany(null); openDriveForCompany(viewCompany.id); }}>
                      <CalendarPlus className="h-3 w-3 mr-1" /> Schedule Drive
                    </Button>
                  </div>
                  {companyDrives(viewCompany.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground mt-1">No drives yet</p>
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {companyDrives(viewCompany.id).map((d: any) => (
                        <div key={d.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs">
                          <span>{d.drive_date ? new Date(d.drive_date).toLocaleDateString() : "TBD"}</span>
                          <div className="flex items-center gap-2">
                            <span>{d.offers_count || 0} offers</span>
                            <Badge variant="outline" className="text-[9px]">{d.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminFaculty;
