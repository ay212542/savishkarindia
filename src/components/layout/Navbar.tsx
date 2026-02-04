import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, User, LogOut, LayoutDashboard, Shield, ChevronDown, FileText, BookOpen, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Add useNavigate
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast"; // Add useToast
import logoSavishkar from "@/assets/logo-savishkar.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/leadership", label: "Leadership" },
  { href: "/programs", label: "Programs" },
  { href: "/join", label: "Join Us" },
  { href: "/support", label: "Support" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast({ title: "Logged out", description: "You have been successfully logged out." });
    navigate("/auth");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoSavishkar}
              alt="Savishkar Logo"
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
            />
            <span className="font-display font-bold text-xl hidden sm:block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">SAVISHKAR</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.href
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1 outline-none">
                Resources <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/resources/mou-templates" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" /> MoU Templates
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/resources/margdarshika" className="flex items-center gap-2 cursor-pointer">
                    <BookOpen className="w-4 h-4" /> Margdarshika
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/resources/brochures" className="flex items-center gap-2 cursor-pointer">
                    <FileDown className="w-4 h-4" /> Brochures
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="gap-2 text-accent">
                      <Shield className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/join">
                  <Button size="sm" className="glow-button-teal">Join Now</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted/50"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Resources Links */}
              <div className="px-4 py-2 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</p>
                <Link
                  to="/resources/mou-templates"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                >
                  <FileText className="w-4 h-4" /> MoU Templates
                </Link>
                <Link
                  to="/resources/margdarshika"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                >
                  <BookOpen className="w-4 h-4" /> Margdarshika
                </Link>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2 text-accent">
                          <Shield className="w-4 h-4" />
                          Admin Console
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-2">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full">Login</Button>
                    </Link>
                    <Link to="/join" onClick={() => setIsOpen(false)}>
                      <Button className="w-full glow-button-teal">Join Now</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
