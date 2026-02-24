import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, User, Shield, MapPin, Calendar, Clock, AlertCircle, QrCode, Search, ScanLine, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/lib/constants";
import logoSavishkar from "@/assets/logo-savishkar.png";
import { Html5QrcodeScanner } from "html5-qrcode";

interface MemberData {
  full_name: string;
  email: string;
  membership_id: string;
  state: string | null;
  designation: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role: string | null;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  rejection_reason?: string | null;
  joined_year?: string | null;
  phone?: string | null;
}

type VerificationStatus = "idle" | "loading" | "active" | "pending" | "rejected" | "not_found";

export default function Verify() {
  const { membershipId } = useParams();
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [inputId, setInputId] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    async function verifyMember() {
      if (!membershipId) {
        setStatus("idle");
        return;
      }

      setStatus("loading");
      try {
        let lookupType: "membership_id" | "email" | "phone" = "membership_id";

        // Smart Detection
        if (membershipId.includes("@")) {
          lookupType = "email";
        } else if (/^[\d+\-\s]+$/.test(membershipId) && membershipId.replace(/\D/g, "").length >= 10) {
          lookupType = "phone";
        }

        // Try RPC first for membership_id because of potential public RLS restrictions
        if (lookupType === "membership_id") {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc("get_member_public_profile" as any, { lookup_id: membershipId });

          if (rpcData && !rpcError && (rpcData as any).length > 0) {
            const profile = (rpcData as any)[0];
            setMemberData({
              full_name: profile.full_name,
              email: profile.allow_email_sharing !== false ? profile.email : null,
              membership_id: profile.membership_id,
              state: profile.state,
              designation: profile.designation,
              avatar_url: profile.avatar_url,
              created_at: profile.created_at,
              updated_at: profile.created_at, // Use created_at as updated_at isn't in RPC
              role: profile.role || "MEMBER",
              status: "ACTIVE",
              joined_year: profile.joined_year,
              phone: profile.allow_mobile_sharing !== false ? profile.phone : null
            });
            setStatus("active");
            return;
          }
        }

        let query = supabase
          .from("profiles")
          .select("*");

        if (lookupType === "membership_id") query = query.eq("membership_id", membershipId);
        else if (lookupType === "email") query = query.ilike("email", membershipId);
        else if (lookupType === "phone") query = query.eq("phone", membershipId);

        const { data: profileData, error: profileError } = await query.maybeSingle();

        if (profileData && !profileError) {
          const profile = profileData as any;
          // Get role separately
          let userRole = "MEMBER";
          if (profile.user_id) {
            const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", profile.user_id).maybeSingle();
            if (roleData?.role) userRole = roleData.role;
          }

          setMemberData({
            full_name: profile.full_name,
            email: profile["allow_email_sharing"] !== false ? profile.email : null,
            membership_id: profile.membership_id,
            state: profile.state,
            designation: profile.designation,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            role: userRole,
            status: "ACTIVE",
            joined_year: profile["joined_year"],
            phone: profile["allow_mobile_sharing"] !== false ? profile.phone : null
          });
          setStatus("active");
          return;
        }

        // 2. Fallback: Check applications
        // Only if searching by email or phone, as applications don't have membership_id
        if (lookupType === "membership_id") {
          setStatus("not_found");
          return;
        }

        let appQuery = supabase.from("applications").select("*");

        if (lookupType === "email") appQuery = appQuery.ilike("email", membershipId);
        else if (lookupType === "phone") appQuery = appQuery.eq("phone", membershipId);

        const { data: applicationData } = await appQuery.maybeSingle();

        if (applicationData) {
          const application = applicationData as any;
          const appStatus = application.status.toUpperCase() as "PENDING" | "REJECTED";

          setMemberData({
            full_name: application.full_name,
            email: application.email,
            membership_id: "PENDING",
            state: application.state,
            designation: application.designation,
            avatar_url: application.photo_url,
            created_at: application.applied_at,
            updated_at: application.applied_at,
            role: "MEMBER",
            status: appStatus,
            phone: application.phone
          });
          setStatus(appStatus.toLowerCase() as any);
          return;
        }

        // Not found anywhere
        setStatus("not_found");
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("not_found");
      }
    }

    verifyMember();
  }, [membershipId]);

  // Scanner Effect
  useEffect(() => {
    if (showScanner) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setShowScanner(false);
          // Handle various QR formats: full URL or just ID
          const id = decodedText.split('/').pop() || decodedText;
          navigate(`/verify/${id}`);
        },
        (error) => {
          console.log(error);
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [showScanner, navigate]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputId.trim()) {
      navigate(`/verify/${inputId.trim()}`);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <Layout hideFooter>
        <AnimatedBackground />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying membership...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Status Badge Component
  const StatusBadge = ({ status }: { status: MemberData["status"] }) => {
    const variants = {
      ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      REJECTED: "bg-destructive/20 text-destructive border-destructive/30"
    };

    return (
      <Badge className={`${variants[status]} text-sm px-3 py-1`}>
        {status}
      </Badge>
    );
  };

  return (
    <Layout hideFooter>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto"
        >
          {/* Main Verification Card (Idle / Search Mode) */}
          {(status === "idle" || status === "not_found") && (
            <GlassCard className="text-center space-y-6">
              <img src={logoSavishkar} alt="SAVISHKAR" className="h-12 mx-auto mb-2" />
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>

              <h1 className="font-display text-2xl font-bold">Verify Identity</h1>
              <p className="text-muted-foreground">Enter Membership ID or Scan QR Code</p>

              {/* Scanner Section */}
              {showScanner ? (
                <div className="rounded-xl overflow-hidden bg-black/50 p-4">
                  <div id="reader" className="w-full"></div>
                  <Button variant="ghost" className="mt-4 w-full" onClick={() => setShowScanner(false)}>
                    Cancel Scan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      placeholder="ID, Email or Phone Number..."
                      value={inputId}
                      onChange={(e) => setInputId(e.target.value)}
                      className="bg-white/5"
                    />
                    <Button type="submit">
                      <Search className="w-4 h-4" />
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
                  </div>

                  <Button variant="outline" className="w-full gap-2 py-6 bg-white/5 hover:bg-white/10" onClick={() => setShowScanner(true)}>
                    <QrCode className="w-6 h-6" />
                    Scan ID Card
                  </Button>
                </div>
              )}

              {status === "not_found" && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 mt-6">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold">ID Not Found</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    The ID <span className="font-mono text-destructive">{membershipId}</span> is not registered in our system.
                  </p>
                </div>
              )}
            </GlassCard>
          )}

          {/* Result Cards (Active/Pending/Rejected) */}
          {status === "active" && memberData && (
            <GlassCard className="text-center">
              <div className="mb-6 flex justify-between items-start">
                <Button variant="ghost" size="sm" onClick={() => { setStatus("idle"); navigate("/verify"); }}>
                  <Search className="w-4 h-4 mr-2" /> Verify Another
                </Button>
                <img src={logoSavishkar} alt="SAVISHKAR" className="h-10" />
              </div>

              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <StatusBadge status="ACTIVE" />

              <h2 className="font-display text-2xl font-bold mt-4 mb-2 text-emerald-400">
                Verified Member
              </h2>
              <p className="text-muted-foreground mb-6">
                This membership ID is authentic and verified by SAVISHKAR
              </p>

              <div className="bg-card/50 rounded-2xl p-6 mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden border-2 border-primary/30">
                  {memberData.avatar_url ? (
                    <img src={memberData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <h3 className="font-display text-xl font-bold">{memberData.full_name}</h3>
                <p className="text-primary font-medium">
                  {memberData.role ? ROLE_LABELS[memberData.role] : "Member"}
                </p>
                {memberData.designation && (
                  <p className="text-sm text-muted-foreground">{memberData.designation}</p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Membership ID</span>
                  </div>
                  <span className="font-mono font-medium">{memberData.membership_id}</span>
                </div>

                {memberData.phone && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <span className="text-muted-foreground">Phone</span>
                    </div>
                    <span className="font-medium">{memberData.phone}</span>
                  </div>
                )}

                {memberData.email && memberData.email !== "Hidden" && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                      <span className="text-muted-foreground">Email</span>
                    </div>
                    <span className="font-medium">{memberData.email}</span>
                  </div>
                )}

                {memberData.state && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">State</span>
                    </div>
                    <span className="font-medium">{memberData.state}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Member Since</span>
                  </div>
                  <span className="font-medium">
                    {memberData.joined_year || new Date(memberData.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short"
                    })}
                  </span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Pending Application */}
          {status === "pending" && (
            <GlassCard className="text-center">
              <div className="mb-6 flex justify-start">
                <Button variant="ghost" size="sm" onClick={() => { setStatus("idle"); navigate("/verify"); }}>
                  <Search className="w-4 h-4 mr-2" /> Verify Another
                </Button>
              </div>

              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-400" />
              </div>

              <StatusBadge status="PENDING" />

              <h2 className="font-display text-2xl font-bold mt-4 mb-2 text-yellow-400">
                Verification Under Process
              </h2>
              <p className="text-muted-foreground">
                This application is currently being reviewed by our team.
              </p>
              <div className="mt-6 p-4 rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Ref: <span className="font-mono">{membershipId}</span>
                </p>
              </div>
            </GlassCard>
          )}

          {/* Rejected Application */}
          {status === "rejected" && memberData && (
            <GlassCard className="text-center">
              <div className="mb-6 flex justify-start">
                <Button variant="ghost" size="sm" onClick={() => { setStatus("idle"); navigate("/verify"); }}>
                  <Search className="w-4 h-4 mr-2" /> Verify Another
                </Button>
              </div>

              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>

              <StatusBadge status="REJECTED" />

              <h2 className="font-display text-2xl font-bold mt-4 mb-2 text-destructive">
                Application Rejected
              </h2>

              {memberData.rejection_reason && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-left mb-4 mt-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive mb-1">Reason</p>
                      <p className="text-sm text-muted-foreground">{memberData.rejection_reason}</p>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}