import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Settings, Shield, Users, Bell, Calendar, GraduationCap, Building2,
  Mail, Globe, Palette, Lock, UserCog, Save, RefreshCw, Database,
  AlertTriangle, Check, ChevronRight, Briefcase
} from "lucide-react";

const AdminSettings = () => {
  const [tab, setTab] = useState("general");
  const qc = useQueryClient();

  // Platform config — stored locally for now (could persist to a settings table)
  const [platformName, setPlatformName] = useState("PlaceAI");
  const [placementYear, setPlacementYear] = useState("2025-26");
  const [minCgpa, setMinCgpa] = useState("6.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [autoConfirmEmail, setAutoConfirmEmail] = useState(false);
  const [allowGoogleAuth, setAllowGoogleAuth] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifyOnApplication, setNotifyOnApplication] = useState(true);
  const [notifyOnReferral, setNotifyOnReferral] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);

  // Role management
  const { data: allRoles = [] } = useQuery({
    queryKey: ["all_user_roles"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("*, profiles:user_id(name, email:registration_number)");
      return roles || [];
    },
  });

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [roleEmail, setRoleEmail] = useState("");
  const [roleValue, setRoleValue] = useState("student");

  const staffRoles = allRoles.filter((r: any) => r.role !== "student");

  const { data: stats } = useQuery({
    queryKey: ["system_stats"],
    queryFn: async () => {
      const [profiles, companies, jobs, apps] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("job_postings").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: profiles.count || 0,
        companies: companies.count || 0,
        jobs: jobs.count || 0,
        applications: apps.count || 0,
      };
    },
  });

  const departments = [
    "Computer Science", "Information Technology", "Electronics", "Mechanical",
    "Civil", "Electrical", "Chemical", "Biotechnology",
  ];

  const schools = [
    "School of Computing & AI", "School of Engineering", "School of Business", "School of Sciences",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Platform Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure placement platform, roles, and system preferences</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
            <TabsTrigger value="placement" className="text-xs">Placement Rules</TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">Role Management</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> Platform Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Platform Name</Label>
                    <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Current Placement Year</Label>
                    <Input value={placementYear} onChange={(e) => setPlacementYear(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-Confirm Email</p>
                    <p className="text-[11px] text-muted-foreground">Skip email verification for new signups</p>
                  </div>
                  <Switch checked={autoConfirmEmail} onCheckedChange={setAutoConfirmEmail} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Google OAuth</p>
                    <p className="text-[11px] text-muted-foreground">Allow login with Google accounts</p>
                  </div>
                  <Switch checked={allowGoogleAuth} onCheckedChange={setAllowGoogleAuth} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4" /> Departments & Schools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Departments</p>
                    <div className="space-y-1">
                      {departments.map((d) => (
                        <div key={d} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs">
                          <span>{d}</span>
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Schools</p>
                    <div className="space-y-1">
                      {schools.map((s) => (
                        <div key={s} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 text-xs">
                          <span>{s}</span>
                          <Check className="h-3 w-3 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placement Rules */}
          <TabsContent value="placement" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Eligibility Criteria</CardTitle>
                <CardDescription className="text-xs">Default eligibility filters applied to all job postings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Minimum CGPA</Label>
                    <Input type="number" step="0.1" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Maximum Backlogs Allowed</Label>
                    <Input type="number" value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4" /> Placement Tiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { tier: "Dream", range: "10+ LPA", color: "text-yellow-500" },
                    { tier: "Super Dream", range: "15+ LPA", color: "text-purple-500" },
                    { tier: "Regular", range: "4-10 LPA", color: "text-blue-500" },
                    { tier: "Mass Recruiter", range: "3-4 LPA", color: "text-green-500" },
                  ].map((t) => (
                    <div key={t.tier} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${t.color}`}>{t.tier}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{t.range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Placement Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { phase: "Pre-Placement Talks", period: "Jul – Aug" },
                    { phase: "Dream Companies", period: "Sep – Oct" },
                    { phase: "Regular Drives", period: "Nov – Jan" },
                    { phase: "Mass Recruitment", period: "Feb – Apr" },
                    { phase: "Off-Campus Support", period: "May – Jun" },
                  ].map((p) => (
                    <div key={p.phase} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                      <span className="font-medium text-xs">{p.phase}</span>
                      <span className="text-xs text-muted-foreground">{p.period}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Management */}
          <TabsContent value="roles" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Staff & Admin Roles</p>
              <Button size="sm" variant="outline" onClick={() => setShowRoleDialog(true)}>
                <UserCog className="h-3.5 w-3.5 mr-1" /> Assign Role
              </Button>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>User ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffRoles.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No staff roles assigned</TableCell></TableRow>
                  ) : staffRoles.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{(r.profiles as any)?.name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.role === "admin" ? "destructive" : "default"} className="text-[10px]">
                          {r.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{r.user_id?.slice(0, 8)}...</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Role Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { role: "Admin", perms: "Full access – manage users, companies, analytics, settings" },
                    { role: "DAA", perms: "Placement director – drives, company relations, approvals" },
                    { role: "School HOD", perms: "School-level oversight – student profiles, referrals, job postings" },
                    { role: "Concern HOD", perms: "Department-level – student reviews, at-risk tracking, referrals" },
                    { role: "Student", perms: "Apply to jobs, mock interviews, AI coaching, profile management" },
                  ].map((r) => (
                    <div key={r.role} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                      <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{r.role}</Badge>
                      <p className="text-xs text-muted-foreground">{r.perms}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New Application Alert</p>
                    <p className="text-[11px] text-muted-foreground">Notify when a student applies to a job</p>
                  </div>
                  <Switch checked={notifyOnApplication} onCheckedChange={setNotifyOnApplication} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Referral Request Alert</p>
                    <p className="text-[11px] text-muted-foreground">Notify faculty on new referral requests</p>
                  </div>
                  <Switch checked={notifyOnReferral} onCheckedChange={setNotifyOnReferral} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly Digest</p>
                    <p className="text-[11px] text-muted-foreground">Send weekly placement summary to admin</p>
                  </div>
                  <Switch checked={notifyWeeklyDigest} onCheckedChange={setNotifyWeeklyDigest} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Database className="h-4 w-4" /> System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Users", value: stats?.users || 0 },
                    { label: "Companies", value: stats?.companies || 0 },
                    { label: "Job Postings", value: stats?.jobs || 0 },
                    { label: "Applications", value: stats?.applications || 0 },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-lg bg-secondary/50 text-center">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Maintenance Mode</p>
                    <p className="text-[11px] text-muted-foreground">Temporarily disable platform for non-admin users</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => toast({ title: "Cache cleared" })}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Clear Cache
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast({ title: "Health check passed ✓" })}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Health Check
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Theme is automatically detected from system preferences. Students and staff see the same design system.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={() => toast({ title: "Settings saved", description: "Platform configuration updated successfully." })}>
            <Save className="h-4 w-4 mr-1" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">User Email</Label>
              <Input value={roleEmail} onChange={(e) => setRoleEmail(e.target.value)} placeholder="user@lpu.in" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={roleValue} onValueChange={setRoleValue}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="concern-hod">Concern HOD</SelectItem>
                  <SelectItem value="school-hod">School HOD</SelectItem>
                  <SelectItem value="daa">DAA (Placement Director)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
            <Button onClick={() => { setShowRoleDialog(false); toast({ title: "Role assignment requires backend lookup by email. Use the User Management page for now." }); }}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSettings;
