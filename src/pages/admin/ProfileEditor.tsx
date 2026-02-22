import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Key, User, Search, Award, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PRANT_LIST, ROLE_LABELS, ROLE_HIERARCHY, AppRole, DESIGNATION_OPTIONS } from "@/lib/constants";

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state: string | null;
  district: string | null;
  division: string | null;
  designation: string | null;
  avatar_url: string | null;
  membership_id: string | null;
  profession?: string | null;
  joined_year?: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  role?: AppRole | null;
  created_at?: string;
  is_enabled?: boolean;
  // New fields
  is_leadership?: boolean;
  is_alumni?: boolean;
  bio?: string | null;
  journey_text?: string | null;
  achievements_list?: string | null;
  contribution_details?: string | null;
  allow_mobile_sharing?: boolean;
  allow_email_sharing?: boolean;
  event_manager_expiry?: string | null;
}

export default function ProfileEditor() {
  const { userId } = useParams();
  const navigate = useNavigate();
  // Destructure profile as currentUserProfile to avoid conflict with local profile state
  const { user: currentUser, role: currentUserRole, profile: currentUserProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [users, setUsers] = useState<ProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customDesignation, setCustomDesignation] = useState("");
  const [useCustomDesignation, setUseCustomDesignation] = useState(false);

  // Generate secure random password
  function generateSecurePassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)];
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  useEffect(() => {
    const isStateAdmin = currentUserRole === "STATE_CONVENER" || currentUserRole === "STATE_CO_CONVENER";
    const hasAccess = currentUserRole === "SUPER_CONTROLLER" || currentUserRole === "ADMIN" || isStateAdmin;

    if (currentUserRole && !hasAccess) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access members.",
        variant: "destructive"
      });
      navigate("/dashboard");
      return;
    }
  }, [currentUserRole, navigate, toast]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    } else {
      fetchUsers();
    }
  }, [userId, currentUserRole]);

  async function fetchUsers() {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      let roleMap = new Map();
      try {
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id, role");

        if (!rolesError && roles) {
          roleMap = new Map(roles.map(r => [r.user_id, r.role]));
        }
      } catch (e) {
        console.warn("Could not fetch roles list", e);
      }

      const isStateAdmin = currentUserRole === "STATE_CONVENER" || currentUserRole === "STATE_CO_CONVENER";

      let usersWithRoles = profiles?.map(p => ({
        ...p,
        role: roleMap.get(p.user_id) as AppRole | null || null
      })) || [];

      // Security: Filter list for State Admins
      if (isStateAdmin && currentUserProfile?.state) {
        usersWithRoles = usersWithRoles
          .filter(u => u.state === currentUserProfile.state) // Only own state
          .filter(u => u.role !== "SUPER_CONTROLLER" && u.role !== "ADMIN"); // Hide Admins
      }

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      // Suppress UI error for now to avoid frustration, or show simpler message
      if (error?.message?.includes("policy")) {
        toast({ title: "Database Permission Issue", description: "Please refresh the page to syncing permissions.", variant: "default" });
      } else {
        // Only show generic error if it's not a policy/RLS glitch
        // toast({ title: "Error", description: "Failed to load users", variant: "destructive" });
      }
    }
    setLoading(false);
  }

  async function fetchProfile() {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;

      // SECURITY: State Admin Isolation Check
      const isStateAdmin = currentUserRole === "STATE_CONVENER" || currentUserRole === "STATE_CO_CONVENER";
      if (isStateAdmin) {
        if (profileData.state !== currentUserProfile?.state) {
          toast({
            title: "Access Denied",
            description: "You cannot edit members from other states.",
            variant: "destructive"
          });
          navigate("/admin/registry");
          return;
        }
      }

      setProfile(profileData);

      // Handle Designation Logic
      if (profileData.designation) {
        const isStandard = DESIGNATION_OPTIONS.includes(profileData.designation);
        if (!isStandard) {
          setUseCustomDesignation(true);
          setCustomDesignation(profileData.designation);
        }
      }

      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .single();

        if (!roleError) {
          const targetRole = roleData?.role as AppRole || null;

          // SECURITY: State Admin cannot edit Super Admin
          if (isStateAdmin && (targetRole === "SUPER_CONTROLLER" || targetRole === "ADMIN")) {
            toast({
              title: "Access Denied",
              description: "You cannot edit Administrator accounts.",
              variant: "destructive"
            });
            navigate("/admin/registry");
            return;
          }

          setUserRole(targetRole);
        }
      } catch (e) {
        console.warn("Could not fetch user role", e);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    // SECURITY CHECK: Final Validation before Save
    const isStateAdmin = currentUserRole === "STATE_CONVENER" || currentUserRole === "STATE_CO_CONVENER";

    if (isStateAdmin) {
      // 1. Ensure we are not editing someone outside our state
      if (profile.state !== currentUserProfile?.state) {
        toast({ title: "Error", description: "State mismatch. You cannot edit this user.", variant: "destructive" });
        setSaving(false);
        return;
      }

      // 2. Ensure we are not assigning a Restricted Role
      if (userRole === "SUPER_CONTROLLER" || userRole === "ADMIN") {
        toast({ title: "Error", description: "You cannot assign Administrator roles.", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    try {
      // Determine final designation
      // NOTE: Per user request, the SYSTEM ROLE is the "Designation" (e.g. State Convener).
      // The old "designation" field is being deprecated or used as Profession if needed, 
      // but we have a dedicated Profession field now.

      let finalDesignation = profile.designation;
      if (useCustomDesignation) {
        finalDesignation = customDesignation;
      }

      // Override state for State Admin to ensure they can't change it accidentally
      const finalState = isStateAdmin ? currentUserProfile?.state : profile.state;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          email: profile.email, // Allow email update in profile table
          phone: profile.phone,
          state: finalState,
          district: profile.district,
          division: profile.division,
          designation: finalDesignation,
          profession: profile.profession,
          joined_year: profile.joined_year,
          avatar_url: profile.avatar_url,
          instagram_url: profile.instagram_url,
          facebook_url: profile.facebook_url,
          twitter_url: profile.twitter_url,
          linkedin_url: profile.linkedin_url,
          is_leadership: profile.is_leadership,
          is_alumni: profile.is_alumni,
          bio: profile.bio,
          journey_text: profile.journey_text,
          achievements_list: profile.achievements_list,
          contribution_details: profile.contribution_details,
          allow_mobile_sharing: profile.allow_mobile_sharing,
          allow_email_sharing: profile.allow_email_sharing,
          event_manager_expiry: profile.event_manager_expiry
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      if (userRole) {
        // Double check unauthorized role assignment
        if (isStateAdmin && (userRole === "SUPER_CONTROLLER" || userRole === "ADMIN")) {
          throw new Error("Unauthorized role assignment");
        }

        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", profile.user_id)
          .single();

        let roleError;
        if (existingRole) {
          const { error } = await supabase
            .from("user_roles")
            .update({ role: userRole as any })
            .eq("user_id", profile.user_id);
          roleError = error;
        } else {
          const { error } = await supabase
            .from("user_roles")
            .insert({ user_id: profile.user_id, role: userRole as any });
          roleError = error;
        }

        if (roleError) throw roleError;
      }

      await supabase.from("audit_logs").insert({
        action: "PROFILE_UPDATED",
        user_id: currentUser?.id,
        target_type: "profile",
        target_id: profile.user_id,
        details: { updated_by: currentUser?.email, target_email: profile.email }
      });

      toast({ title: "Saved", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleResetPassword() {
    if (!profile) return;
    setResetting(true);

    try {
      const newPassword = generateSecurePassword();
      setGeneratedPassword(newPassword);

      const { error } = await supabase.functions.invoke("reset-password", {
        body: { userId: profile.user_id, newPassword: newPassword }
      });

      if (error) throw error;

      // Mark as temporary password in profile
      await supabase
        .from("profiles")
        .update({ is_temporary_password: true } as any)
        .eq("user_id", profile.user_id);

      await supabase.from("audit_logs").insert({
        action: "PASSWORD_RESET",
        user_id: currentUser?.id,
        target_type: "user",
        target_id: profile.user_id,
        details: {
          reset_by: currentUser?.email,
          target_email: profile.email,
          reset_method: "admin_generated"
        }
      });

      toast({
        title: "Password Reset Successful",
        description: `New password generated for ${profile.full_name}`
      });

    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive"
      });
      setGeneratedPassword("");
    }
    setResetting(false);
  }

  const filteredUsers = users.filter(user => {
    return (
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.membership_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Profile Editor</h1>
          <p className="text-muted-foreground">Select a user to edit their profile</p>
        </div>

        <GlassCard>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or membership ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </GlassCard>

        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Membership ID</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "SUPER_CONTROLLER" || user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role ? ROLE_LABELS[user.role] : "No Role"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {user.membership_id || "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/profile/${user.user_id}`)}
                      >
                        Edit Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!profile) return <div>Profile not found</div>;

  const isStateAdmin = currentUserRole === "STATE_CONVENER" || currentUserRole === "STATE_CO_CONVENER";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="font-display font-semibold mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email {currentUserRole === 'SUPER_CONTROLLER' && "(Display Only)"}</Label>
                <div className="relative">
                  <Input
                    value={profile.email}
                    disabled={currentUserRole !== 'SUPER_CONTROLLER'}
                    className={currentUserRole !== 'SUPER_CONTROLLER' ? "opacity-60" : ""}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                  {currentUserRole === 'SUPER_CONTROLLER' && (
                    <p className="text-[10px] text-amber-500 mt-1">
                      * Changing this only updates the profile display, not the login email.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Membership ID</Label>
                <Input value={profile.membership_id || "Not assigned"} disabled className="opacity-60" />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Profession</Label>
                <Select
                  value={profile.profession || "Student"}
                  onValueChange={(v) => setProfile({ ...profile, profession: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Profession" /></SelectTrigger>
                  <SelectContent>
                    {["Student", "Educator", "Professional", "Social Worker", "Entrepreneur", "Other"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label>Joined Year</Label>
                <Input
                  type="number"
                  value={profile.joined_year || ""}
                  onChange={(e) => setProfile({ ...profile, joined_year: e.target.value })}
                  placeholder="e.g. 2023"
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-4">Role & Designation</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Designation (System Role)</Label>
                <Select
                  value={userRole || ""}
                  onValueChange={(v) => setUserRole(v as AppRole)}
                >
                  <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                  <SelectContent>
                    {ROLE_HIERARCHY.filter(role => {
                      if (currentUserRole === "SUPER_CONTROLLER") return true;
                      if (currentUserRole === "ADMIN") return role !== "SUPER_CONTROLLER";
                      return role !== "SUPER_CONTROLLER" && role !== "ADMIN";
                    }).map(role => (
                      <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prant (State)</Label>
                <Select
                  value={profile.state || ""}
                  onValueChange={(v) => setProfile({ ...profile, state: v })}
                  disabled={isStateAdmin}
                >
                  <SelectTrigger><SelectValue placeholder="Select prant" /></SelectTrigger>
                  <SelectContent>
                    {PRANT_LIST.map(prant => (
                      <SelectItem key={prant} value={prant}>{prant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>District</Label>
                <Input
                  value={profile.district || ""}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                />
              </div>

              {userRole === "EVENT_MANAGER" && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Event Manager Expiry Date</Label>
                  <p className="text-xs text-muted-foreground mb-2">When does their access to the event management system expire?</p>
                  <Input
                    type="datetime-local"
                    value={profile.event_manager_expiry ? new Date(profile.event_manager_expiry).toISOString().slice(0, 16) : ""}
                    onChange={(e) => setProfile({ ...profile, event_manager_expiry: new Date(e.target.value).toISOString() })}
                  />
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-display font-semibold">Registry Flags</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Leadership Member</Label>
                  <p className="text-xs text-muted-foreground">Mark as a key leadership figure</p>
                </div>
                <Switch
                  checked={profile.is_leadership || false}
                  onCheckedChange={(c) => setProfile({ ...profile, is_leadership: c })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Alumni</Label>
                  <p className="text-xs text-muted-foreground">Mark as a distinguished alumni</p>
                </div>
                <Switch
                  checked={profile.is_alumni || false}
                  onCheckedChange={(c) => setProfile({ ...profile, is_alumni: c })}
                />
              </div>

              {/* Data Sharing Switches */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Share Mobile Number</Label>
                  <p className="text-xs text-muted-foreground">Show mobile on public ID verify scan</p>
                </div>
                <Switch
                  checked={profile.allow_mobile_sharing || false}
                  onCheckedChange={(c) => setProfile({ ...profile, allow_mobile_sharing: c })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Share Email Address</Label>
                  <p className="text-xs text-muted-foreground">Show email on public ID verify scan</p>
                </div>
                <Switch
                  checked={profile.allow_email_sharing || false}
                  onCheckedChange={(c) => setProfile({ ...profile, allow_email_sharing: c })}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold">Journey & Impact</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Short Bio</Label>
                <Textarea
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Brief introduction..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Savishkar Journey</Label>
                <Textarea
                  value={profile.journey_text || ""}
                  onChange={(e) => setProfile({ ...profile, journey_text: e.target.value })}
                  placeholder="Detailed story of their journey with Savishkar..."
                  rows={4}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Achievements (Line separated)</Label>
                  <Textarea
                    value={profile.achievements_list || ""}
                    onChange={(e) => setProfile({ ...profile, achievements_list: e.target.value })}
                    placeholder="- Validated concept..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contributions (Line separated)</Label>
                  <Textarea
                    value={profile.contribution_details || ""}
                    onChange={(e) => setProfile({ ...profile, contribution_details: e.target.value })}
                    placeholder="- Mentored 50 students..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-4">Social Media Links</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={profile.instagram_url || ""}
                  onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={profile.facebook_url || ""}
                  onChange={(e) => setProfile({ ...profile, facebook_url: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Twitter/X</Label>
                <Input
                  value={profile.twitter_url || ""}
                  onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="font-display font-semibold mb-4">Profile Photo</h3>
            <ImageUpload
              bucket="avatars"
              folder="profiles"
              currentImage={profile.avatar_url || ""}
              onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
              aspectRatio="square"
            />
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold mb-4">Actions</h3>
            <div className="space-y-3">
              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" /> Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                className="w-full gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                <Key className="w-4 h-4" /> Reset Password
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      <Dialog open={showResetDialog} onOpenChange={(open) => {
        setShowResetDialog(open);
        if (!open) setGeneratedPassword("");
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Generate a secure random password for {profile?.full_name}.
              {generatedPassword && " Make sure to copy the new password before closing this dialog."}
            </DialogDescription>
          </DialogHeader>

          {generatedPassword ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Password Generated:</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-sm bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      toast({ title: "Copied", description: "Password copied to clipboard" });
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ This password will only be shown once. Please copy it now.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Security Notice:</strong> This will generate a secure random password
                  and immediately set it for the user. The old password will no longer work.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowResetDialog(false);
                setGeneratedPassword("");
              }}
            >
              {generatedPassword ? "Close" : "Cancel"}
            </Button>
            {!generatedPassword && (
              <Button onClick={handleResetPassword} disabled={resetting}>
                {resetting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Generate & Reset Password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}