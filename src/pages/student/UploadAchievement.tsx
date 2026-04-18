import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";

// Repurposed: Upload Achievement → redirect to Jobs (achievement system removed)
const UploadAchievement = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Looking for opportunities?</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Browse open positions and apply directly from the Job Board.
        </p>
        <button
          onClick={() => navigate("/jobs")}
          className="mt-4 rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-glow transition-all"
        >
          Browse Job Board
        </button>
      </div>
    </DashboardLayout>
  );
};

export default UploadAchievement;