import { lazy, Suspense } from "react";
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
import "@livekit/components-styles";

const Pricing = lazy(() => import("./pages/Pricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Report = lazy(() => import("./pages/Report"));
const FieldReport = lazy(() => import("./pages/FieldReport").then(m => ({ default: m.FieldReport })));
const Settings = lazy(() => import("./pages/Settings"));
const CandidateInterview = lazy(() => import("./pages/CandidateInterview"));
const Compare = lazy(() => import("./pages/Compare"));
const InterviewRoom = lazy(() => import("./pages/InterviewRoom"));
const InterviewerRoom = lazy(() => import("./pages/InterviewerRoom"));
const VideoTest = lazy(() => import("./pages/VideoTest"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CandidateProfile = lazy(() => import("./pages/CandidateProfile"));
const Analytics = lazy(() => import("./pages/Analytics"));
const CandidateFeedback = lazy(() => import("./pages/CandidateFeedback"));
const DemoRequest = lazy(() => import("./pages/DemoRequest"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PublicReport = lazy(() => import("./pages/PublicReport"));
const PublicBrief = lazy(() => import("./pages/PublicBrief"));
const JoanPipeline = lazy(() => import("./pages/JoanPipeline"));
const JoanDemo = lazy(() => import("./pages/JoanDemo"));
const JoanCandidateDetail = lazy(() => import("./pages/JoanCandidateDetail"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const JoanCompare = lazy(() => import("./pages/JoanCompare"));
const JoanOrbit = lazy(() => import("./pages/JoanOrbit"));
const JoanDashboard = lazy(() => import("./pages/JoanDashboard"));
const JoanDigest = lazy(() => import("./pages/JoanDigest"));
const AsyncInterview = lazy(() => import("./pages/AsyncInterview"));

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ConvexProvider client={convex}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
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

              {/* Joan routes - protected */}
              <Route path="/joan-pipeline" element={<ProtectedRoute><JoanPipeline /></ProtectedRoute>} />
              <Route path="/joan-candidate/:id" element={<ProtectedRoute><JoanCandidateDetail /></ProtectedRoute>} />
              <Route path="/joan-demo" element={<ProtectedRoute><JoanDemo /></ProtectedRoute>} />
              <Route path="/question-bank" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
              <Route path="/joan-compare" element={<ProtectedRoute><JoanCompare /></ProtectedRoute>} />
              <Route path="/joan-orbit" element={<ProtectedRoute><JoanOrbit /></ProtectedRoute>} />
              <Route path="/joan-dashboard" element={<ProtectedRoute><JoanDashboard /></ProtectedRoute>} />
              <Route path="/joan-digest" element={<ProtectedRoute><JoanDigest /></ProtectedRoute>} />

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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
    </ConvexProvider>
  </QueryClientProvider>
);

export default App;
