import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Plus, KeyRound, Trash2, Search, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function AssignEventManager() {
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const { user, role: currentUserRole } = useAuth();
    const navigate = useNavigate();

    // Dialog state
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    // Form state
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [eventName, setEventName] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const { toast } = useToast();

    // Guard: Only SUPER_CONTROLLER and ADMIN
    useEffect(() => {
        if (currentUserRole && !["SUPER_CONTROLLER", "ADMIN"].includes(currentUserRole)) {
            navigate("/admin");
        }
    }, [currentUserRole, navigate]);

    const fetchManagers = async () => {
        if (!user || !["SUPER_CONTROLLER", "ADMIN"].includes(currentUserRole || "")) return;

        setLoading(true);
        try {
            const { data: rolesData, error: rolesError } = await supabase
                .from("user_roles")
                .select("user_id, role")
                .eq("role", "EVENT_MANAGER");

            if (rolesError) throw rolesError;

            if (!rolesData || rolesData.length === 0) {
                setManagers([]);
                return;
            }

            const userIds = rolesData.map(r => r.user_id);
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("*")
                .in("user_id", userIds);

            if (profilesError) throw profilesError;

            // Combine and sort
            const combined = profilesData.map(p => ({
                ...p,
                role: rolesData.find(r => r.user_id === p.user_id)?.role,
            }));

            setManagers(combined);
        } catch (error) {
            console.error("Error fetching event managers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
    }, [user, currentUserRole]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 2) {
                handleSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    async function handleSearch(query: string) {
        setSearching(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("user_id, full_name, email, phone, membership_id")
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,membership_id.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setSearching(false);
        }
    }

    async function handleRevokeAccess(managerUserId: string, name: string) {
        if (!confirm(`Are you sure you want to revoke Event Manager access from ${name}?`)) return;
        setProcessing(managerUserId);

        try {
            // First update profile designation back to Member and clear event manager fields
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    designation: "Member",
                    event_manager_expiry: null
                })
                .eq("user_id", managerUserId);

            if (profileError) throw profileError;

            // Then delete the EVENT_MANAGER role
            const { error: roleError } = await supabase
                .from("user_roles")
                .delete()
                .match({ user_id: managerUserId, role: "EVENT_MANAGER" });

            // If they don't have any other roles, user_roles won't have an entry, 
            // which AuthContext interprets as "MEMBER". This is safe.

            // Ensure they have at least MEMBER role if we deleted all roles
            const { data: existingRoles } = await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", managerUserId);

            if (!existingRoles || existingRoles.length === 0) {
                await supabase
                    .from("user_roles")
                    .insert({ user_id: managerUserId, role: "MEMBER" });
            }

            toast({ title: "Access Revoked", description: `${name} is no longer an Event Manager.` });
            fetchManagers();
        } catch (error: any) {
            console.error("Revoke error:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setProcessing(null);
        }
    }

    async function handleAssignRole() {
        if (!selectedUser || !eventName || !expiryDate) {
            toast({ title: "Error", description: "Please fill all required fields and select a user.", variant: "destructive" });
            return;
        }

        setProcessing("assigning");

        try {
            // Set the expiry to the very end of the selected day
            const endOfDayExpiry = new Date(expiryDate);
            endOfDayExpiry.setHours(23, 59, 59, 999);

            // 1. Update Profile
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    designation: `Event Manager – ${eventName}`,
                    event_manager_expiry: endOfDayExpiry.toISOString()
                })
                .eq("user_id", selectedUser.user_id);

            if (profileError) throw profileError;

            // 2. Clear existing MEMBER role if they only had that, to prevent dupes, or just upsert
            // Best to delete "MEMBER" if it exists, then insert "EVENT_MANAGER"
            await supabase
                .from("user_roles")
                .delete()
                .match({ user_id: selectedUser.user_id, role: "MEMBER" });

            // 3. Insert EVENT_MANAGER role
            // Upsert in case they somehow already had it
            const { error: roleError } = await supabase
                .from("user_roles")
                .upsert({
                    user_id: selectedUser.user_id,
                    role: "EVENT_MANAGER"
                }, { onConflict: "user_id,role" });

            if (roleError) throw roleError;

            // 4. Audit Log
            await supabase.from("audit_logs").insert({
                action: "EVENT_MANAGER_ASSIGNED",
                user_id: user?.id,
                target_type: "user",
                target_id: selectedUser.user_id,
                details: { event_name: eventName, expiry: expiryDate }
            });

            toast({ title: "Success", description: `${selectedUser.full_name} is now an Event Manager.` });

            // Cleanup state
            setShowAssignDialog(false);
            setSelectedUser(null);
            setSearchQuery("");
            setEventName("");
            setExpiryDate("");

            fetchManagers();
        } catch (error: any) {
            console.error("Assignment error:", error);
            toast({ title: "Error", description: error.message || "Failed to assign role", variant: "destructive" });
        } finally {
            setProcessing(null);
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
                    <h1 className="text-2xl font-bold font-display text-white">Event Manager Assignment</h1>
                    <p className="text-muted-foreground mt-1">Search existing members and grant them temporary Event Manager access.</p>
                </div>
                <Button onClick={() => setShowAssignDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Assign Event Manager
                </Button>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 font-medium text-sm text-muted-foreground">Name</th>
                                <th className="p-4 font-medium text-sm text-muted-foreground">Contact</th>
                                <th className="p-4 font-medium text-sm text-muted-foreground">Event & Expiry</th>
                                <th className="p-4 font-medium text-sm text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {managers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No Event Managers currently assigned.
                                    </td>
                                </tr>
                            ) : managers.map((m) => (
                                <tr key={m.user_id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{m.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{m.membership_id}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-300">
                                        <div>{m.email}</div>
                                        <div className="text-xs text-muted-foreground">{m.phone || "No phone"}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium border border-primary/20">
                                            {m.designation?.replace("Event Manager – ", "") || "Unknown Event"}
                                        </span>
                                        <div className="text-xs text-amber-400 mt-1">
                                            Expires: {m.event_manager_expiry ? new Date(m.event_manager_expiry).toLocaleDateString() : "Never"}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleRevokeAccess(m.user_id, m.full_name)}
                                            disabled={processing === m.user_id}
                                            className="h-8 gap-2"
                                        >
                                            {processing === m.user_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            Revoke Access
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            <Dialog open={showAssignDialog} onOpenChange={(open) => {
                setShowAssignDialog(open);
                if (!open) {
                    setSearchQuery("");
                    setSelectedUser(null);
                    setEventName("");
                    setExpiryDate("");
                }
            }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Assign Event Manager</DialogTitle>
                        <DialogDescription>
                            Find an existing member and grant them Event Manager privileges.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Selected User Display */}
                        {selectedUser ? (
                            <div className="p-4 border rounded-xl bg-primary/5 flex items-start justify-between">
                                <div className="space-y-1">
                                    <p className="font-medium text-sm flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-primary" />
                                        {selectedUser.full_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                    <p className="text-xs font-mono text-muted-foreground">{selectedUser.membership_id}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                                    Change
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Label>Search Member</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, email, or SAV ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                {/* Search Results */}
                                {searchQuery.length > 2 && (
                                    <div className="mt-2 border rounded-md overflow-hidden bg-background">
                                        {searching ? (
                                            <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
                                        ) : searchResults.length > 0 ? (
                                            <div className="divide-y max-h-40 overflow-auto">
                                                {searchResults.map((res) => (
                                                    <div
                                                        key={res.user_id}
                                                        className="p-3 bg-muted/20 hover:bg-muted/50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            setSelectedUser(res);
                                                            setSearchQuery("");
                                                        }}
                                                    >
                                                        <div className="font-medium text-sm">{res.full_name}</div>
                                                        <div className="text-xs text-muted-foreground">{res.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-3 text-sm text-muted-foreground text-center">
                                                No members found.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Event Details */}
                        {selectedUser && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                <div className="space-y-2">
                                    <Label htmlFor="event_name">Event Name *</Label>
                                    <Input
                                        id="event_name"
                                        placeholder="e.g. Ideathon 2026"
                                        value={eventName}
                                        onChange={(e) => setEventName(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">This will be displayed as their role designation.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry">Access Expiry Date *</Label>
                                    <Input
                                        id="expiry"
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">Event Manager access will automatically expire after this date.</p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleAssignRole}
                            className="w-full mt-4"
                            disabled={processing === "assigning" || !selectedUser || !eventName || !expiryDate}
                        >
                            {processing === "assigning" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            {processing === "assigning" ? "Assigning..." : "Assign Event Manager Role"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
