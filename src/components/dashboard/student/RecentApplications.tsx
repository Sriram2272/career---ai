import { motion } from "framer-motion";
import { Loader2, FileText, Briefcase } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const statusStyles: Record<string, string> = {
  applied: "bg-status-pending/15 text-status-pending",
  shortlisted: "bg-blue-500/15 text-blue-600",
  interview: "bg-amber-500/15 text-amber-600",
  offered: "bg-status-approved/15 text-status-approved",
  rejected: "bg-status-rejected/15 text-status-rejected",
  withdrawn: "bg-muted text-muted-foreground",
};

const RecentApplications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["recent-applications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, applied_at, ai_match_score, job_posting_id, job_postings(title, company_id, companies(name))")
        .eq("student_id", user!.id)
        .order("applied_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl card-border bg-card p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!applications?.length) {
    return (
      <div className="rounded-2xl card-border bg-card p-8 text-center">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No applications yet</p>
        <button
          onClick={() => navigate("/jobs")}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Briefcase className="h-3 w-3" /> Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.35 }}
      className="rounded-2xl card-border bg-card overflow-hidden card-shadow"
    >
      <div className="p-6 pb-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Applications</h3>
        <p className="mt-1 text-xs text-muted-foreground">Your latest job applications</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="px-6 py-3 font-semibold">Company / Role</th>
              <th className="px-6 py-3 font-semibold hidden sm:table-cell">Match</th>
              <th className="px-6 py-3 font-semibold hidden sm:table-cell">Date</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app: any) => {
              const company = app.job_postings?.companies?.name || "Company";
              const role = app.job_postings?.title || "Role";
              return (
                <tr key={app.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{role}</p>
                    <p className="text-xs text-muted-foreground">{company}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">
                    {app.ai_match_score ? `${Math.round(app.ai_match_score)}%` : "—"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">
                    {format(new Date(app.applied_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[app.status] || "bg-muted text-muted-foreground"}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default RecentApplications;