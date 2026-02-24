import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { supabase } from "@/integrations/supabase/client";
import logoSavishkar from "@/assets/logo-savishkar.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Auto-redirect if already logged in
  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      if (user && !authLoading) {
        // EMERGENCY BACKDOOR: Check email first
        if (user.email === "savishkarindia@gmail.com") {
          navigate("/admin");
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        const adminRoles = [
          "SUPER_CONTROLLER", "ADMIN", "STATE_CONVENER", "STATE_CO_CONVENER",
          "NATIONAL_CONVENER", "NATIONAL_CO_CONVENER", "REGIONAL_CONVENER",
          "REGIONAL_CO_CONVENER", "EVENT_MANAGER"
        ];

        if (adminRoles.includes(roleData?.role)) {
          if (roleData?.role === "EVENT_MANAGER") {
            navigate("/admin/event-dashboard");
          } else if (roleData?.role === "NATIONAL_CONVENER") {
            navigate("/admin/national-convener");
          } else if (roleData?.role === "NATIONAL_CO_CONVENER") {
            navigate("/admin/national-co-convener");
          } else if (roleData?.role === "REGIONAL_CONVENER" || roleData?.role === "REGIONAL_CO_CONVENER") {
            navigate("/admin/regional-convener");
          } else {
            navigate("/admin");
          }
        } else {
          navigate("/dashboard");
        }
      }
    };

    checkRoleAndRedirect();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;

        // Check role for redirect
        if (user) {
          // EMERGENCY BACKDOOR for owner
          if (user.email === "savishkarindia@gmail.com") {
            toast({ title: "Welcome back!", description: "Owner Access Granted. Entering Command Console..." });
            navigate("/admin");
            return;
          }

          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          const adminRoles = [
            "SUPER_CONTROLLER", "ADMIN", "STATE_CONVENER", "STATE_CO_CONVENER",
            "NATIONAL_CONVENER", "NATIONAL_CO_CONVENER", "REGIONAL_CONVENER",
            "REGIONAL_CO_CONVENER", "EVENT_MANAGER"
          ];

          if (adminRoles.includes(roleData?.role)) {
            toast({ title: "Welcome back!", description: "Accessing Command Console..." });
            if (roleData?.role === "EVENT_MANAGER") {
              navigate("/admin/event-dashboard");
            } else if (roleData?.role === "NATIONAL_CONVENER") {
              navigate("/admin/national-convener");
            } else if (roleData?.role === "NATIONAL_CO_CONVENER") {
              navigate("/admin/national-co-convener");
            } else if (roleData?.role === "REGIONAL_CONVENER" || roleData?.role === "REGIONAL_CO_CONVENER") {
              navigate("/admin/regional-convener");
            } else {
              navigate("/admin");
            }
          } else {
            toast({ title: "Welcome back!", description: "Successfully logged in." });
            navigate("/dashboard");
          }
        }
      } else {
        if (!fullName.trim()) {
          throw new Error("Full name is required");
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({ title: "Account created!", description: "Welcome to SAVISHKAR." });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout hideFooter>
      <AnimatedBackground />
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-panel-strong p-8">
            <div className="text-center mb-8">
              <img
                src={logoSavishkar}
                alt="SAVISHKAR"
                className="h-16 mx-auto mb-4"
              />
              <h1 className="font-display text-2xl font-bold mb-2">
                {isLogin ? "Identity Verification" : "Create Account"}
              </h1>
              <p className="text-muted-foreground text-sm">
                National Innovation Command Ecosystem
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {isLogin ? "Access your SAVISHKAR dashboard" : "Join the innovation ecosystem"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 input-glow"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 input-glow"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 input-glow"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full glow-button-teal" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Authenticate" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}