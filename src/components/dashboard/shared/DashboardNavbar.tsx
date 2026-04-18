import { Menu, Search, Command } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import NotificationDropdown from "./NotificationDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardNavbarProps {
  onMenuClick?: () => void;
}

const DashboardNavbar = ({ onMenuClick }: DashboardNavbarProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4 md:px-8">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-base font-extrabold font-display tracking-tight text-foreground">
          Place<span className="gradient-text">AI</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {!isMobile && (
          <button className="flex h-9 w-60 items-center gap-2 rounded-xl border border-border bg-background/60 px-4 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-background">
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="flex items-center gap-0.5 shrink-0 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        )}

        <ThemeToggle />
        <NotificationDropdown />

        <div
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 pl-3 border-l border-border cursor-pointer group"
        >
          <div className="relative">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold ring-2 ring-border transition-all duration-200 group-hover:ring-primary/50">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{user?.name || "User"}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{user?.role?.replace("-", " ") || "Student"}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;