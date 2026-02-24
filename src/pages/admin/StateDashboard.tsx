import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Users, MapPin, Award, ArrowRight, Plus, Copy, Check, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRANT_LIST } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerificationWidget } from "@/components/ui/VerificationWidget";

export default function DistrictManager() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stateAdmins, setStateAdmins] = useState<Map<string, any>>(new Map());
    const [detailedStats, setDetailedStats] = useState<Map<string, any>>(new Map());
    const [selectedPrant, setSelectedPrant] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);
    const { user, role: currentUserRole } = useAuth(); // Added role check

    // State for create dialog
    const [creating, setCreating] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newUser, setNewUser] = useState({ full_name: "", email: "", phone: "", state: "", role: "STATE_CONVENER" });
    const [createdCredentials, setCreatedCredentials] = useState<{ email: string, password: string } | null>(null);

    const { toast } = useToast();

    const fetchStats = async () => {
        if (!user) return; // Wait for auth

        try {
            // Fetch real data aggregation
            try {
                const [profilesResponse, adminsResponse, leadersRolesResponse] = await Promise.all([
                    supabase.from("profiles").select("user_id, state, district"),
                    supabase.from("user_roles").select("user_id, role")
                        .in("role", ["STATE_CONVENER", "STATE_CO_CONVENER"]),
                    supabase.from("user_roles").select("user_id, role")
                        .in("role", ["NATIONAL_CONVENER", "NATIONAL_CO_CONVENER", "STATE_CONVENER", "STATE_CO_CONVENER", "STATE_INCHARGE", "STATE_CO_INCHARGE", "DISTRICT_CONVENER", "DISTRICT_CO_CONVENER", "DISTRICT_INCHARGE", "DISTRICT_CO_INCHARGE"] as any[])
                ]);

                if (profilesResponse.error) throw profilesResponse.error;
                if (adminsResponse.error) throw adminsResponse.error;

                const profiles = profilesResponse.data || [];
                const adminRoles = adminsResponse.data || [];

                // Build leader user_ids set from leadership roles
                const leaderUserIds = new Set((leadersRolesResponse.data || []).map(r => r.user_id));

                // Fetch full profiles for admins
                let adminMap = new Map();
                if (adminRoles.length > 0) {
                    const adminIds = adminRoles.map(r => r.user_id);
                    const { data: adminProfiles } = await supabase
                        .from("profiles")
                        .select("*")
                        .in("user_id", adminIds);

                    if (adminProfiles) {
                        adminProfiles.forEach(p => {
                            if (p.state) adminMap.set(p.state, { ...p, role: adminRoles.find(r => r.user_id === p.user_id)?.role });
                        });
                    }
                }

                setStateAdmins(adminMap);

                // map to store stats by prant
                const prantStats = new Map<string, { memberCount: number; leaderCount: number; districts: Set<string>; districtBreakdown: Record<string, number> }>();

                // Initialize all prants
                PRANT_LIST.forEach(prant => {
                    prantStats.set(prant, { memberCount: 0, leaderCount: 0, districts: new Set(), districtBreakdown: {} });
                });

                // Count profiles
                profiles.forEach(p => {
                    if (p.state && prantStats.has(p.state)) {
                        const s = prantStats.get(p.state)!;
                        s.memberCount++;
                        if (p.district) {
                            s.districts.add(p.district);
                            s.districtBreakdown[p.district] = (s.districtBreakdown[p.district] || 0) + 1;
                        }
                    }
                });

                // Count leaders (members who have leadership roles, matched to their profile state)
                const leaderProfiles = profiles.filter(p => leaderUserIds.has(p.user_id));
                leaderProfiles.forEach(p => {
                    if (p.state && prantStats.has(p.state)) {
                        const s = prantStats.get(p.state)!;
                        s.leaderCount++;
                    }
                });

                setDetailedStats(prantStats);

                // Convert to array
                const statsArray = Array.from(prantStats.entries()).map(([prant, data]) => ({
                    prant,
                    memberCount: data.memberCount,
                    leaderCount: data.leaderCount,
                    districts: data.districts.size
                }));

                // Sort by activity (member count)
                const sortedStats = statsArray.sort((a, b) => b.memberCount - a.memberCount);

                // Filter for State Admins
                const isStateRole = ["STATE_CONVENER", "STATE_CO_CONVENER", "STATE_INCHARGE", "STATE_CO_INCHARGE"].includes(currentUserRole || "");
                if (isStateRole && user?.email !== "savishkarindia@gmail.com") {
                    const currentUserProfile = profiles.find(p => p.user_id === user?.id);
                    if (currentUserProfile?.state) {
                        setStats(sortedStats.filter(s => s.prant === currentUserProfile.state));
                    } else {
                        setStats(sortedStats);
                    }
                } else {
                    setStats(sortedStats);
                }
            } catch (innerError) {
                console.warn("Real stats fetch failed, falling back to empty:", innerError);
                // Mock stats fallback or just empty
                // Keeping mock stats for now as fallback
                const mockStats = PRANT_LIST.map(prant => ({
                    prant,
                    memberCount: 0,
                    leaderCount: 0,
                    districts: 0
                }));
                setStats(mockStats);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [user, currentUserRole]);

    async function handleDismissAdmin(adminUserId: string, stateName: string) {
        if (!confirm(`Are you sure you want to dismiss the admin for ${stateName}?`)) return;
        setProcessing(adminUserId);

        try {
            // 1. Update Role to MEMBER
            const { error: roleError } = await supabase
                .from("user_roles")
                .update({ role: "MEMBER" })
                .eq("user_id", adminUserId);

            if (roleError) throw roleError;

            // 2. Update Profile to clear designation/privileged fields
            // keeping state association for record, but clearing official designation
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ designation: "Member", is_leadership: false })
                .eq("user_id", adminUserId);

            if (profileError) throw profileError;

            toast({ title: "Admin Dismissed", description: `State Admin for ${stateName} has been dismissed.` });

            // Refresh
            fetchStats();
        } catch (error: any) {
            console.error("Dismissal error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    }

    async function handleResetPassword(email: string, stateName: string) {
        if (!confirm(`Send password reset email to the admin of ${stateName} (${email})?`)) return;
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

    async function handleCreateStateAdmin() {
        if (!newUser.full_name || !newUser.email || !newUser.state) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }
        setCreating(true);

        try {
            const membershipId = `EMP-${Date.now().toString().slice(-6)}`; // Temp ID generation

            const { data, error } = await supabase.functions.invoke('provision-user', {
                body: {
                    full_name: newUser.full_name,
                    email: newUser.email,
                    phone: newUser.phone,
                    state: newUser.state,
                    membership_id: membershipId,
                    prant: newUser.state, // Assuming state map to prant
                    designation: "State Admin",
                    role: newUser.role,
                }
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error);

            // Successfully created
            setCreatedCredentials({ email: newUser.email, password: data.password });
            toast({ title: "Success", description: "State Admin created successfully" });
            // Don't close dialog yet, show credentials
            fetchStats(); // Refresh list to show new admin
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-display text-2xl font-bold">All India State Dashboard</h1>
                    <p className="text-muted-foreground">Overview of all Prants and activity levels</p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create State Admin
                </Button>
            </div>

            {/* State Verification Module */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <VerificationWidget />
                </div>
                <div className="lg:col-span-2">
                    <GlassCard className="h-full flex flex-col justify-center border-emerald-500/20 bg-emerald-500/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Users className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-emerald-500">Member Verification</h3>
                                <p className="text-sm text-muted-foreground">State administrators can use this tool to quickly verify member credentials during regional events or meetings.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <GlassCard key={stat.prant} className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MapPin className="w-12 h-12" />
                        </div>

                        <h3 className="font-semibold text-lg mb-2 truncate pr-6">{stat.prant}</h3>

                        {/* Admin Info */}
                        <div className="mb-4 p-2 bg-muted/50 rounded-lg text-sm">
                            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">State Admin</p>
                            {stateAdmins.get(stat.prant) ? (
                                <div className="flex items-center justify-between">
                                    <div className="truncate">
                                        <p className="font-medium truncate">{stateAdmins.get(stat.prant).full_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{stateAdmins.get(stat.prant).email}</p>
                                    </div>
                                    {(currentUserRole === "SUPER_CONTROLLER") && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 hover:bg-muted text-muted-foreground hover:text-primary"
                                                title="Send Password Reset Email"
                                                disabled={processing === `reset-${stateAdmins.get(stat.prant).email}`}
                                                onClick={() => handleResetPassword(stateAdmins.get(stat.prant).email, stat.prant)}
                                            >
                                                <KeyRound className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                title="Dismiss Admin"
                                                disabled={processing === stateAdmins.get(stat.prant).user_id}
                                                onClick={() => handleDismissAdmin(stateAdmins.get(stat.prant).user_id, stat.prant)}
                                            >
                                                <Users className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>No admin assigned</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-primary"
                                        onClick={() => {
                                            setNewUser({ ...newUser, state: stat.prant });
                                            setShowCreateDialog(true);
                                        }}
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="w-4 h-4 mr-2" />
                                <span>{stat.memberCount} Members</span>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Award className="w-4 h-4 mr-2" />
                                <span>{stat.leaderCount} Leaders</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => setSelectedPrant(stat.prant)}
                        >
                            View Details <ArrowRight className="w-3 h-3" />
                        </Button>
                    </GlassCard>
                ))}
            </div>

            {/* View Details Dialog */}
            <Dialog open={!!selectedPrant} onOpenChange={(open) => !open && setSelectedPrant(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            {selectedPrant} Overview
                        </DialogTitle>
                        <DialogDescription>
                            Detailed statistics and active districts in {selectedPrant}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPrant && detailedStats.get(selectedPrant) && (
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <GlassCard className="p-4 bg-primary/5 border-primary/20">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <Users className="w-4 h-4" />
                                        <p className="font-semibold">Total Members</p>
                                    </div>
                                    <p className="text-2xl font-bold">{detailedStats.get(selectedPrant).memberCount}</p>
                                </GlassCard>
                                <GlassCard className="p-4 bg-accent/5 border-accent/20">
                                    <div className="flex items-center gap-2 mb-2 text-accent">
                                        <Award className="w-4 h-4" />
                                        <p className="font-semibold">Leaders</p>
                                    </div>
                                    <p className="text-2xl font-bold">{detailedStats.get(selectedPrant).leaderCount}</p>
                                </GlassCard>
                                <GlassCard className="p-4 bg-green-500/5 border-green-500/20">
                                    <div className="flex items-center gap-2 mb-2 text-green-500">
                                        <MapPin className="w-4 h-4" />
                                        <p className="font-semibold">Active Districts</p>
                                    </div>
                                    <p className="text-2xl font-bold">{detailedStats.get(selectedPrant).districts.size}</p>
                                </GlassCard>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> District Breakdown
                                </h3>
                                <div className="max-h-[300px] overflow-y-auto border rounded-md">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted sticky top-0">
                                            <tr>
                                                <th className="p-3 font-medium">District Name</th>
                                                <th className="p-3 font-medium text-right">Members</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {Object.entries(detailedStats.get(selectedPrant).districtBreakdown || {})
                                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                                .map(([district, count]) => (
                                                    <tr key={district} className="hover:bg-muted/50">
                                                        <td className="p-3">{district}</td>
                                                        <td className="p-3 text-right font-medium">{count as number}</td>
                                                    </tr>
                                                ))}
                                            {Object.keys(detailedStats.get(selectedPrant).districtBreakdown || {}).length === 0 && (
                                                <tr>
                                                    <td colSpan={2} className="p-8 text-center text-muted-foreground">
                                                        No district data available for this state.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setSelectedPrant(null)}>Close</Button>
                        <Button onClick={() => window.location.href = `/admin/members?state=${encodeURIComponent(selectedPrant || '')}`}>
                            <Users className="w-4 h-4 mr-2" /> Manage Members
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showCreateDialog} onOpenChange={(open) => {
                if (!open && createdCredentials) {
                    // Reset if closing after creation
                    setCreatedCredentials(null);
                    setNewUser({ full_name: "", email: "", phone: "", state: "", role: "STATE_CONVENER" });
                    fetchStats();
                }
                setShowCreateDialog(open);
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create State Admin</DialogTitle>
                        <DialogDescription>
                            Provision a new State Admin account. Password will be auto-generated.
                        </DialogDescription>
                    </DialogHeader>

                    {!createdCredentials ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={newUser.full_name}
                                    onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="e.g. gujarat@savishkar.in"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={newUser.phone}
                                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                    placeholder="+91..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>State / Prant</Label>
                                <Select
                                    value={newUser.state}
                                    onValueChange={v => setNewUser({ ...newUser, state: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>
                                        {PRANT_LIST.map(prant => (
                                            <SelectItem key={prant} value={prant}>{prant}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Account Created Successfully!</h4>
                                <div className="space-y-2">
                                    <div>
                                        <Label className="text-xs">Email</Label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 p-2 bg-background rounded border">{createdCredentials.email}</code>
                                            <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(createdCredentials.email)}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Password</Label>
                                        <div className="flex gap-2">
                                            <code className="flex-1 p-2 bg-background rounded border">{createdCredentials.password}</code>
                                            <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(createdCredentials.password)}>
                                                <Copy className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-4">
                                    Please copy these credentials and share them with the state admin securely.
                                    The password will not be shown again.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!createdCredentials ? (
                            <Button onClick={handleCreateStateAdmin} disabled={creating}>
                                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Account
                            </Button>
                        ) : (
                            <Button onClick={() => {
                                setShowCreateDialog(false);
                                setCreatedCredentials(null);
                                setNewUser({ full_name: "", email: "", phone: "", state: "", role: "STATE_CONVENER" });
                                fetchStats();
                            }}>
                                <Check className="w-4 h-4 mr-2" /> Done
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
