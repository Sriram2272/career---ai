import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Briefcase, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const BRANCHES = ["CSE", "ECE", "ME", "CE", "EEE", "IT", "CSE-AI", "CSE-DS", "BBA", "MBA", "B.Com"];

const RecruiterPostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_id: "", title: "", description: "", job_type: "full-time",
    package_lpa: "", min_cgpa: [6], deadline: "",
    max_applications: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [interviewSteps, setInterviewSteps] = useState<string[]>(["Online Assessment", "Technical Interview", "HR Interview"]);
  const [stepInput, setStepInput] = useState("");

  useEffect(() => {
    supabase.from("companies").select("id, name").eq("is_active", true).then(({ data }) => {
      if (data) setCompanies(data);
    });
  }, []);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setInterviewSteps([...interviewSteps, stepInput.trim()]);
      setStepInput("");
    }
  };

  const toggleBranch = (b: string) => {
    setSelectedBranches(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  };

  const handleSubmit = async () => {
    if (!form.company_id || !form.title) {
      toast({ title: "Missing Fields", description: "Company and Job Title are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("job_postings").insert({
      company_id: form.company_id,
      title: form.title,
      description: form.description || null,
      job_type: form.job_type,
      package_lpa: form.package_lpa ? Number(form.package_lpa) : null,
      min_cgpa: form.min_cgpa[0],
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      max_applications: form.max_applications ? Number(form.max_applications) : null,
      skills_required: skills,
      eligible_branches: selectedBranches,
      interview_process: interviewSteps.map((s, i) => ({ step: i + 1, name: s })),
      status: "open",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Job Posted!", description: `${form.title} is now live.` });
      navigate("/dashboard");
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">Post a New Job</h2>
            <p className="text-sm text-muted-foreground">Fill in the details to create a job listing</p>
          </div>
        </div>

        {/* Company & Title */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Company *</Label>
              <Select value={form.company_id} onValueChange={v => setForm({ ...form, company_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                <SelectContent>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Job Title *</Label>
              <Input placeholder="e.g. Software Development Engineer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea placeholder="Job responsibilities, requirements, perks..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} />
          </div>
        </Card>

        {/* Requirements */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground">Requirements & Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Job Type</Label>
              <Select value={form.job_type} onValueChange={v => setForm({ ...form, job_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-Time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="part-time">Part-Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Package (LPA)</Label>
              <Input type="number" placeholder="e.g. 12" value={form.package_lpa} onChange={e => setForm({ ...form, package_lpa: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Max Applications</Label>
              <Input type="number" placeholder="e.g. 100" value={form.max_applications} onChange={e => setForm({ ...form, max_applications: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Min CGPA: {form.min_cgpa[0]}</Label>
            <Slider value={form.min_cgpa} onValueChange={v => setForm({ ...form, min_cgpa: v })} min={0} max={10} step={0.5} className="mt-2" />
          </div>
          <div>
            <Label className="text-xs">Deadline</Label>
            <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </Card>

        {/* Skills */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Skills Required</h3>
          <div className="flex gap-2">
            <Input placeholder="Add a skill (e.g. React)" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} />
            <Button size="sm" variant="outline" onClick={addSkill}><Plus className="h-3 w-3" /></Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 text-xs">
                {s} <X className="h-3 w-3 cursor-pointer" onClick={() => setSkills(skills.filter(x => x !== s))} />
              </Badge>
            ))}
          </div>
        </Card>

        {/* Branches */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Eligible Branches</h3>
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map(b => (
              <Badge key={b} variant={selectedBranches.includes(b) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => toggleBranch(b)}>
                {b}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Interview Process */}
        <Card className="p-5 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Interview Process</h3>
          <div className="space-y-2">
            {interviewSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">{i + 1}</div>
                <span className="flex-1 text-foreground">{step}</span>
                <X className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-destructive" onClick={() => setInterviewSteps(interviewSteps.filter((_, j) => j !== i))} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Add interview round" value={stepInput} onChange={e => setStepInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addStep())} />
            <Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3 w-3" /></Button>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gradient-primary text-primary-foreground px-8">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Briefcase className="h-4 w-4 mr-2" />}
            Post Job
          </Button>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default RecruiterPostJob;
