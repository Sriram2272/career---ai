import { Home, Briefcase, FileText, Sparkles, Mic, Video, ClipboardList, Plus, LogOut, Users, BarChart3, GraduationCap, UserCog, Megaphone, Settings, AlertTriangle, Building2, ScanSearch, Zap, Search, UserPlus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";

const studentNav = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Job Board", path: "/jobs" },
  { icon: ScanSearch, label: "Resume Matcher", path: "/resume-matcher" },
  { icon: FileText, label: "My Applications", path: "/my-applications" },
  { icon: Sparkles, label: "AI Career Coach", path: "/ai-coach" },
  { icon: Video, label: "Video Interview", path: "/video-interview" },
];

const getNavItems = (role: string) => {
  if (role === "student") return studentNav;
  if (role === "concern-hod") return [
    { icon: Home, label: "TPC Dashboard", path: "/concern-hod" },
    { icon: AlertTriangle, label: "At-Risk Students", path: "/at-risk" },
    
    { icon: UserPlus, label: "Referrals", path: "/referrals" },
    { icon: Megaphone, label: "Notifications", path: "/notifications" },
    { icon: Sparkles, label: "AI Assistant", path: "/hod-ai" },
  ];
  if (role === "school-hod") return [
    { icon: Home, label: "Dashboard", path: "/school-hod" },
    { icon: Users, label: "Candidates", path: "/recruiter/candidates" },
    { icon: ClipboardList, label: "Post Job", path: "/recruiter/post-job" },
    { icon: Briefcase, label: "Applications", path: "/recruiter/applications" },
    { icon: UserPlus, label: "Referrals", path: "/referrals" },
    { icon: Megaphone, label: "Notifications", path: "/notifications" },
  ];
  if (role === "admin") return [
    { icon: Home, label: "Dashboard", path: "/admin" },
    { icon: GraduationCap, label: "Students", path: "/admin/students" },
    { icon: UserCog, label: "Staff", path: "/admin/staff" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Building2, label: "Companies", path: "/companies" },
    { icon: UserPlus, label: "Referrals", path: "/referrals" },
    { icon: Zap, label: "PTC", path: "/admin/ptc" },
    { icon: Sparkles, label: "AI Insights", path: "/admin/ai-insights" },
    { icon: Megaphone, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];
  // daa = Placement Director — same as admin minus Settings
  return [
    { icon: Home, label: "Dashboard", path: "/daa" },
    { icon: GraduationCap, label: "Students", path: "/admin/students" },
    { icon: UserCog, label: "Staff", path: "/admin/staff" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Building2, label: "Companies", path: "/companies" },
    { icon: UserPlus, label: "Referrals", path: "/referrals" },
    { icon: Zap, label: "PTC", path: "/admin/ptc" },
    { icon: Sparkles, label: "AI Insights", path: "/admin/ai-insights" },
    { icon: Megaphone, label: "Notifications", path: "/notifications" },
  ];
};

export { getNavItems };

interface SidebarContentProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export const SidebarContent = ({ mobile = false, onNavigate }: SidebarContentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user?.role || "student";
  const navItems = getNavItems(role);

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    onNavigate?.();
  };

  if (mobile) {
    return (
      <div className="flex h-full flex-col">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">PA</div>
          <span className="text-lg font-extrabold font-display text-foreground">Place<span className="gradient-text">AI</span></span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden md:flex h-screen w-[70px] flex-col items-center border-r border-border bg-sidebar/80 backdrop-blur-xl py-6">
      <div className="mb-8 flex h-10 w-10 items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110" onClick={() => navigate("/dashboard")}>
        <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">PA</div>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <Tooltip key={item.label} delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(item.path)}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                  location.pathname === item.path
                    ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:scale-105"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {location.pathname === item.path && (
                  <span className="absolute -left-[1px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-card text-foreground border-border shadow-lg">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            onClick={handleLogout}
            className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:scale-105"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-card text-foreground border-border shadow-lg">
          Logout
        </TooltipContent>
      </Tooltip>
    </aside>
  );
};

const DashboardSidebar = () => {
  return <SidebarContent />;
};

export default DashboardSidebar;