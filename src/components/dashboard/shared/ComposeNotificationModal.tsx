import { useState, useMemo } from "react";
import { X, Send, Users, User, Building2, GraduationCap, School, Megaphone, AlertTriangle, Info, Search, Check, ChevronDown, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotificationContext, TargetAudience, NotificationType, NotificationPriority, MOCK_SCHOOLS, MOCK_DEPARTMENTS, MOCK_SECTIONS, MOCK_STUDENTS } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ComposeNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const targetOptions: { value: TargetAudience; label: string; icon: typeof Users; description: string }[] = [
  { value: "all", label: "All Students", icon: Users, description: "Send to every student on the platform" },
  { value: "specific-school", label: "Specific School", icon: School, description: "Target students in a particular school" },
  { value: "specific-department", label: "Specific Department", icon: Building2, description: "Target students in a department" },
  { value: "specific-section", label: "Specific Section", icon: GraduationCap, description: "Target a particular class section" },
  { value: "specific-students", label: "Specific Students", icon: User, description: "Hand-pick individual students" },
  { value: "staff", label: "All Staff / HODs", icon: Users, description: "Send to all staff members" },
];

const typeOptions: { value: NotificationType; label: string; color: string }[] = [
  { value: "announcement", label: "Announcement", color: "bg-blue-500" },
  { value: "info", label: "Information", color: "bg-sky-500" },
  { value: "warning", label: "Warning", color: "bg-amber-500" },
  { value: "pending", label: "Action Required", color: "bg-violet-500" },
];

const priorityOptions: { value: NotificationPriority; label: string; color: string }[] = [
  { value: "normal", label: "Normal", color: "text-muted-foreground" },
  { value: "urgent", label: "Urgent", color: "text-amber-500" },
  { value: "critical", label: "Critical", color: "text-destructive" },
];

const getRecipientCount = (target: TargetAudience, selections: string[]): number => {
  if (target === "all") return 1247;
  if (target === "staff") return 86;
  if (target === "specific-students") return selections.length;
  if (target === "specific-section") return selections.length * 45;
  if (target === "specific-department") return selections.length * 342;
  if (target === "specific-school") return selections.length * 580;
  return 0;
};

