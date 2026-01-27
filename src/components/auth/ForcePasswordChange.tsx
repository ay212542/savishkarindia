import { useState } from "react";
import { Loader2, Key, Check, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function ForcePasswordChange() {
    const { profile, refreshProfile } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Only show if profile says so
    // @ts-ignore - Supabase types might not have is_temporary_password yet
    if (!profile || !profile.is_temporary_password) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }
        if (password.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password: password });
            if (error) throw error;

            // Update flag
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ is_temporary_password: false } as any)
                .eq("id", profile!.id);

            if (profileError) throw profileError;

            toast({ title: "Success", description: "Password updated successfully!" });
            await refreshProfile();

        } catch (error: any) {
            console.error("Error updating password:", error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setLoading(false);
    }

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md" hideCloseButton>
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <ShieldAlert className="w-6 h-6" />
                        <DialogTitle>Security Update Required</DialogTitle>
                    </div>
                    <DialogDescription>
                        You are using a temporary password. For your security, please verify your identity by setting a new permanent password.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="password"
                                className="pl-9"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="password"
                                className="pl-9"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Set New Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
