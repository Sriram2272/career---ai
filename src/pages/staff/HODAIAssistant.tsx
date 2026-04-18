import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { Sparkles } from "lucide-react";

const HODAIAssistant = () => {
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow mb-4">
          <Sparkles className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">AI Placement Assistant</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          AI-powered student search, risk analysis, and placement insights — coming in the next build step.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default HODAIAssistant;