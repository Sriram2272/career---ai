import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
// Student pages
import Login from "./pages/shared/Login";
import Index from "./pages/student/Index";
import JobBoard from "./pages/student/JobBoard";
import AIRecommendation from "./pages/student/AIRecommendation";
import MockInterview from "./pages/student/MockInterview";
import VideoInterview from "./pages/student/VideoInterview";
import ResumeMatcher from "./pages/student/ResumeMatcher";
import MyApplications from "./pages/student/MyApplications";
import ApplicationTracking from "./pages/student/ApplicationTracking";
import Profile from "./pages/student/Profile";
// Staff pages
import ConcernHOD from "./pages/staff/ConcernHOD";
import SchoolHOD from "./pages/staff/SchoolHOD";
import DAA from "./pages/staff/DAA";
import HODAIAssistant from "./pages/staff/HODAIAssistant";
import HODReviews from "./pages/staff/HODReviews";
import RecruiterPostJob from "./pages/staff/RecruiterPostJob";
import RecruiterApplications from "./pages/staff/RecruiterApplications";
import RecruiterCandidates from "./pages/staff/RecruiterCandidates";
import FacultyReferrals from "./pages/staff/FacultyReferrals";
import AtRiskStudents from "./pages/staff/AtRiskStudents";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFaculty from "./pages/admin/AdminFaculty";
import AdminPTC from "./pages/admin/AdminPTC";
import AdminAIInsights from "./pages/admin/AdminAIInsights";
// Shared pages
import NotificationCenter from "./pages/shared/NotificationCenter";
import NotFound from "./pages/shared/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RoleDashboard = () => {
  const { user } = useAuth();
  switch (user?.role) {
    case "concern-hod": return <ConcernHOD />;
    case "school-hod": return <SchoolHOD />;
    case "daa": return <DAA />;
    case "admin": return <AdminDashboard />;
    default: return <Index />;
  }
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
      {/* Student routes */}
      <Route path="/jobs" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
      <Route path="/resume-matcher" element={<ProtectedRoute><ResumeMatcher /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
      <Route path="/ai-coach" element={<ProtectedRoute><AIRecommendation /></ProtectedRoute>} />
      <Route path="/ai-recommendation" element={<ProtectedRoute><AIRecommendation /></ProtectedRoute>} />
      <Route path="/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
      <Route path="/video-interview" element={<ProtectedRoute><VideoInterview /></ProtectedRoute>} />
      <Route path="/my-applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
      <Route path="/application-tracking" element={<ProtectedRoute><ApplicationTracking /></ProtectedRoute>} />
      {/* Staff routes */}
      <Route path="/concern-hod" element={<ProtectedRoute><ConcernHOD /></ProtectedRoute>} />
      <Route path="/school-hod" element={<ProtectedRoute><SchoolHOD /></ProtectedRoute>} />
      <Route path="/recruiter/post-job" element={<ProtectedRoute><RecruiterPostJob /></ProtectedRoute>} />
      <Route path="/recruiter/applications" element={<ProtectedRoute><RecruiterApplications /></ProtectedRoute>} />
      <Route path="/recruiter/candidates" element={<ProtectedRoute><RecruiterCandidates /></ProtectedRoute>} />
      <Route path="/daa" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/hod-ai" element={<ProtectedRoute><HODAIAssistant /></ProtectedRoute>} />
      <Route path="/hod-reviews" element={<ProtectedRoute><HODReviews /></ProtectedRoute>} />
      <Route path="/at-risk" element={<ProtectedRoute><AtRiskStudents /></ProtectedRoute>} />
      <Route path="/referrals" element={<ProtectedRoute><FacultyReferrals /></ProtectedRoute>} />
      <Route path="/companies" element={<ProtectedRoute><AdminFaculty /></ProtectedRoute>} />
      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><AdminUserManagement /></ProtectedRoute>} />
      <Route path="/admin/ptc" element={<ProtectedRoute><AdminPTC /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute><AdminStaff /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/ai-insights" element={<ProtectedRoute><AdminAIInsights /></ProtectedRoute>} />
      <Route path="/admin/faculty" element={<ProtectedRoute><AdminFaculty /></ProtectedRoute>} />
      {/* Shared */}
      <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;