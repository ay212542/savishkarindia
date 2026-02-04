import { useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, FileCheck, Calendar,
  Megaphone, Palette, Bot, Settings, Shield, ChevronRight, LogOut,
  Award, MapPin, UserCog, FileText, MessageSquare, BookOpen, FileDown,
  Handshake, LayoutTemplate, GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate("/auth");
  };

  const isStateAdmin = role === "STATE_CONVENER" || role === "STATE_CO_CONVENER";
  const hasAccess = isAdmin || isStateAdmin || user?.email === "savishkarindia@gmail.com";

  useEffect(() => {
    if (!loading && (!user || !hasAccess)) {
      navigate("/auth");
    }
  }, [user, hasAccess, loading, navigate]);

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
    return null;
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
      <aside className="w-64 border-r border-border bg-sidebar-background flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
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
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-3">
          <nav className="space-y-1">
            {filteredSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
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
        </ScrollArea>

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