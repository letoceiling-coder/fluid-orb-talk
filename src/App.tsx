import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import AIStudio from "./pages/AIStudio";
import MediaStudio from "./pages/MediaStudio";
import VoiceStudio from "./pages/VoiceStudio";
import DataAnalysis from "./pages/DataAnalysis";
import Agents from "./pages/Agents";
import Tools from "./pages/Tools";
import Datasets from "./pages/Datasets";
import Models from "./pages/Models";
import ApiKeys from "./pages/ApiKeys";
import Usage from "./pages/Usage";
import ApiTokens from "./pages/ApiTokens";
import Storage from "./pages/Storage";
import Logs from "./pages/Logs";
import Monitoring from "./pages/Monitoring";
import GatewayPro from "./pages/GatewayPro";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import VideoAssistant from "./pages/VideoAssistant";
import VoiceAssistantPage from "./pages/VoiceAssistantPage";
import LiveAIMode from "./pages/LiveAIMode";
import MultimodalChat from "./pages/MultimodalChat";
import AICreationCanvas from "./pages/AICreationCanvas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai-studio" element={<AIStudio />} />
            <Route path="/media-studio" element={<MediaStudio />} />
            <Route path="/voice-studio" element={<VoiceStudio />} />
            <Route path="/data-analysis" element={<DataAnalysis />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/models" element={<Models />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/api-tokens" element={<ApiTokens />} />
            <Route path="/storage" element={<Storage />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/gateway-pro" element={<GatewayPro />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/video-assistant" element={<VideoAssistant />} />
            <Route path="/voice-assistant" element={<VoiceAssistantPage />} />
            <Route path="/live-ai" element={<LiveAIMode />} />
            <Route path="/multimodal-chat" element={<MultimodalChat />} />
            <Route path="/ai-canvas" element={<AICreationCanvas />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
