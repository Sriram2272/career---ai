import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";

// Simplified — kanban pipeline will be built in a future step
const ApplicationTracking = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Application Pipeline</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Visual kanban-style application pipeline coming soon. For now, track your applications from "My Applications".
        </p>
        <button
          onClick={() => navigate("/my-applications")}
          className="mt-4 rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-glow transition-all"
        >
          View My Applications
        </button>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationTracking;