import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/convex";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import { FieldReport } from "./pages/FieldReport";
import Settings from "./pages/Settings";
import CandidateInterview from "./pages/CandidateInterview";
import Compare from "./pages/Compare";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewerRoom from "./pages/InterviewerRoom";
import VideoTest from "./pages/VideoTest";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import CandidateProfile from "./pages/CandidateProfile";
import Analytics from "./pages/Analytics";
import CandidateFeedback from "./pages/CandidateFeedback";
import DemoRequest from "./pages/DemoRequest";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import PublicReport from "./pages/PublicReport";
import PublicBrief from "./pages/PublicBrief";
import JoanPipeline from "./pages/JoanPipeline";
import JoanDemo from "./pages/JoanDemo";
import JoanCandidateDetail from "./pages/JoanCandidateDetail";
import QuestionBank from "./pages/QuestionBank";
import JoanCompare from "./pages/JoanCompare";
import JoanOrbit from "./pages/JoanOrbit";
import JoanDashboard from "./pages/JoanDashboard";
import JoanDigest from "./pages/JoanDigest";
import AsyncInterview from "./pages/AsyncInterview";
import "@livekit/components-styles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConvexProvider client={convex}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/interview/:token" element={<CandidateInterview />} />
              <Route path="/async-interview/:token" element={<AsyncInterview />} />
              <Route path="/feedback/:token" element={<CandidateFeedback />} />
              <Route path="/demo" element={<DemoRequest />} />
              <Route path="/video-test" element={<VideoTest />} />
              <Route path="/r/:token" element={<PublicReport />} />
              <Route path="/brief/:token" element={<PublicBrief />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* Joan hackathon demo routes - public for judges */}
              <Route path="/joan-pipeline" element={<JoanPipeline />} />
              <Route path="/joan-candidate/:id" element={<JoanCandidateDetail />} />
              <Route path="/joan-demo" element={<JoanDemo />} />
              <Route path="/question-bank" element={<QuestionBank />} />
              <Route path="/joan-compare" element={<JoanCompare />} />
              <Route path="/joan-orbit" element={<JoanOrbit />} />
              <Route path="/joan-dashboard" element={<JoanDashboard />} />
              <Route path="/joan-digest" element={<JoanDigest />} />

              {/* Protected routes */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
              <Route path="/field-report/:id" element={<ProtectedRoute><FieldReport /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/candidates/:id" element={<ProtectedRoute><CandidateProfile /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
              <Route path="/room/:id" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
              <Route path="/interviewer/:id" element={<ProtectedRoute><InterviewerRoom /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
    </ConvexProvider>
  </QueryClientProvider>
);

export default App;
