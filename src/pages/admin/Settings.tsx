import { useState } from "react";
import { Settings as SettingsIcon, User, Lock, Database, Bell, Save, Loader2, Key } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function Settings() {
  const { profile, role, user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications (Mock for now, could actuaally stick in local storage or profile)
  const [emailNotifs, setEmailNotifs] = useState(true);

  async function handleUpdateProfile() {
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone: phone })
        .eq("id", profile?.id);

      if (error) throw error;

      // Update audit log
      await supabase.from("audit_logs").insert({
        action: "PROFILE_UPDATED",
        user_id: user?.id,
        target_type: "user",
        target_id: user?.id,
        details: { updated_fields: ["full_name", "phone"] }
      });

      toast({ title: "Profile Updated", description: "Your information has been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSavingProfile(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    console.log("Attempting password update..."); // DEBUG
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.error("Password update error:", error);
        throw error;
      }

      console.log("Password update success:", data);
      toast({ title: "Success", description: "Password changed successfully." });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change exception:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update password. Please try again.",
        variant: "destructive"
      });
    }
    setChangingPassword(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-7 h-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage system preferences and configuration</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Admin Profile</h3>
              <p className="text-sm text-muted-foreground">Your account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={role ? ROLE_LABELS[role] : "Admin"} disabled className="bg-muted" />
            </div>
            <Button onClick={handleUpdateProfile} disabled={savingProfile} className="w-full">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </div>
        </GlassCard>

        {/* Security Settings */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-accent/10">
              <Lock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Security</h3>
              <p className="text-sm text-muted-foreground">Account security options</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => setShowPasswordDialog(true)}>
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Extra security layer</p>
              </div>
              <Switch disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              * Two-factor authentication coming soon
            </p>
          </div>
        </GlassCard>

        {/* Notification Settings */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-savishkar-cyan/10">
              <Bell className="w-5 h-5 text-savishkar-cyan" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Notifications</h3>
              <p className="text-sm text-muted-foreground">Email and alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">New Applications</p>
                <p className="text-sm text-muted-foreground">Email when new applications arrive</p>
              </div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">System Alerts</p>
                <p className="text-sm text-muted-foreground">Critical system notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </GlassCard>

        {/* System Info */}
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-muted">
              <Database className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold">System Information</h3>
              <p className="text-sm text-muted-foreground">Platform details</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium">SAVISHKAR v1.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">Backend</span>
              <span className="font-medium">Supabase</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">AI Integration</span>
              <span className="font-medium text-primary">Active</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-2">
                <span className="status-dot status-online" />
                <span className="font-medium text-emerald-400">Operational</span>
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your new password below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
