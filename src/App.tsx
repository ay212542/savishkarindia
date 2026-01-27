import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Leadership from "./pages/Leadership";
import Programs from "./pages/Programs";
import Join from "./pages/Join";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import IDCard from "./pages/IDCard";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Approvals from "./pages/admin/Approvals";
import MemberRegistry from "./pages/admin/MemberRegistry";
import ProgramsManager from "./pages/admin/ProgramsManager";
import Announcements from "./pages/admin/Announcements";
import CMSEditor from "./pages/admin/CMSEditor";
import AIPanel from "./pages/admin/AIPanel";
import ChatHistory from "./pages/admin/ChatHistory";
import Settings from "./pages/admin/Settings";
import LeadershipManager from "./pages/admin/LeadershipManager";
import ProfileEditor from "./pages/admin/ProfileEditor";
import DistrictManager from "./pages/admin/DistrictManager";
import BrochureManager from "./pages/admin/BrochureManager";
import StateDashboard from "./pages/admin/StateDashboard";
import ReportsManager from "./pages/admin/ReportsManager";
import DocumentsManager from "./pages/admin/DocumentsManager";
import CollaborationsManager from "./pages/admin/CollaborationsManager";
import StoriesManager from "./pages/admin/StoriesManager";
import AlumniManager from "./pages/admin/AlumniManager";
import MoUTemplates from "./pages/resources/MoUTemplates";
import Margdarshika from "./pages/resources/Margdarshika";
import Brochures from "./pages/resources/Brochures";
import Support from "./pages/Support";
import SupportInbox from "./pages/admin/SupportInbox";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/leadership" element={<Leadership />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/join" element={<Join />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/id-card" element={<IDCard />} />
            <Route path="/support" element={<Support />} />
            <Route path="/resources/mou-templates" element={<MoUTemplates />} />
            <Route path="/resources/margdarshika" element={<Margdarshika />} />
            <Route path="/resources/brochures" element={<Brochures />} />
            <Route path="/resources/brochures" element={<Brochures />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:membershipId" element={<Verify />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="members" element={<MemberRegistry />} />
              <Route path="profiles" element={<ProfileEditor />} />
              <Route path="profile/:userId" element={<ProfileEditor />} />
              <Route path="programs" element={<ProgramsManager />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="cms" element={<CMSEditor />} />
              <Route path="ai-panel" element={<AIPanel />} />
              <Route path="chat-history" element={<ChatHistory />} />
              <Route path="support" element={<SupportInbox />} />
              <Route path="settings" element={<Settings />} />
              <Route path="leadership" element={<LeadershipManager />} />
              <Route path="districts" element={<DistrictManager />} />
              <Route path="brochures" element={<BrochureManager />} />
              <Route path="states" element={<StateDashboard />} />
              <Route path="reports" element={<ReportsManager />} />
              <Route path="documents" element={<DocumentsManager />} />
              <Route path="collaborations" element={<CollaborationsManager />} />
              <Route path="stories" element={<StoriesManager />} />
              <Route path="alumni" element={<AlumniManager />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
