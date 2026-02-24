import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, CreditCard, Bell, Calendar, ArrowRight, Camera, Shield, Lightbulb, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ForcePasswordChange from "@/components/auth/ForcePasswordChange";
import { AnnouncementsList } from "@/components/dashboard/AnnouncementsList";
import { NewsList } from "@/components/dashboard/NewsList";
import { Newspaper } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
export default function Dashboard() {
  const { user, profile, role, isAdmin, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [cmsContent, setCmsContent] = useState<Record<string, any>>({});
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    fetchDashboardContent();
    if (user) fetchMyEvents();
  }, [user]);

  async function fetchMyEvents() {
    setLoadingEvents(true);
    try {
      const { data, error } = await supabase
        .from("event_delegates" as any)
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (data) setMyEvents(data);
    } catch (e) {
      console.error("Error fetching my events", e);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchDashboardContent() {
    try {
      const { data, error } = await supabase
        .from("cms_blocks")
        .select("content")
        .eq("section", "member_dashboard")
        .single();

      if (data?.content) {
        setCmsContent(data.content as Record<string, any>);
      }
    } catch (error) {
      console.error("Error loading dashboard content:", error);
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (role) {
        // Auto-redirect specialized roles to their specific command consoles
        if (role === "EVENT_MANAGER") {
          navigate("/admin/event-dashboard");
        } else if (role === "NATIONAL_CONVENER") {
          navigate("/admin/national-convener");
        } else if (role === "NATIONAL_CO_CONVENER") {
          navigate("/admin/national-co-convener");
        } else if (role === "REGIONAL_CONVENER" || role === "REGIONAL_CO_CONVENER") {
          navigate("/admin/regional-convener");
        }
        // State admins and Super Controllers stay on the main dashboard (unless they choose to click Command Console)
      }
    }
  }, [user, loading, role, navigate]);

  async function togglePrivacy(field: "allow_email_sharing" | "allow_mobile_sharing", value: boolean) {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("user_id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Success", description: "Privacy settings updated" });
    } catch (error) {
      console.error("Error updating privacy:", error);
      toast({ title: "Error", description: "Failed to update privacy settings", variant: "destructive" });
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("user_id", user.id);

      await refreshProfile();
      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <Layout hideFooter>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl skeleton-shimmer" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <AnimatedBackground />
      <ForcePasswordChange />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Welcome, <span className="text-primary">{profile?.full_name || "Member"}</span>
          </h1>
          <p className="text-muted-foreground">
            {cmsContent.welcome_message || (user?.email === "savishkarindia@gmail.com" ? "Super Controller Dashboard" : (role ? ROLE_LABELS[role] : "Member") + " Dashboard")}
          </p>
        </motion.div>

        {/* Admin Shortcut */}
        {(isAdmin || user?.email === "savishkarindia@gmail.com") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/admin">
              <Button className="w-full md:w-auto glow-button-teal gap-2">
                <Shield className="w-4 h-4" />
                Go to Command Console
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <GlassCard className="md:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-4">
              <label className="relative cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold">{profile?.full_name}</h3>
                <p className="text-muted-foreground text-sm">{profile?.email}</p>
                <p className="text-primary text-sm mt-1">{user?.email === "savishkarindia@gmail.com" ? "Super Controller" : (role ? ROLE_LABELS[role] : "Member")}</p>
              </div>
            </div>

            {profile?.membership_id && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Membership ID</p>
                  <p className="font-mono font-semibold text-primary">{profile.membership_id}</p>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold mb-3">ID Card Privacy Settings</p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-email" className="text-sm cursor-pointer">Show Email on ID Card</Label>
                      <Switch
                        id="show-email"
                        checked={profile.allow_email_sharing !== false}
                        onCheckedChange={(checked) => togglePrivacy("allow_email_sharing", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-phone" className="text-sm cursor-pointer">Show Phone on ID Card</Label>
                      <Switch
                        id="show-phone"
                        checked={profile.allow_mobile_sharing !== false}
                        onCheckedChange={(checked) => togglePrivacy("allow_mobile_sharing", checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>

          {/* ID Card */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-6 h-6 text-primary" />
              <h3 className="font-display text-lg font-semibold">Digital ID Card</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {profile?.membership_id
                ? "View and download your verified ID card"
                : "Your ID card will be available after approval"}
            </p>
            <Link to="/id-card">
              <Button variant="outline" className="w-full gap-2">
                View ID Card
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </GlassCard>

          {/* Idea Submission */}
          <GlassCard>
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <h3 className="font-display text-lg font-semibold">Submit Idea</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Have an innovative idea? Submit it directly to the Super Controller.
            </p>
            <Link to="/support">
              <Button variant="outline" className="w-full gap-2">
                Submit Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </GlassCard>

          {/* Announcements */}
          <GlassCard className="border-primary/50">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-accent" />
              <h3 className="font-display text-lg font-semibold">Announcements</h3>
            </div>

            <AnnouncementsList role={role} />
          </GlassCard>

          {/* News Section */}
          <GlassCard className="border-orange-500/50">
            <div className="flex items-center gap-3 mb-4">
              <Newspaper className="w-6 h-6 text-orange-500" />
              <h3 className="font-display text-lg font-semibold">Latest News</h3>
            </div>
            <NewsList />
          </GlassCard>

          {/* Registered Events / Delegate Portal */}
          {myEvents.length > 0 && (
            <GlassCard className="md:col-span-2 border-purple-500/50 bg-purple-500/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <QrCode className="w-6 h-6 text-purple-400" />
                  <h3 className="font-display text-lg font-semibold">My Registered Events</h3>
                </div>
                <Badge variant="outline" className="text-purple-400 border-purple-400/30">
                  {myEvents.length} Active
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {myEvents.map((event) => (
                  <div key={event.id} className="p-4 rounded-xl bg-card border border-white/5 space-y-3">
                    <div>
                      <h4 className="font-semibold text-foreground">{event.event_name}</h4>
                      <p className="text-xs text-muted-foreground">{event.role_in_event || "Delegate"}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <Link to={`/verify/delegate/${event.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-2">
                          <Shield className="w-3 h-3" /> Verify ID
                        </Button>
                      </Link>
                      <Link to={`/register/event/${event.manager_id}`} className="flex-1">
                        <Button variant="ghost" size="sm" className="w-full h-8 text-xs gap-2 text-primary">
                          Update Info
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Featured / Upcoming Events */}
          <GlassCard className="md:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-savishkar-cyan" />
              <h3 className="font-display text-lg font-semibold">
                {cmsContent.featured_title || "Upcoming Programs"}
              </h3>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {cmsContent.featured_description || "Check back soon for upcoming events and programs."}
            </p>
            <Link to={cmsContent.featured_link || "/programs"} className="inline-block">
              <Button variant="outline" size="sm" className="gap-2">
                View Details
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </GlassCard>
        </div>
      </div >
    </Layout >
  );
}
