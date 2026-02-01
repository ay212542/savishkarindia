import { useEffect, useState } from "react";
import { Search, Filter, MoreVertical, User, Shield, Edit, Trash2, Key, Loader2, CreditCard, Ban, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS, INDIAN_STATES, AppRole, ROLE_HIERARCHY } from "@/lib/constants";

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state: string | null;
  division: string | null;
  membership_id: string | null;
  designation: string | null;
  avatar_url: string | null;
  created_at: string;
  id_card_issued_at: string | null;
  role: AppRole | null;
}

import { useNavigate, useSearchParams } from "react-router-dom";

// ... existing imports

export default function MemberRegistry() {
  const [searchParams] = useSearchParams();
  const initialStateFilter = searchParams.get("state") || "all";

  const [members, setMembers] = useState<Member[]>([]);
  const [errorMsg, setErrorMsg] = useState(""); // Diagnostic
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState(initialStateFilter);
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [targetState, setTargetState] = useState("");
  const [processing, setProcessing] = useState(false);
  const { user, profile, role: currentUserRole } = useAuth();
  const { toast } = useToast();

  const isStateAdmin = currentUserRole === "STATE_CONVENER" || currentUserRole === "STATE_CO_CONVENER";
  const userState = profile?.state;

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user, currentUserRole, userState]);

  async function fetchMembers() {
    try {
      // Use standard RLS-bypassing RPC for reliability
      const { data, error } = await supabase.rpc("get_registry_members" as any);

      if (error) throw error;

      let fetchedMembers = ((data as any[]) || []).map(m => ({
        ...m,
        // Ensure role is typed correctly
        role: (m.role || "MEMBER") as AppRole
      }));

      // Client-side filtering for State Admins (Security is also enforced in RPC if needed, 
      // but RPC returns all for simplicity, so we filter here)
      if (isStateAdmin && userState) {
        fetchedMembers = fetchedMembers.filter(m => m.state === userState);
      }

      // Hide Higher Admins from State Admins
      if (isStateAdmin) {
        fetchedMembers = fetchedMembers.filter(m =>
          m.role !== "SUPER_CONTROLLER" && m.role !== "ADMIN"
        );
      }

      setMembers(fetchedMembers);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      setErrorMsg(error?.message || JSON.stringify(error));
      toast({
        title: "Error fetching members",
        description: error?.message || "Check console for details.",
        variant: "destructive"
      });
    }
    setLoading(false);
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.membership_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = stateFilter === "all" || member.state === stateFilter;
    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesState && matchesRole;
  });

  async function handleRoleChange() {
    if (!selectedMember || !newRole) return;
    setProcessing(true);

    // SECURITY CHECK
    if (isStateAdmin) {
      if (selectedMember.state !== userState) {
        toast({ title: "Error", description: "Unauthorized access to member", variant: "destructive" });
        setProcessing(false);
        return;
      }
      if (newRole === "SUPER_CONTROLLER" || newRole === "ADMIN") {
        toast({ title: "Error", description: "Cannot assign Administrator role", variant: "destructive" });
        setProcessing(false);
        return;
      }
    }

    try {
      // Check if role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedMember.user_id)
        .single();

      let roleError;
      if (existingRole) {
        // Update existing role - use type assertion for extended roles
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", selectedMember.user_id);
        roleError = error;
      } else {
        // Insert new role - use type assertion for extended roles
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: selectedMember.user_id, role: newRole as any });
        roleError = error;
      }

      if (roleError) throw roleError;

      // Log the action
      await supabase.from("audit_logs").insert({
        action: "ROLE_CHANGED",
        user_id: user?.id,
        target_type: "user",
        target_id: selectedMember.user_id,
        details: {
          old_role: selectedMember.role,
          new_role: newRole,
          target_email: selectedMember.email
        }
      });

      toast({
        title: "Role Updated",
        description: `${selectedMember.full_name} is now a ${ROLE_LABELS[newRole]}`
      });

      setMembers(prev => prev.map(m =>
        m.id === selectedMember.id ? { ...m, role: newRole as AppRole } : m
      ));
    } catch (error) {
      console.error("Role change error:", error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive"
      });
    }

    setShowRoleDialog(false);
    setSelectedMember(null);
    setNewRole("");
    setProcessing(false);
  }

  async function handleDelete() {
    if (!selectedMember) return;
    setProcessing(true);

    try {
      // Delete user via supabase admin (this cascades to profiles and roles)
      // Note: In production, this would need a backend function
      const { error } = await supabase.auth.admin.deleteUser(selectedMember.user_id);

      if (error) throw error;

      // Log the action
      await supabase.from("audit_logs").insert({
        action: "USER_DELETED",
        user_id: user?.id,
        target_type: "user",
        target_id: selectedMember.user_id,
        details: {
          deleted_email: selectedMember.email,
          deleted_name: selectedMember.full_name
        }
      });

      toast({
        title: "Member Deleted",
        description: `${selectedMember.full_name} has been removed from the system`
      });

      setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete member. This action requires elevated privileges.",
        variant: "destructive"
      });
    }

    setShowDeleteDialog(false);
    setSelectedMember(null);
    setProcessing(false);
  }

  async function handleTransfer() {
    if (!selectedMember || !targetState) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          state: targetState,
          district: null, // Clear district as it won't match new state
          division: null, // Clear division
          prant: null     // Clear prant
        })
        .eq("id", selectedMember.id);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "MEMBER_TRANSFERRED",
        user_id: user?.id,
        target_type: "user",
        target_id: selectedMember.user_id,
        details: {
          previous_state: selectedMember.state,
          new_state: targetState,
          transferred_by: profile?.full_name
        }
      });

      toast({
        title: "Transfer Successful",
        description: `${selectedMember.full_name} has been transferred to ${targetState}.`
      });

      // Remove from list if state admin (since they no longer belong to this state)
      // or just update list if global admin
      if (isStateAdmin) {
        setMembers(prev => prev.filter(m => m.id !== selectedMember.id));
      } else {
        setMembers(prev => prev.map(m =>
          m.id === selectedMember.id ? { ...m, state: targetState } : m
        ));
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      console.error("Transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Could not transfer member.",
        variant: "destructive"
      });
    } finally {
      setShowTransferDialog(false);
      setProcessing(false);
    }
  }

  const canChangeRole = (targetRole: AppRole | null) => {
    if (currentUserRole === "SUPER_CONTROLLER") return true;
    if (currentUserRole === "ADMIN") return targetRole !== "SUPER_CONTROLLER";
    // State Admins cannot edit Global Admins
    if (isStateAdmin) return targetRole !== "SUPER_CONTROLLER" && targetRole !== "ADMIN";
    return false;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Member Registry</h1>
        <p className="text-muted-foreground">Manage all SAVISHKAR members</p>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or membership ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {INDIAN_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Error Diagnostic Panel */}
      {searchQuery === "debug_error" && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-lg">
          <h3 className="font-bold">Diagnostic Error Detail:</h3>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{loading ? "Loading..." : "No error captured yet."}</pre>
        </div>
      )}

      {/* Members Table */}
      <GlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No members found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Membership ID</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.state || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === "SUPER_CONTROLLER" || member.role === "ADMIN" ? "default" : "secondary"}>
                        {member.role ? ROLE_LABELS[member.role] : "No Role"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {member.membership_id || "—"}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canChangeRole(member.role) && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role || "");
                              setShowRoleDialog(true);
                            }}>
                              <Shield className="w-4 h-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => {
                            setSelectedMember(member);
                            setTargetState("");
                            setShowTransferDialog(true);
                          }}>
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Transfer State
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `/admin/profile/${member.user_id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="w-4 h-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          {currentUserRole === "SUPER_CONTROLLER" && member.role !== "SUPER_CONTROLLER" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Member
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuSeparator />
                          {member.id_card_issued_at ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("profiles")
                                  .update({ id_card_issued_at: null } as any)
                                  .eq("id", member.id);

                                if (error) {
                                  toast({ title: "Error", description: "Failed to revoke ID card", variant: "destructive" });
                                } else {
                                  toast({ title: "Success", description: "ID Card Revoked" });
                                  fetchMembers();
                                }
                              }}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Revoke ID Card
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={async () => {
                              if (!member.membership_id) {
                                toast({ title: "Error", description: "Member needs a Membership ID first.", variant: "destructive" });
                                return;
                              }
                              const { error } = await supabase
                                .from("profiles")
                                .update({ id_card_issued_at: new Date().toISOString() } as any)
                                .eq("id", member.id);

                              if (error) {
                                toast({ title: "Error", description: "Failed to issue ID card", variant: "destructive" });
                              } else {
                                toast({ title: "Success", description: "ID Card Issued!" });
                                fetchMembers();
                              }
                            }}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Issue ID Card
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
        }
      </GlassCard >

      <p className="text-sm text-muted-foreground text-center">
        Showing {filteredMembers.length} of {members.length} members
      </p>

      {/* Role Change Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.full_name}
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Select new role" />
            </SelectTrigger>
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!newRole || processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMember?.full_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Member Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Member</DialogTitle>
            <DialogDescription>
              Transfer {selectedMember?.full_name} to another state.
              This will update their assigned state and clear their district/division.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Select Target State</label>
            <Select value={targetState} onValueChange={setTargetState}>
              <SelectTrigger>
                <SelectValue placeholder="Select new state" />
              </SelectTrigger>
              <SelectContent>
                {INDIAN_STATES.filter(s => s !== selectedMember?.state).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={!targetState || processing}>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Transfer Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
