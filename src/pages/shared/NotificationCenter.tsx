import { useState } from "react";
import { Megaphone, Send, Users, Clock, Eye, Search, ChevronDown, ChevronUp, Filter, BarChart3, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationContext, SentNotification, NotificationPriority } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import ComposeNotificationModal from "@/components/dashboard/shared/ComposeNotificationModal";
import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";

const priorityColor: Record<NotificationPriority, string> = {
  normal: "bg-secondary text-muted-foreground",
  urgent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

const NotificationCenter = () => {
  const { sentNotifications } = useNotificationContext();
  const { user } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<"all" | NotificationPriority>("all");

  const filtered = sentNotifications.filter(n => {
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== "all" && n.priority !== filterPriority) return false;
    return true;
  });

  const totalSent = sentNotifications.length;
  const totalRecipients = sentNotifications.reduce((sum, n) => sum + n.recipientCount, 0);
  const totalRead = sentNotifications.reduce((sum, n) => sum + n.readCount, 0);
  const avgReadRate = totalRecipients > 0 ? Math.round((totalRead / totalRecipients) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground tracking-tight">Notification Center</h2>
            <p className="text-sm text-muted-foreground">Compose, send, and track notifications to students and staff.</p>
          </div>
          <button onClick={() => setComposeOpen(true)} className="group flex h-10 w-fit items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:shadow-glow hover:scale-[1.03] active:scale-[0.98]">
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-300" />
            Compose Notification
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Sent", value: totalSent, icon: Send, color: "from-blue-500 to-cyan-500" },
            { label: "Total Recipients", value: totalRecipients.toLocaleString(), icon: Users, color: "from-violet-500 to-purple-500" },
            { label: "Avg Read Rate", value: `${avgReadRate}%`, icon: Eye, color: "from-emerald-500 to-teal-500" },
            { label: "Last Sent", value: sentNotifications[0] ? formatDistanceToNow(sentNotifications[0].sentAt, { addSuffix: true }) : "Never", icon: Clock, color: "from-amber-500 to-orange-500" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search sent notifications..." className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "normal", "urgent", "critical"] as const).map(p => (
              <button key={p} onClick={() => setFilterPriority(p)} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all", filterPriority === p ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30")}>
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sent notifications list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications found.</p>
            </div>
          ) : (
            filtered.map(n => {
              const isExpanded = expandedId === n.id;
              const readRate = n.recipientCount > 0 ? Math.round((n.readCount / n.recipientCount) * 100) : 0;
              return (
                <div key={n.id} className="rounded-2xl border border-border bg-card transition-all hover:shadow-md overflow-hidden">
                  <button onClick={() => setExpandedId(isExpanded ? null : n.id)} className="flex w-full items-center gap-4 p-4 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-foreground truncate">{n.title}</h4>
                        <Badge variant="outline" className={cn("text-[10px] shrink-0", priorityColor[n.priority])}>
                          {n.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{n.targetDetails}</span>
                        <span>•</span>
                        <span>{n.recipientCount.toLocaleString()} recipients</span>
                        <span>•</span>
                        <span>{format(n.sentAt, "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${readRate}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground">{readRate}%</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3 bg-secondary/20 space-y-2">
                      <p className="text-xs text-foreground leading-relaxed">{n.message}</p>
                      <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-muted-foreground">
                        <span>Sent by <strong className="text-foreground">{n.sentBy}</strong> ({n.sentByRole.replace("-", " ")})</span>
                        <span><Eye className="inline h-3 w-3 mr-0.5" />{n.readCount}/{n.recipientCount} read</span>
                        <span><Clock className="inline h-3 w-3 mr-0.5" />{formatDistanceToNow(n.sentAt, { addSuffix: true })}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <ComposeNotificationModal open={composeOpen} onOpenChange={setComposeOpen} />
    </DashboardLayout>
  );
};

export default NotificationCenter;
