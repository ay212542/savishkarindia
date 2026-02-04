import { useState, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, FileCheck, Calendar,
  Megaphone, Palette, Bot, Settings, Shield, ChevronRight, LogOut,
  Award, MapPin, UserCog, FileText, MessageSquare, BookOpen, FileDown,
  Handshake, LayoutTemplate, GraduationCap, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/lib/constants";
import logoSavishkar from "@/assets/logo-savishkar.png";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/approvals", label: "Approval Center", icon: FileCheck },
  { href: "/admin/members", label: "Member Registry", icon: Users },
  { href: "/admin/states", label: "All State Dashboard", icon: MapPin },
  { href: "/admin/profiles", label: "Profile Editor", icon: UserCog },
  { href: "/admin/programs", label: "Programs Manager", icon: Calendar },
  { href: "/admin/leadership", label: "Leadership Manager", icon: Award },
  { href: "/admin/districts", label: "District Manager", icon: MapPin },
  { href: "/admin/reports", label: "Reports Center", icon: FileDown },
  { href: "/admin/documents", label: "Documents (MoU/Guides)", icon: BookOpen },
  { href: "/admin/collaborations", label: "Collaborations", icon: Handshake },
  { href: "/admin/stories", label: "Stories", icon: LayoutTemplate },
  { href: "/admin/alumni", label: "Alumni", icon: GraduationCap },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },

  { href: "/admin/cms", label: "CMS Editor", icon: Palette },
  { href: "/admin/ai-panel", label: "AI Maintenance", icon: Bot },
  { href: "/admin/chat-history", label: "AI Chat History", icon: MessageSquare },
  { href: "/admin/support", label: "Inbox (Support/Ideas)", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, profile, role, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  const handleLogout = async () => {
    console.log("Logout clicked!"); // DEBUG
    try {
      await signOut();
      console.log("SignOut finished"); // DEBUG
      toast({ title: "Logged out", description: "You have been successfully logged out." });
      navigate("/auth");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const isStateAdmin = role === "STATE_CONVENER" || role === "STATE_CO_CONVENER";
  const hasAccess = isAdmin || isStateAdmin || user?.email === "savishkarindia@gmail.com";

  useEffect(() => {
    // Only redirect to auth if explicitly not logged in and not loading
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Filter sidebar items based on role
  const filteredSidebarItems = sidebarItems.filter(item => {
    // Super Controller & Admin see everything
    if (role === "SUPER_CONTROLLER" || role === "ADMIN" || user?.email === "savishkarindia@gmail.com") return true;

    // State roles only see specific items
    const allowedItems = [
      "/admin", // Dashboard
      "/admin/leadership",
      "/admin/districts",
      "/admin/programs",
      "/admin/announcements",
      "/admin/approvals",
      "/admin/members",
      "/admin/reports"
    ];
    return allowedItems.includes(item.href);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl skeleton-shimmer" />
          <p className="text-muted-foreground">Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Shield className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to view the Admin Console.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
          <Button variant="ghost" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    );
  }

  const isActiveLink = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      {/* Mobile Toggle */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-[9999] w-64 bg-sidebar-background border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:block
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoSavishkar}
              alt="SAVISHKAR"
              className="w-10 h-10 object-contain"
            />
            <div>
              <span className="font-display font-bold text-lg block leading-none text-foreground">SAVISHKAR</span>
              <span className="text-xs text-muted-foreground">Command Console</span>
            </div>
          </Link>
          {/* Mobile Close Button */}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => {
                    console.log(`Navigating to ${item.href}`);
                    setIsSidebarOpen(false); // Close on mobile click
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-primary">{role ? ROLE_LABELS[role] : "Admin"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/dashboard" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Member View
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-full overflow-auto"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}