import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Copy, CheckCircle, ArrowLeft, Calendar, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

function generatePassword(length = 12): string {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const special = "!@#$%&*";
    const all = upper + lower + digits + special;
    let pw = "";
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    pw += special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < length; i++) pw += all[Math.floor(Math.random() * all.length)];
    return pw.split("").sort(() => Math.random() - 0.5).join("");
}

export default function CreateEventUser() {
    const { role } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        event_name: "",
        expiry_date: "",
        password: generatePassword()
    });
    const [showPassword, setShowPassword] = useState(false);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState<{ email: string; password: string; event_name: string } | null>(null);
    const [copied, setCopied] = useState<"email" | "password" | null>(null);

    // Only Super Controller can access
    if (role && role !== "SUPER_CONTROLLER") {
        navigate("/admin");
        return null;
    }

    const copyToClipboard = (text: string, type: "email" | "password") => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name || !form.email || !form.event_name || !form.expiry_date) {
            toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" });
            return;
        }
        setCreating(true);
        try {
            // Step 1: Create the user account
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: { full_name: form.full_name },
                    emailRedirectTo: `${window.location.origin}/`
                }
            });

            if (signUpError) throw signUpError;
            const newUserId = signUpData.user?.id;
            if (!newUserId) throw new Error("Failed to create user account");

            // Step 2: Create profile record
            const membershipId = `SAV-EM-${Date.now().toString().slice(-6)}`;
            await supabase.from("profiles").insert({
                user_id: newUserId,
                email: form.email,
                full_name: form.full_name,
                membership_id: membershipId,
                designation: `Event Manager – ${form.event_name}`,
                event_manager_expiry: new Date(form.expiry_date).toISOString()
            } as any);

            // Step 3: Assign EVENT_MANAGER role
            await supabase.from("user_roles").insert({
                user_id: newUserId,
                role: "EVENT_MANAGER" as any
            });

            // Step 4: Log the action
            const { data: { user: adminUser } } = await supabase.auth.getUser();
            await supabase.from("audit_logs").insert({
                action: "EVENT_MANAGER_CREATED",
                user_id: adminUser?.id,
                target_type: "user",
                target_id: newUserId,
                details: { email: form.email, event_name: form.event_name, expiry: form.expiry_date }
            });

            setCreated({ email: form.email, password: form.password, event_name: form.event_name });
            toast({ title: "Event Manager Created!", description: `Account created for ${form.full_name}` });
        } catch (err: any) {
            console.error(err);
            toast({ title: "Error", description: err.message || "Failed to create user", variant: "destructive" });
        }
        setCreating(false);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/event-manager")} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div>
                    <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-primary" /> Create Event Manager
                    </h1>
                    <p className="text-muted-foreground text-sm">Issue temporary event access credentials</p>
                </div>
            </div>

            {created ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <GlassCard className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h2 className="font-display text-xl font-bold text-emerald-400">Account Created Successfully!</h2>
                            <p className="text-muted-foreground mt-1">Share these credentials with the Event Manager securely.</p>
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
                                <Shield className="w-4 h-4" /> IMPORTANT — Save these credentials now!
                            </div>
                            <p className="text-sm text-amber-300/80">The password cannot be recovered after this dialog is closed.</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground">Event Assigned</p>
                                    <p className="font-semibold">{created.event_name}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground">Email / Username</p>
                                    <p className="font-mono font-medium">{created.email}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(created.email, "email")}>
                                    {copied === "email" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-xs text-muted-foreground">Password</p>
                                    <p className="font-mono font-medium tracking-widest">{created.password}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(created.password, "password")}>
                                    {copied === "password" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => {
                                setCreated(null);
                                setForm({ full_name: "", email: "", event_name: "", expiry_date: "", password: generatePassword() });
                            }}>
                                Create Another
                            </Button>
                            <Button className="flex-1" onClick={() => navigate("/admin/event-manager")}>
                                Go to Event Dashboard
                            </Button>
                        </div>
                    </GlassCard>
                </motion.div>
            ) : (
                <GlassCard>
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name *</Label>
                                <Input
                                    placeholder="e.g. Rahul Sharma"
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email (Login ID) *</Label>
                                <Input
                                    type="email"
                                    placeholder="eventmanager@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Event Name *</Label>
                                <Input
                                    placeholder="e.g. National Youth Summit 2026"
                                    value={form.event_name}
                                    onChange={e => setForm({ ...form, event_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Access Expiry Date *
                                </Label>
                                <Input
                                    type="datetime-local"
                                    value={form.expiry_date}
                                    onChange={e => setForm({ ...form, expiry_date: e.target.value })}
                                    min={new Date().toISOString().slice(0, 16)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Generated Password</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        readOnly
                                        className="font-mono pr-10 bg-muted/40"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" onClick={() => setForm({ ...form, password: generatePassword() })}>
                                    Regenerate
                                </Button>
                                <Button type="button" variant="outline" onClick={() => copyToClipboard(form.password, "password")}>
                                    {copied === "password" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-amber-500">⚠️ Save this password before submitting — it won't be shown again after creation.</p>
                        </div>

                        <div className="p-4 bg-muted/20 rounded-xl border border-white/5 text-sm text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground">What this account can do:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Create and manage delegate registration forms</li>
                                <li>View and export form responses</li>
                                <li>Design and generate delegate ID cards</li>
                                <li>Access expires automatically on the date set above</li>
                            </ul>
                        </div>

                        <Button type="submit" disabled={creating} className="w-full gap-2">
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            {creating ? "Creating Account..." : "Create Event Manager Account"}
                        </Button>
                    </form>
                </GlassCard>
            )}
        </div>
    );
}
