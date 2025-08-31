import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import VoiceAssistantDemo from "./components/VoiceAssistantDemo";
import AIInsightsDemo from "@/pages/AIInsightsDemo";
import FeatureCardDemo from "@/pages/FeatureCardDemo";
import BauhausDemo from "@/pages/BauhausDemo";
import TestBauhaus from "@/pages/TestBauhaus";
import CampaignManagement from "@/components/CampaignManagement";
import ClaireLandingModern from "@/pages/ClaireLandingModern";
import { Auth } from "@/pages/Auth";
import { GlobalLayout } from "@/components/GlobalLayout";
import { AIAssistantProvider } from "@/hooks/useAIAssistant";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AIAssistantProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <Index />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/voice-demo" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <VoiceAssistantDemo />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/AIInsightsDemo" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <AIInsightsDemo />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/feature-cards-demo" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <FeatureCardDemo />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/bauhaus-demo" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <BauhausDemo />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/test-bauhaus" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <TestBauhaus />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/campaign-management" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <CampaignManagement />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/claire" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <ClaireLandingModern />
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              <Route path="/claire-ai" element={
                <ProtectedRoute>
                  <GlobalLayout>
                    <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">CLAIRE AI Dashboard</h2>
                  <p className="text-gray-600">Dashboard component coming soon...</p>
                </div>
                  </GlobalLayout>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AIAssistantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
