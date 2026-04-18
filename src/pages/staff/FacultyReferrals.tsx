import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  UserPlus, CheckCircle, XCircle, Clock, Search,
  User, Briefcase, Building2, ThumbsUp, ThumbsDown, Forward, Loader2
} from "lucide-react";

// ── Helpers ──
const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  declined: "bg-destructive/15 text-destructive border-destructive/20",
  forwarded: "bg-blue-500/15 text-blue-600 border-blue-500/20",
};
const statusIcons: Record<string, typeof Clock> = {
  pending: Clock, approved: CheckCircle, declined: XCircle, forwarded: Forward,
};

// ── Referral Card ──
const ReferralCard = ({ referral, student, job, faculty, forwardedTo, onClick, index }: any) => {
  const StatusIcon = statusIcons[referral.status] || Clock;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 text-xs font-bold text-primary-foreground">
            {(student?.name || "S").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate">{student?.name || "Student"}</p>
              <Badge variant="outline" className={`text-[10px] h-5 ${statusColors[referral.status]}`}>
                <StatusIcon className="h-2.5 w-2.5 mr-1" />{referral.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job?.title || "Job"}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job?.companies?.name || "Company"}</span>
              {faculty && <span>To: {faculty.name}</span>}
              {referral.status === "forwarded" && forwardedTo && (
                <span className="text-blue-600">→ Fwd to: {forwardedTo.name}</span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground shrink-0">
            {new Date(referral.requested_at).toLocaleDateString()}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ── Main Component ──
const FacultyReferrals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [forwardRemarks, setForwardRemarks] = useState("");
  const [showForward, setShowForward] = useState(false);

  // Fetch referrals
  const { data: referrals, isLoading } = useQuery({
    queryKey: ["faculty-referrals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch related data
  const studentIds = useMemo(() => [...new Set((referrals || []).map(r => r.student_id))], [referrals]);
  const facultyIds = useMemo(() => {
    const ids = new Set<string>();
    (referrals || []).forEach(r => {
      ids.add(r.faculty_id);
      if (r.forwarded_to) ids.add(r.forwarded_to);
      if (r.forwarded_by) ids.add(r.forwarded_by);
    });
    return [...ids];
  }, [referrals]);
  const jobIds = useMemo(() => [...new Set((referrals || []).map(r => r.job_posting_id))], [referrals]);

  const { data: students } = useQuery({
    queryKey: ["referral-students", studentIds],
    queryFn: async () => {
      if (!studentIds.length) return {};
      const { data } = await supabase.from("profiles").select("id, name, department, branch, cgpa, registration_number, avatar_url, skills").in("id", studentIds);
      const map: Record<string, any> = {};
      (data || []).forEach(s => { map[s.id] = s; });
      return map;
    },
    enabled: studentIds.length > 0,
  });

  const { data: facultyMap } = useQuery({
    queryKey: ["referral-faculty", facultyIds],
    queryFn: async () => {
      if (!facultyIds.length) return {};
      const { data } = await supabase.from("profiles").select("id, name, faculty_uid, department").in("id", facultyIds);
      const map: Record<string, any> = {};
      (data || []).forEach(f => { map[f.id] = f; });
      return map;
    },
    enabled: facultyIds.length > 0,
  });

  const { data: jobsMap } = useQuery({
    queryKey: ["referral-jobs", jobIds],
    queryFn: async () => {
      if (!jobIds.length) return {};
      const { data } = await supabase.from("job_postings").select("id, title, companies(name)").in("id", jobIds);
      const map: Record<string, any> = {};
      (data || []).forEach(j => { map[j.id] = j; });
      return map;
    },
    enabled: jobIds.length > 0,
  });

  // All faculty for forward dropdown
  const { data: allFaculty } = useQuery({
    queryKey: ["all-faculty-for-forward"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, name, faculty_uid, department").not("faculty_uid", "is", null);
      return (data || []).filter(f => f.id !== user?.id);
    },
    enabled: !!user?.id,
  });

  // Respond mutation
  const respondMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("referrals").update({
        status,
        faculty_remarks: remarks || null,
        responded_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["faculty-referrals"] });
      setSelectedReferral(null);
      setRemarks("");
      toast({ title: status === "approved" ? "Referral Approved ✅" : "Referral Declined", description: "The student has been notified." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update referral.", variant: "destructive" }),
  });

  // Forward mutation
  const forwardMutation = useMutation({
    mutationFn: async ({ id, forwardToId }: { id: string; forwardToId: string }) => {
      const { error } = await supabase.from("referrals").update({
        status: "forwarded",
        forwarded_to: forwardToId,
        forwarded_by: user?.id,
        forwarded_at: new Date().toISOString(),
        forward_remarks: forwardRemarks || null,
        faculty_remarks: remarks || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-referrals"] });
      setSelectedReferral(null);
      setRemarks("");
      setForwardTo("");
      setForwardRemarks("");
      setShowForward(false);
      toast({ title: "Referral Forwarded ✅", description: "The referral has been forwarded with your remarks." });
    },
    onError: () => toast({ title: "Error", description: "Failed to forward referral.", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (!referrals) return [];
    return referrals.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const student = students?.[r.student_id];
        const job = jobsMap?.[r.job_posting_id];
        if (!student?.name?.toLowerCase().includes(q) && !job?.title?.toLowerCase().includes(q) && !job?.companies?.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [referrals, statusFilter, search, students, jobsMap]);

  const stats = useMemo(() => ({
    total: referrals?.length || 0,
    pending: referrals?.filter(r => r.status === "pending").length || 0,
    approved: referrals?.filter(r => r.status === "approved").length || 0,
    declined: referrals?.filter(r => r.status === "declined").length || 0,
    forwarded: referrals?.filter(r => r.status === "forwarded").length || 0,
  }), [referrals]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div>
          <h1 className="text-xl font-bold font-display text-foreground">Referral Requests</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage, approve, decline, or forward student referral requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: stats.total, icon: UserPlus, color: "bg-primary/10 text-primary" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "bg-amber-500/10 text-amber-600" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600" },
            { label: "Declined", value: stats.declined, icon: XCircle, color: "bg-destructive/10 text-destructive" },
            { label: "Forwarded", value: stats.forwarded, icon: Forward, color: "bg-blue-500/10 text-blue-600" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student or job..." className="pl-9 rounded-xl bg-secondary/50 border-border/50 h-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "declined", "forwarded"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No referral requests found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((r, i) => (
                <ReferralCard
                  key={r.id}
                  referral={r}
                  student={students?.[r.student_id]}
                  job={jobsMap?.[r.job_posting_id]}
                  faculty={facultyMap?.[r.faculty_id]}
                  forwardedTo={r.forwarded_to ? facultyMap?.[r.forwarded_to] : null}
                  onClick={() => { setSelectedReferral(r); setRemarks(r.faculty_remarks || ""); setShowForward(false); }}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedReferral} onOpenChange={() => { setSelectedReferral(null); setShowForward(false); }}>
        <DialogContent className="max-w-md">
          {selectedReferral && (() => {
            const student = students?.[selectedReferral.student_id];
            const job = jobsMap?.[selectedReferral.job_posting_id];
            const faculty = facultyMap?.[selectedReferral.faculty_id];
            const isPending = selectedReferral.status === "pending";
            const isMine = selectedReferral.faculty_id === user?.id;

            return (
              <>
                <DialogHeader>
                  <DialogTitle>Referral Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                  {/* Student Info */}
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {(student?.name || "S").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{student?.name}</p>
                        <p className="text-[11px] text-muted-foreground">{student?.registration_number} • {student?.department} • CGPA: {student?.cgpa}</p>
                      </div>
                    </div>
                    {student?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {student.skills.slice(0, 6).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Job */}
                  <div className="rounded-xl bg-secondary/50 p-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Details</p>
                    <p className="text-sm font-medium">{job?.title}</p>
                    <p className="text-xs text-muted-foreground">{job?.companies?.name}</p>
                  </div>

                  {/* Referred To */}
                  <div className="rounded-xl bg-secondary/50 p-4 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referred To</p>
                    <p className="text-sm font-medium">{faculty?.name} <span className="text-muted-foreground">(UID: {faculty?.faculty_uid})</span></p>
                    <p className="text-xs text-muted-foreground">{faculty?.department}</p>
                  </div>

                  {/* Forwarding info if forwarded */}
                  {selectedReferral.status === "forwarded" && selectedReferral.forwarded_to && (
                    <div className="rounded-xl bg-blue-500/10 p-4 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Forwarded To</p>
                      <p className="text-sm font-medium text-foreground">
                        {facultyMap?.[selectedReferral.forwarded_to]?.name || "Faculty"}
                        {facultyMap?.[selectedReferral.forwarded_to]?.faculty_uid && (
                          <span className="text-muted-foreground"> (UID: {facultyMap[selectedReferral.forwarded_to].faculty_uid})</span>
                        )}
                      </p>
                      {selectedReferral.forward_remarks && (
                        <p className="text-xs text-muted-foreground mt-1">Remarks: {selectedReferral.forward_remarks}</p>
                      )}
                    </div>
                  )}

                  {/* Student's Message */}
                  {selectedReferral.message && (
                    <div className="rounded-xl bg-secondary/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Student's Message</p>
                      <p className="text-sm text-foreground">{selectedReferral.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {isPending && isMine ? (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add your remarks (optional)..." className="rounded-xl bg-secondary/50 border-border/50" rows={3} />
                      
                      {/* Forward Section */}
                      {showForward ? (
                        <div className="space-y-3 rounded-xl bg-blue-500/5 p-3 border border-blue-500/20">
                          <p className="text-xs font-semibold text-blue-600 flex items-center gap-1"><Forward className="h-3 w-3" /> Forward to another faculty</p>
                          <Select value={forwardTo} onValueChange={setForwardTo}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select faculty..." /></SelectTrigger>
                            <SelectContent>
                              {(allFaculty || []).map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.name} (UID: {f.faculty_uid}) — {f.department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea value={forwardRemarks} onChange={e => setForwardRemarks(e.target.value)} placeholder="Forward remarks..." className="rounded-xl bg-secondary/50" rows={2} />
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-primary-foreground rounded-xl gap-2"
                              disabled={!forwardTo || forwardMutation.isPending}
                              onClick={() => forwardMutation.mutate({ id: selectedReferral.id, forwardToId: forwardTo })}
                            >
                              {forwardMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Forward className="h-4 w-4" />}
                              Forward
                            </Button>
                            <Button variant="ghost" className="rounded-xl" onClick={() => setShowForward(false)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button className="flex-1 gradient-primary text-primary-foreground rounded-xl gap-2" disabled={respondMutation.isPending}
                            onClick={() => respondMutation.mutate({ id: selectedReferral.id, status: "approved" })}>
                            <ThumbsUp className="h-4 w-4" /> Approve
                          </Button>
                          <Button variant="outline" className="flex-1 rounded-xl gap-2 text-destructive hover:bg-destructive/10" disabled={respondMutation.isPending}
                            onClick={() => respondMutation.mutate({ id: selectedReferral.id, status: "declined" })}>
                            <ThumbsDown className="h-4 w-4" /> Decline
                          </Button>
                          <Button variant="outline" className="rounded-xl gap-1 text-blue-600 hover:bg-blue-500/10 border-blue-500/20"
                            onClick={() => setShowForward(true)}>
                            <Forward className="h-4 w-4" /> Forward
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`rounded-xl p-4 text-center ${statusColors[selectedReferral.status]}`}>
                      <p className="text-sm font-medium capitalize">{selectedReferral.status}</p>
                      {selectedReferral.faculty_remarks && <p className="text-xs mt-1">{selectedReferral.faculty_remarks}</p>}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FacultyReferrals;
