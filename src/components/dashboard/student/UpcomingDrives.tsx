import { motion } from "framer-motion";
import { Calendar, Building2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter } from "date-fns";

const UpcomingDrives = () => {
  const { data: drives, isLoading } = useQuery({
    queryKey: ["upcoming-drives"],
    queryFn: async () => {
      const { data: postings } = await supabase
        .from("job_postings")
        .select("id, title, deadline, package_lpa, company_id, companies(name)")
        .eq("status", "open")
        .order("deadline", { ascending: true })
        .limit(5);

      return (postings || []).filter((p: any) => p.deadline && isAfter(new Date(p.deadline), new Date()));
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl card-border bg-card p-6 flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl card-border bg-card p-6 card-shadow"
    >
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" /> Upcoming Deadlines
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">Don't miss these opportunities</p>
      <div className="mt-4 space-y-3">
        {(drives || []).slice(0, 5).map((drive: any, i: number) => {
          const daysLeft = Math.ceil((new Date(drive.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return (
            <motion.div
              key={drive.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
              className="flex items-center gap-3 rounded-xl bg-background px-4 py-3 transition-all hover:bg-secondary/50"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{drive.companies?.name} — {drive.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {drive.package_lpa ? `${drive.package_lpa} LPA` : ""} · {format(new Date(drive.deadline), "MMM d")}
                </p>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                daysLeft <= 3 ? "bg-destructive/15 text-destructive" : daysLeft <= 7 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"
              }`}>
                {daysLeft}d left
              </span>
            </motion.div>
          );
        })}
        {(!drives || drives.length === 0) && (
          <p className="text-xs text-muted-foreground text-center py-4">No upcoming deadlines</p>
        )}
      </div>
    </motion.div>
  );
};

export default UpcomingDrives;
