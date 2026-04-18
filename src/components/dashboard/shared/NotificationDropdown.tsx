import { Bell, Check, CheckCheck, Trash2, FileCheck, FileX, Clock, Info, AlertTriangle, Megaphone, Plus, Send, Link2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationContext, NotificationType } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import ComposeNotificationModal from "./ComposeNotificationModal";

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  approved: { icon: FileCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  rejected: { icon: FileX, color: "text-destructive", bg: "bg-destructive/10" },
  pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  announcement: { icon: Megaphone, color: "text-violet-500", bg: "bg-violet-500/10" },
};

const canCompose = (role?: string) => ["concern-hod", "school-hod", "daa", "admin"].includes(role || "");

const NotificationDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationContext();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  const showCompose = canCompose(user?.role);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground active:scale-95">
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[360px] p-0 rounded-xl border-border shadow-xl" sideOffset={8}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Compose button for HOD/Admin/DAA */}
              {showCompose && (
                <button
                  onClick={() => { setOpen(false); setComposeOpen(true); }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 active:scale-95"
                  title="Send a notification"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                  <CheckCheck className="h-3 w-3" /> Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <ScrollArea className="max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  const cfg = typeConfig[n.type];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50", !n.read && "bg-primary/[0.03]")}
                    >
                      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm truncate", !n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>
                            {n.title}
                          </p>
                          {n.priority === "urgent" && <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 rounded px-1">URGENT</span>}
                          {n.priority === "critical" && <span className="text-[9px] font-bold text-destructive bg-destructive/10 rounded px-1">CRITICAL</span>}
                          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{n.message}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-[11px] text-muted-foreground/60">
                            {formatDistanceToNow(n.time, { addSuffix: true })}
                          </p>
                          {n.sentBy && <span className="text-[10px] text-muted-foreground/40">• {n.sentBy}</span>}
                        </div>
                      </div>
                      {!n.read && (
                        <div className="mt-1 shrink-0">
                          <Check className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-primary transition-colors" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Compose modal triggered from the + button */}
      <ComposeNotificationModal open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
};

export default NotificationDropdown;