const ComposeNotificationModal = ({ open, onOpenChange }: ComposeNotificationModalProps) => {
  const { sendNotification } = useNotificationContext();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [attachLink, setAttachLink] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("announcement");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [target, setTarget] = useState<TargetAudience>("all");
  const [selections, setSelections] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const needsSelection = ["specific-school", "specific-department", "specific-section", "specific-students"].includes(target);

  const availableItems = useMemo(() => {
    const items = target === "specific-school" ? MOCK_SCHOOLS
      : target === "specific-department" ? MOCK_DEPARTMENTS
      : target === "specific-section" ? MOCK_SECTIONS
      : target === "specific-students" ? MOCK_STUDENTS.map(s => `${s.name} (${s.regNo})`)
      : [];
    if (!searchQuery) return items;
    return items.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [target, searchQuery]);

  const toggleSelection = (item: string) => {
    setSelections(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const recipientCount = getRecipientCount(target, selections);

  const targetDetailsText = useMemo(() => {
    if (target === "all") return "All Students";
    if (target === "staff") return "All Staff & HODs";
    if (selections.length === 0) return "None selected";
    if (selections.length <= 3) return selections.join(", ");
    return `${selections.slice(0, 2).join(", ")} +${selections.length - 2} more`;
  }, [target, selections]);

  const canSend = title.trim() && message.trim() && (needsSelection ? selections.length > 0 : true);

  const handleSend = () => {
    sendNotification({
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      target,
      targetDetails: targetDetailsText,
      recipientCount,
    });
    toast({
      title: "Notification Sent ✓",
      description: `Sent to ${recipientCount.toLocaleString()} recipient${recipientCount !== 1 ? "s" : ""}.`,
    });
    // Reset
    setTitle(""); setMessage(""); setAttachLink(""); setType("announcement"); setPriority("normal"); setTarget("all"); setSelections([]); setStep(1);
    onOpenChange(false);
  };

  const reset = () => {
    setTitle(""); setMessage(""); setAttachLink(""); setType("announcement"); setPriority("normal"); setTarget("all"); setSelections([]); setSearchQuery(""); setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            Compose Notification
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 py-3 bg-secondary/30 border-b border-border">
          <button onClick={() => setStep(1)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", step === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
            1. Compose
          </button>
          <ChevronDown className="h-3 w-3 text-muted-foreground -rotate-90" />
          <button onClick={() => { if (canSend) setStep(2); }} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors", step === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}>
            2. Review & Send
          </button>
        </div>

        <ScrollArea className="max-h-[60vh]">
          {step === 1 ? (
            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Semester Deadline Reminder"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your notification message..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
                </div>

                {/* Attach Link */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Attach Link <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <input
                    value={attachLink}
                    onChange={(e) => setAttachLink(e.target.value)}
                    placeholder="https://example.com/document"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {typeOptions.map(t => (
                      <button key={t.value} onClick={() => setType(t.value)} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all", type === t.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30")}>
                        <span className={cn("h-2 w-2 rounded-full", t.color)} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Priority</label>
                  <div className="flex flex-wrap gap-1.5">
                    {priorityOptions.map(p => (
                      <button key={p.value} onClick={() => setPriority(p.value)} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all", priority === p.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30")}>
                        {p.value === "critical" && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        {p.value === "urgent" && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        {p.value === "normal" && <Info className="h-3 w-3" />}
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Target Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {targetOptions.map(t => (
                    <button key={t.value} onClick={() => { setTarget(t.value); setSelections([]); setSearchQuery(""); }} className={cn("flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all", target === t.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-secondary/30")}>
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", target === t.value ? "bg-primary/10" : "bg-secondary")}>
                        <t.icon className={cn("h-4 w-4", target === t.value ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-semibold", target === t.value ? "text-foreground" : "text-muted-foreground")}>{t.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection list when needed */}
              {needsSelection && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Select {target === "specific-students" ? "Students" : target === "specific-section" ? "Sections" : target === "specific-department" ? "Departments" : "Schools"}
                    </label>
                    {selections.length > 0 && (
                      <Badge variant="secondary" className="text-[10px]">{selections.length} selected</Badge>
                    )}
                  </div>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {availableItems.map(item => (
                      <button key={item} onClick={() => toggleSelection(item)} className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-secondary/50", selections.includes(item) && "bg-primary/5")}>
                        <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors", selections.includes(item) ? "bg-primary border-primary" : "border-border")}>
                          {selections.includes(item) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className="text-foreground">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Review */
            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-border p-4 space-y-3 bg-secondary/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground">{title}</h4>
                  <Badge variant={priority === "critical" ? "destructive" : priority === "urgent" ? "default" : "secondary"} className="text-[10px]">
                    {priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={cn("h-2 w-2 rounded-full", typeOptions.find(t => t.value === type)?.color)} />
                    {typeOptions.find(t => t.value === type)?.label}
                  </div>
                  <span className="text-border">•</span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {targetDetailsText}
                  </div>
                  <span className="text-border">•</span>
                   <span className="text-[11px] text-muted-foreground">{recipientCount.toLocaleString()} recipients</span>
                   {attachLink.trim() && (
                     <>
                       <span className="text-border">•</span>
                       <a href={attachLink.trim()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                         <Link2 className="h-3 w-3" />
                         Attached Link
                       </a>
                     </>
                   )}
                 </div>
               </div>

              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  This will send a notification to <strong>{recipientCount.toLocaleString()}</strong> recipient{recipientCount !== 1 ? "s" : ""}. This action cannot be undone.
                </p>
              </div>

              <div className="text-[11px] text-muted-foreground">
                Sending as <strong className="text-foreground">{user?.name}</strong> ({user?.role?.replace("-", " ")})
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-secondary/20">
          <button onClick={() => { reset(); onOpenChange(false); }} className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors">
                Back
              </button>
            )}
            {step === 1 ? (
              <button disabled={!canSend} onClick={() => setStep(2)} className={cn("flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all", canSend ? "gradient-primary text-primary-foreground hover:shadow-glow" : "bg-muted text-muted-foreground cursor-not-allowed")}>
                Review
                <ChevronDown className="h-3 w-3 -rotate-90" />
              </button>
            ) : (
              <button onClick={handleSend} className="flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:shadow-glow transition-all active:scale-95">
                <Send className="h-3.5 w-3.5" />
                Send Notification
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComposeNotificationModal;
