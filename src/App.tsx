import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Settings from "./pages/Settings";
import CandidateInterview from "./pages/CandidateInterview";
import Compare from "./pages/Compare";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewerRoom from "./pages/InterviewerRoom";
import VideoTest from "./pages/VideoTest";
import Login from "./pages/Login";
// Signup removed - users come through Stripe checkout
import Onboarding from "./pages/Onboarding";
import CandidateProfile from "./pages/CandidateProfile";
import Analytics from "./pages/Analytics";
import CandidateFeedback from "./pages/CandidateFeedback";
import NotFound from "./pages/NotFound";
import "@livekit/components-styles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/interview/:token" element={<CandidateInterview />} />
              <Route path="/feedback/:token" element={<CandidateFeedback />} />
              <Route path="/video-test" element={<VideoTest />} />

              {/* Protected routes */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
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
  </QueryClientProvider>
);

export default App;
