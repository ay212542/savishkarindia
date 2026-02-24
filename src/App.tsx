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
import React, { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ScrollToTop } from "@/components/ScrollToTop";
// Lazy load admin pages to reduce initial bundle size
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const Approvals = React.lazy(() => import("./pages/admin/Approvals"));
const MemberRegistry = React.lazy(() => import("./pages/admin/MemberRegistry"));
const ProgramsManager = React.lazy(() => import("./pages/admin/ProgramsManager"));
const Announcements = React.lazy(() => import("./pages/admin/Announcements"));
const CMSEditor = React.lazy(() => import("./pages/admin/CMSEditor"));
const AIPanel = React.lazy(() => import("./pages/admin/AIPanel"));
const ChatHistory = React.lazy(() => import("./pages/admin/ChatHistory"));
const Settings = React.lazy(() => import("./pages/admin/Settings"));
const LeadershipManager = React.lazy(() => import("./pages/admin/LeadershipManager"));
const ProfileEditor = React.lazy(() => import("./pages/admin/ProfileEditor"));
const DistrictManager = React.lazy(() => import("./pages/admin/DistrictManager"));
const BrochureManager = React.lazy(() => import("./pages/admin/BrochureManager"));
const StateDashboard = React.lazy(() => import("./pages/admin/StateDashboard"));
const ReportsManager = React.lazy(() => import("./pages/admin/ReportsManager"));
const DocumentsManager = React.lazy(() => import("./pages/admin/DocumentsManager"));
const CollaborationsManager = React.lazy(() => import("./pages/admin/CollaborationsManager"));
const StoriesManager = React.lazy(() => import("./pages/admin/StoriesManager"));
const AlumniManager = React.lazy(() => import("./pages/admin/AlumniManager"));
const SupportInbox = React.lazy(() => import("./pages/admin/SupportInbox"));
const NewsManager = React.lazy(() => import("./pages/admin/NewsManager"));
const EventManager = React.lazy(() => import("./pages/admin/EventManager"));
const AssignEventManager = React.lazy(() => import("./pages/admin/AssignEventManager"));
const EventDashboard = React.lazy(() => import("./pages/admin/EventDashboard"));
const NationalConvenerDashboard = React.lazy(() => import("./pages/admin/NationalConvenerDashboard"));
const NationalCoConvenerDashboard = React.lazy(() => import("./pages/admin/NationalCoConvenerDashboard"));
const NationalManager = React.lazy(() => import("./pages/admin/NationalManager"));
const RegionalManager = React.lazy(() => import("./pages/admin/RegionalManager"));
const RegionalConvenerDashboard = React.lazy(() => import("./pages/admin/RegionalConvenerDashboard"));

const MoUTemplates = React.lazy(() => import("./pages/resources/MoUTemplates"));
const Margdarshika = React.lazy(() => import("./pages/resources/Margdarshika"));
const Brochures = React.lazy(() => import("./pages/resources/Brochures"));
const News = React.lazy(() => import("./pages/News"));


import Support from "./pages/Support"; // Keep public pages eager loaded if critical, or lazy if large
import DynamicRegistration from "./pages/DynamicRegistration";
import DelegateVerify from "./pages/DelegateVerify";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/leadership" element={<Leadership />} />
              <Route path="/verify/delegate/:delegateId" element={<DelegateVerify />} />
              <Route path="/register/event/:managerId" element={<DynamicRegistration />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/join" element={<Join />} />
              <Route path="/news" element={<News />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/id-card" element={<IDCard />} />
              <Route path="/support" element={<Support />} />
              <Route path="/resources/mou-templates" element={<MoUTemplates />} />
              <Route path="/resources/margdarshika" element={<Margdarshika />} />
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
                <Route path="news" element={<NewsManager />} />
                <Route path="events" element={<EventManager />} />
                <Route path="event-manager" element={<EventManager />} />
                <Route path="event-dashboard" element={<EventDashboard />} />
                <Route path="assign-event-manager" element={<AssignEventManager />} />
                <Route path="national-convener" element={<NationalConvenerDashboard />} />
                <Route path="national-co-convener" element={<NationalCoConvenerDashboard />} />
                <Route path="national-manager" element={<NationalManager />} />
                <Route path="regional-manager" element={<RegionalManager />} />
                <Route path="regional-convener" element={<RegionalConvenerDashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
