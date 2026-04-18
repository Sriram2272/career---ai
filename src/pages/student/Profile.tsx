import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Camera, User, GraduationCap, Briefcase, Save, Lock, Mail, Shield, FileText, Plus, X, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [personal, setPersonal] = useState({
    name: "", phone: "", registration_number: "", department: "", school: "", section: "",
    stream: "", branch: "", programme: "", tier: "", address: "",
    parent_name: "", parent_phone: "",
  });

  const [academic, setAcademic] = useState({
    cgpa: "", tenth_percent: "", twelfth_percent: "", backlogs: "0", graduation_year: "",
    aptitude_score: "50", programming_score: "50",
  });

  const [placement, setPlacement] = useState({
    linkedin_url: "", preferred_roles: [] as string[], skills: [] as string[],
  });

  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    if (profile) {
      setPersonal({
        name: profile.name || "", phone: profile.phone || "", registration_number: profile.registration_number || "",
        department: profile.department || "", school: profile.school || "", section: profile.section || "",
        stream: profile.stream || "", branch: profile.branch || "", programme: profile.programme || "",
        tier: profile.tier || "", address: profile.address || "",
        parent_name: profile.parent_name || "", parent_phone: profile.parent_phone || "",
      });
      setAcademic({
        cgpa: profile.cgpa?.toString() || "", tenth_percent: profile.tenth_percent?.toString() || "",
        twelfth_percent: profile.twelfth_percent?.toString() || "", backlogs: profile.backlogs?.toString() || "0",
        graduation_year: profile.graduation_year?.toString() || "",
        aptitude_score: (profile as any).aptitude_score?.toString() || "50",
        programming_score: (profile as any).programming_score?.toString() || "50",
      });
      setPlacement({
        linkedin_url: profile.linkedin_url || "",
        preferred_roles: (profile.preferred_roles as string[]) || [],
        skills: (profile.skills as string[]) || [],
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        ...personal,
        cgpa: academic.cgpa ? parseFloat(academic.cgpa) : null,
        tenth_percent: academic.tenth_percent ? parseFloat(academic.tenth_percent) : null,
        twelfth_percent: academic.twelfth_percent ? parseFloat(academic.twelfth_percent) : null,
        backlogs: academic.backlogs ? parseInt(academic.backlogs) : 0,
        graduation_year: academic.graduation_year ? parseInt(academic.graduation_year) : null,
        aptitude_score: academic.aptitude_score ? parseFloat(academic.aptitude_score) : 50,
        programming_score: academic.programming_score ? parseFloat(academic.programming_score) : 50,
        linkedin_url: placement.linkedin_url || null,
        preferred_roles: placement.preferred_roles,
        skills: placement.skills,
      } as any).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast({ title: "Profile saved", description: "Your information has been updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" }),
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/resume.${ext}`;
    const { error } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
    await supabase.from("profiles").update({ resume_url: urlData.publicUrl }).eq("id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    toast({ title: "Resume uploaded!" });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${user!.id}/avatar.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    toast({ title: "Avatar updated!" });
  };

  const addSkill = () => {
    if (newSkill.trim() && !placement.skills.includes(newSkill.trim())) {
      setPlacement(p => ({ ...p, skills: [...p.skills, newSkill.trim()] }));
      setNewSkill("");
    }
  };

  const addRole = () => {
    if (newRole.trim() && !placement.preferred_roles.includes(newRole.trim())) {
      setPlacement(p => ({ ...p, preferred_roles: [...p.preferred_roles, newRole.trim()] }));
      setNewRole("");
    }
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";

  const Field = ({ label, value, onChange, placeholder, type = "text", disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="bg-secondary/50 border-border/50 focus:border-primary/50 rounded-xl h-10" />
    </div>
  );

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="gradient-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">{user?.name || "User"}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-1">
              <Badge className="text-[10px] font-semibold bg-primary/15 text-primary border-primary/20">
                {user?.role?.replace("-", " ").toUpperCase()}
              </Badge>
              {profile?.placement_status && (
                <Badge variant="outline" className="text-[10px] capitalize">{profile.placement_status}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Resume */}
        <Card className="p-5 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Resume</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.resume_url ? "Resume uploaded ✓" : "No resume uploaded yet"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => resumeInputRef.current?.click()} className="rounded-xl gap-1.5">
              <Upload className="h-3.5 w-3.5" /> {profile?.resume_url ? "Replace" : "Upload"}
            </Button>
            <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-secondary/60 backdrop-blur-sm rounded-xl p-1 h-auto gap-1 flex-wrap">
            <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" /> Personal
            </TabsTrigger>
            <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-xs">
              <GraduationCap className="h-3.5 w-3.5" /> Academic
            </TabsTrigger>
            <TabsTrigger value="placement" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5" /> Placement
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" /> Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="p-6 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" value={personal.name} onChange={v => setPersonal(p => ({ ...p, name: v }))} placeholder="Enter your full name" />
                <Field label="Phone Number" value={personal.phone} onChange={v => setPersonal(p => ({ ...p, phone: v }))} placeholder="+91 98765 43210" />
                <Field label="Registration Number" value={personal.registration_number} onChange={v => setPersonal(p => ({ ...p, registration_number: v }))} placeholder="e.g. 12200001" />
                <Field label="Department" value={personal.department} onChange={v => setPersonal(p => ({ ...p, department: v }))} placeholder="e.g. CSE" />
                <Field label="School" value={personal.school} onChange={v => setPersonal(p => ({ ...p, school: v }))} placeholder="e.g. School of CSE" />
                <Field label="Section" value={personal.section} onChange={v => setPersonal(p => ({ ...p, section: v }))} placeholder="e.g. K22EA" />
                <Field label="Branch" value={personal.branch} onChange={v => setPersonal(p => ({ ...p, branch: v }))} placeholder="e.g. Computer Science" />
                <Field label="Programme" value={personal.programme} onChange={v => setPersonal(p => ({ ...p, programme: v }))} placeholder="e.g. B.Tech CSE" />
                <Field label="Parent Name" value={personal.parent_name} onChange={v => setPersonal(p => ({ ...p, parent_name: v }))} placeholder="Parent's full name" />
                <Field label="Parent Phone" value={personal.parent_phone} onChange={v => setPersonal(p => ({ ...p, parent_phone: v }))} placeholder="+91 98765 43210" />
              </div>
              <div className="mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</Label>
                <Textarea value={personal.address} onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} placeholder="Enter your full address"
                  className="mt-1.5 bg-secondary/50 border-border/50 focus:border-primary/50 rounded-xl" />
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="mt-5 gradient-primary text-primary-foreground rounded-xl gap-2">
                <Save className="h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Profile"}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="academic">
            <Card className="p-6 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="CGPA" value={academic.cgpa} onChange={v => setAcademic(p => ({ ...p, cgpa: v }))} placeholder="e.g. 7.5" type="number" />
                <Field label="10th Percentage" value={academic.tenth_percent} onChange={v => setAcademic(p => ({ ...p, tenth_percent: v }))} placeholder="e.g. 85" type="number" />
                <Field label="12th Percentage" value={academic.twelfth_percent} onChange={v => setAcademic(p => ({ ...p, twelfth_percent: v }))} placeholder="e.g. 78" type="number" />
                <Field label="Backlogs" value={academic.backlogs} onChange={v => setAcademic(p => ({ ...p, backlogs: v }))} placeholder="0" type="number" />
                <Field label="Graduation Year" value={academic.graduation_year} onChange={v => setAcademic(p => ({ ...p, graduation_year: v }))} placeholder="e.g. 2025" type="number" />
                <Field label="Aptitude Score (0-100)" value={academic.aptitude_score} onChange={v => setAcademic(p => ({ ...p, aptitude_score: v }))} placeholder="e.g. 65" type="number" />
                <Field label="Programming Score (0-100)" value={academic.programming_score} onChange={v => setAcademic(p => ({ ...p, programming_score: v }))} placeholder="e.g. 70" type="number" />
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="mt-5 gradient-primary text-primary-foreground rounded-xl gap-2">
                <Save className="h-4 w-4" /> Save Academic Info
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="placement">
            <Card className="p-6 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm space-y-6">
              {/* Skills */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {placement.skills.map(s => (
                    <Badge key={s} variant="secondary" className="gap-1 pr-1">
                      {s}
                      <button onClick={() => setPlacement(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add a skill (e.g. React)"
                    className="bg-secondary/50 border-border/50 rounded-xl h-9 text-sm" onKeyDown={e => e.key === "Enter" && addSkill()} />
                  <Button variant="outline" size="sm" onClick={addSkill} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Preferred Roles */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preferred Roles</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {placement.preferred_roles.map(r => (
                    <Badge key={r} variant="secondary" className="gap-1 pr-1">
                      {r}
                      <button onClick={() => setPlacement(p => ({ ...p, preferred_roles: p.preferred_roles.filter(x => x !== r) }))}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Add a role (e.g. SDE)"
                    className="bg-secondary/50 border-border/50 rounded-xl h-9 text-sm" onKeyDown={e => e.key === "Enter" && addRole()} />
                  <Button variant="outline" size="sm" onClick={addRole} className="rounded-xl"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* LinkedIn */}
              <Field label="LinkedIn URL" value={placement.linkedin_url} onChange={v => setPlacement(p => ({ ...p, linkedin_url: v }))} placeholder="https://linkedin.com/in/yourname" />

              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gradient-primary text-primary-foreground rounded-xl gap-2">
                <Save className="h-4 w-4" /> Save Placement Preferences
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-4">
              <Card className="p-6 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Email Address</h3>
                </div>
                <Field label="Email" value={user?.email || ""} onChange={() => {}} disabled placeholder="your@email.com" />
                <p className="text-xs text-muted-foreground mt-2">Contact admin to change your email.</p>
              </Card>
              <Card className="p-6 rounded-2xl border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Your Role</h3>
                </div>
                <Badge className="text-xs font-semibold bg-primary/15 text-primary border-primary/20">
                  {user?.role?.replace("-", " ").toUpperCase()}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">Roles are managed by administrators.</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default Profile;
