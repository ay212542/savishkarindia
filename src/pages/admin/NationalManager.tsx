import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Plus, KeyRound, Copy, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

export default function NationalManager() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const { user, role: currentUserRole } = useAuth();
    const navigate = useNavigate();

    // State for create dialog
    const [creating, setCreating] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newUser, setNewUser] = useState({ full_name: "", email: "", phone: "", role: "NATIONAL_CONVENER" });
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);

    const { toast } = useToast();

    // Guard: Only SUPER_CONTROLLER
    useEffect(() => {
        if (currentUserRole && currentUserRole !== "SUPER_CONTROLLER") {
            navigate("/admin");
        }
    }, [currentUserRole, navigate]);

    const fetchAdmins = async () => {
        if (!user || currentUserRole !== "SUPER_CONTROLLER") return;

        setLoading(true);
        try {
            const { data: rolesData, error: rolesError } = await supabase
                .from("user_roles")
                .select("user_id, role")
                .in("role", ["NATIONAL_CONVENER", "NATIONAL_CO_CONVENER"]);

            if (rolesError) throw rolesError;

            if (!rolesData || rolesData.length === 0) {
                setAdmins([]);
                return;
            }

            const userIds = rolesData.map(r => r.user_id);
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("*")
                .in("user_id", userIds);

            if (profilesError) throw profilesError;

            const combined = profilesData.map(p => ({
                ...p,
                role: rolesData.find(r => r.user_id === p.user_id)?.role,
            }));

            setAdmins(combined);
        } catch (error) {
            console.error("Error fetching national admins:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, [user, currentUserRole]);

    async function handleDismissAdmin(adminUserId: string, name: string) {
        if (!confirm(`Are you sure you want to dismiss ${name}?`)) return;
        setProcessing(adminUserId);

        try {
            const { error: roleError } = await supabase
                .from("user_roles")
                .update({ role: "MEMBER" })
                .eq("user_id", adminUserId);
            if (roleError) throw roleError;

            const { error: profileError } = await supabase
                .from("profiles")
                .update({ designation: "Member", is_leadership: false })
                .eq("user_id", adminUserId);
            if (profileError) throw profileError;

            toast({ title: "Admin Dismissed", description: `${name} has been dismissed.` });
            fetchAdmins();
        } catch (error: any) {
            console.error("Dismissal error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    }

    async function handleResetPassword(email: string) {
        if (!confirm(`Send password reset email to ${email}?`)) return;
        setProcessing(`reset-${email}`);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth?reset=true`,
            });
            if (error) throw error;
            toast({ title: "Reset Email Sent", description: `Password reset link sent to ${email}.` });
        } catch (error: any) {
            console.error("Reset error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    }

    async function handleCreateNationalAdmin() {
        if (!newUser.full_name || !newUser.email) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }
        setCreating(true);

        try {
            const membershipId = `EMP-${Date.now().toString().slice(-6)}`;

            const { data, error } = await supabase.functions.invoke('provision-user', {
                body: {
                    full_name: newUser.full_name,
                    email: newUser.email,
                    phone: newUser.phone,
                    state: "National",
                    membership_id: membershipId,
                    prant: "National",
                    designation: "National Convener",
                    role: newUser.role,
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            setCreatedCredentials({ email: newUser.email, password: data.password });
            toast({ title: "Success", description: "National Admin created successfully" });
            fetchAdmins();
        } catch (error: any) {
            console.error("Creation error:", error);
            toast({ title: "Error", description: error.message || "Failed to create user", variant: "destructive" });
        } finally {
            setCreating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display text-white">National Managers</h1>
                    <p className="text-muted-foreground mt-1">Assign and manage overall platform National Conveners</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add National Admin
                </Button>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 font-medium text-sm text-muted-foreground">Name</th>
                                <th className="p-4 font-medium text-sm text-muted-foreground">Email</th>
                                <th className="p-4 font-medium text-sm text-muted-foreground">Role</th>
                                <th className="p-4 font-medium text-sm text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {admins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No National level admins assigned yet.
                                    </td>
                                </tr>
                            ) : admins.map((admin) => (
                                <tr key={admin.user_id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{admin.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{admin.phone || "No phone"}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">{admin.email}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium border border-primary/20">
                                            {admin.role.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleResetPassword(admin.email)}
                                                disabled={processing === `reset-${admin.email}`}
                                                className="h-8 gap-1.5"
                                            >
                                                {processing === `reset-${admin.email}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                                                Reset Pass
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleDismissAdmin(admin.user_id, admin.full_name)}
                                                disabled={processing === admin.user_id}
                                                className="h-8"
                                            >
                                                {processing === admin.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Dismiss"}
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <Dialog open={showCreateDialog} onOpenChange={(open) => {
                if (!open && createdCredentials) {
                    setCreatedCredentials(null);
                    setNewUser({ full_name: "", email: "", phone: "", role: "NATIONAL_CONVENER" });
                }
                setShowCreateDialog(open);
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{createdCredentials ? "Admin Created Successfully" : "Assign National Admin"}</DialogTitle>
                        <DialogDescription>
                            {createdCredentials
                                ? "Please copy these credentials safely. They cannot be viewed again."
                                : "Create a new National Convener or Co-Convener."}
                        </DialogDescription>
                    </DialogHeader>

                    {createdCredentials ? (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-muted/30 rounded-lg space-y-3 border border-border">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Email (Username)</label>
                                    <div className="flex items-center justify-between bg-background p-2 rounded border">
                                        <code className="text-sm">{createdCredentials.email}</code>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                            navigator.clipboard.writeText(createdCredentials.email);
                                            toast({ title: "Copied" });
                                        }}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground uppercase tracking-wider">Temporary Password</label>
                                    <div className="flex items-center justify-between bg-background p-2 rounded border">
                                        <code className="text-sm font-bold text-primary">{createdCredentials.password}</code>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                                            navigator.clipboard.writeText(createdCredentials.password);
                                            toast({ title: "Copied" });
                                        }}>
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                                <p>User must log in with these credentials to activate their account. They can change their password later.</p>
                            </div>
                            <Button className="w-full" onClick={() => setShowCreateDialog(false)}>Done</Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={newUser.role} onValueChange={(v) => setNewUser(prev => ({ ...prev, role: v }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NATIONAL_CONVENER">National Convener</SelectItem>
                                        <SelectItem value="NATIONAL_CO_CONVENER">National Co-Convener</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Rahul Sharma"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="rahul@example.com"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+91..."
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>

                            <Button onClick={handleCreateNationalAdmin} className="w-full mt-4" disabled={creating}>
                                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {creating ? "Creating..." : "Create Admin Account"}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
