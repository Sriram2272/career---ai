import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import DashboardSidebar, { SidebarContent } from "./DashboardSidebar";
import DashboardNavbar from "./DashboardNavbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-4 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent mobile onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col md:pl-[70px]">
        <DashboardNavbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
