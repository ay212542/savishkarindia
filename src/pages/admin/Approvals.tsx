import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, User, Mail, Phone, MapPin, Calendar, Building, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PRANT_CODES } from "@/lib/constants";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  state: string;
  division: string | null;
  district: string | null;
  prant: string | null;
  institution: string | null;
  motivation: string | null;
  date_of_birth: string | null;
  designation: string | null;
  photo_url: string | null;
  status: "pending" | "approved" | "rejected";
  applied_at: string;
}

function generateMembershipId(prant: string | null, state: string): string {
  // Use prant code if available, otherwise use state code
  const prantCode = prant ? (PRANT_CODES[prant] || prant.substring(0, 3).toUpperCase()) : state.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `SAV-${prantCode}-${year}-${random}`;
}

export default function Approvals() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { user, profile, role } = useAuth();
  const { toast } = useToast();

  const isStateAdmin = role === "STATE_CONVENER" || role === "STATE_CO_CONVENER";
  const userState = profile?.state;

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, role, userState]);

  async function fetchApplications() {
    let query = supabase
      .from("applications")
      .select("*")
      .eq("status", "pending")
      .order("applied_at", { ascending: false });

    // State Admin Filter
    if (isStateAdmin && userState) {
      query = query.eq("state", userState);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  }

  async function handleApprove(app: Application) {
    setProcessing(app.id);

    try {
      // Generate membership ID using new format
      const membershipId = generateMembershipId(app.prant, app.state);

      // Use server-side edge function for secure user provisioning
      const { data, error } = await supabase.functions.invoke("provision-user", {
        body: {
          email: app.email,
          full_name: app.full_name,
          phone: app.phone,
          state: app.state,
          division: app.division,
          district: app.district,
          prant: app.prant,
          membership_id: membershipId,
          application_id: app.id,
          designation: app.designation || "MEMBER",
          avatar_url: app.photo_url
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to provision user");

      toast({
        title: "Application Approved",
        description: `${app.full_name} has been approved with ID: ${membershipId}. A temporary password has been set.`
      });

      setApplications(prev => prev.filter(a => a.id !== app.id));
    } catch (error: any) {
      console.error("Approval error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve application. Please try again.",
        variant: "destructive"
      });
    }

    setProcessing(null);
  }

  async function handleReject() {
    if (!selectedApp) return;
    setProcessing(selectedApp.id);

    try {
      await supabase.from("applications")
        .update({
          status: "rejected",
          rejection_reason: rejectReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq("id", selectedApp.id);

      // Log the action
      await supabase.from("audit_logs").insert({
        action: "APPLICATION_REJECTED",
        user_id: user?.id,
        target_type: "application",
        target_id: selectedApp.id,
        details: {
          applicant_email: selectedApp.email,
          reason: rejectReason
        }
      });

      toast({
        title: "Application Rejected",
        description: `${selectedApp.full_name}'s application has been rejected.`
      });

      setApplications(prev => prev.filter(a => a.id !== selectedApp.id));
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive"
      });
    }

    setShowRejectDialog(false);
    setSelectedApp(null);
    setRejectReason("");
    setProcessing(null);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Approval Center</h1>
        <p className="text-muted-foreground">Review and process membership applications</p>
      </div>

      {applications.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Check className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
          <h3 className="font-display text-xl font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">No pending applications to review.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {applications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <GlassCard>
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Photo and Applicant Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      {app.photo_url ? (
                        <img
                          src={app.photo_url}
                          alt={app.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-display font-semibold text-lg">{app.full_name}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {app.prant && <Badge variant="outline">{app.prant}</Badge>}
                          <Badge variant="secondary">{app.state}</Badge>
                          {app.designation && <Badge>{app.designation}</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {app.phone}
                      </div>
                      {app.district && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {app.district}
                        </div>
                      )}
                      {app.institution && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="w-4 h-4" />
                          {app.institution}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(app.applied_at).toLocaleDateString("en-IN")}
                      </div>
                    </div>

                    {app.motivation && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <MessageSquare className="w-4 h-4" />
                          Motivation
                        </div>
                        <p className="text-sm">{app.motivation}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-32">
                    <Button
                      onClick={() => handleApprove(app)}
                      disabled={processing === app.id}
                      className="flex-1 gap-2 glow-button-teal"
                    >
                      {processing === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedApp(app);
                        setShowRejectDialog(true);
                      }}
                      disabled={processing === app.id}
                      className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedApp?.full_name}'s application.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
