import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import StatsCards from "@/components/dashboard/shared/StatsCards";
import StudentInsights from "@/components/dashboard/student/StudentInsights";
import RecentApplications from "@/components/dashboard/student/RecentApplications";
import PlacementReadiness from "@/components/dashboard/student/PlacementReadiness";
import UpcomingDrives from "@/components/dashboard/student/UpcomingDrives";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getGreeting } from "@/hooks/use-dashboard";
import { Briefcase } from "lucide-react";
import { motion } from "framer-motion";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">{greeting} 👋</p>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground tracking-tight">
            {user?.name?.split(" ")[0] || "Student"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Here's your placement journey at a glance.
          </p>
        </div>
        <button
          onClick={() => navigate("/jobs")}
          className="group flex h-10 w-fit items-center gap-2 rounded-xl gradient-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:shadow-glow hover:scale-[1.03] active:scale-[0.98]"
        >
          <Briefcase className="h-4 w-4 transition-transform group-hover:rotate-6 duration-300" />
          Browse Jobs
        </button>
      </motion.div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          <div className="lg:col-span-2 flex">
            <div className="w-full">
              <PlacementReadiness />
            </div>
          </div>
          <div className="lg:col-span-1 flex">
            <div className="w-full">
              <StatsCards compact />
            </div>
          </div>
        </div>

        <StudentInsights />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RecentApplications />
          <UpcomingDrives />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
