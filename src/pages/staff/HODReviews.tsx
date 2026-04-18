import DashboardLayout from "@/components/dashboard/shared/DashboardLayout";
import { motion } from "framer-motion";

const HODReviews = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-foreground">Student Management</h2>
        <p className="mt-1 text-sm text-muted-foreground">View and manage student placement activities</p>
        <div className="mt-8 rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">Student management with placement tracking coming in the next build step.</p>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default HODReviews;