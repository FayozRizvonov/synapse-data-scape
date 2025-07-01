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
import { GlobalLayout } from "@/components/GlobalLayout";
import { AIAssistantProvider } from "@/hooks/useAIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AIAssistantProvider>
        <Toaster />
        <Sonner />
        <GlobalLayout>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/voice-demo" element={<VoiceAssistantDemo />} />
              <Route path="/AIInsightsDemo" element={<AIInsightsDemo />} />
              <Route path="/feature-cards-demo" element={<FeatureCardDemo />} />
              <Route path="/bauhaus-demo" element={<BauhausDemo />} />
              <Route path="/test-bauhaus" element={<TestBauhaus />} />
              <Route path="/campaign-management" element={<CampaignManagement />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </GlobalLayout>
      </AIAssistantProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
