import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Calendar, Users, QrCode, Plus, Activity, FileCheck, ArrowRight,
    ClipboardList, DownloadCloud, Trash2, Eye, Loader2, UserPlus, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventForm {
    id: string;
    title: string;
    event_name: string;
    created_at: string;
    response_count: number;
    is_active: boolean;
}

interface FormResponse {
    id: string;
    respondent_name: string;
    respondent_email: string;
    respondent_phone: string;
    created_at: string;
    data: Record<string, string>;
}

export default function EventManager() {
    const { role, profile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stats, setStats] = useState({ activeEvents: 0, totalForms: 0, totalResponses: 0 });
    const [forms, setForms] = useState<EventForm[]>([]);
    const [responses, setResponses] = useState<FormResponse[]>([]);
    const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingResponses, setLoadingResponses] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newFormTitle, setNewFormTitle] = useState("");
    const [newEventName, setNewEventName] = useState("");
    const [creating, setCreating] = useState(false);

    const isSuperController = role === "SUPER_CONTROLLER" || role === "ADMIN";

    // Access guard
    useEffect(() => {
        if (role && role !== "EVENT_MANAGER" && role !== "SUPER_CONTROLLER" && role !== "ADMIN") {
            navigate("/admin");
        }
    }, [role, navigate]);

    const fetchStats = useCallback(async () => {
        try {
            const [eventsRes, formsRes] = await Promise.all([
                supabase.from("events").select("*", { count: "exact", head: true }).eq("is_published", true),
                supabase.from("event_forms" as any).select("id, response_count").limit(50)
            ]);
            const totalForms = (formsRes.data as any[])?.length || 0;
            const totalResponses = (formsRes.data as any[])?.reduce((acc: number, f: any) => acc + (f.response_count || 0), 0) || 0;
            setStats({ activeEvents: eventsRes.count || 0, totalForms, totalResponses });
            setForms((formsRes.data || []) as any);
        } catch {
            // table might not exist yet
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const fetchResponses = async (formId: string) => {
        setLoadingResponses(true);
        setSelectedFormId(formId);
        setActiveTab("responses");
        try {
            const { data } = await supabase
                .from("event_form_responses" as any)
                .select("*")
                .eq("form_id", formId)
                .order("created_at", { ascending: false });
            setResponses((data || []) as any);
        } catch {
            setResponses([]);
        }
        setLoadingResponses(false);
    };

    const handleCreateForm = async () => {
        if (!newFormTitle.trim() || !newEventName.trim()) {
            toast({ title: "Fill all fields", variant: "destructive" });
            return;
        }
        setCreating(true);
        try {
            const { error } = await supabase.from("event_forms" as any).insert({
                title: newFormTitle,
                event_name: newEventName,
                created_by: profile?.user_id,
                is_active: true,
                response_count: 0
            });
            if (error) throw error;
            toast({ title: "Form Created!", description: `"${newFormTitle}" is now live.` });
            setShowCreateForm(false);
            setNewFormTitle("");
            setNewEventName("");
            fetchStats();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
        setCreating(false);
    };

    const exportCSV = () => {
        if (!responses.length) return;
        const headers = ["Name", "Email", "Phone", "Submitted At"];
        const rows = responses.map(r => [
            r.respondent_name || "-",
            r.respondent_email || "-",
            r.respondent_phone || "-",
            new Date(r.created_at).toLocaleString("en-IN")
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `responses-${selectedFormId}.csv`;
        a.click();
    };

    const statCards = [
        { label: "Active Events", value: stats.activeEvents, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
        { label: "Total Forms", value: stats.totalForms, icon: ClipboardList, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Total Responses", value: stats.totalResponses, icon: FileCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" }
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                        <Activity className="w-6 h-6 text-primary" /> Event Management Desk
                    </h1>
                    <p className="text-muted-foreground text-sm">Welcome back, {profile?.full_name}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {isSuperController && (
                        <Button variant="outline" className="gap-2" onClick={() => navigate("/admin/create-event-user")}>
                            <UserPlus className="w-4 h-4" /> Create Event Manager
                        </Button>
                    )}
                    <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4" /> New Form
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-auto p-1 bg-muted/30">
                    <TabsTrigger value="dashboard" className="gap-2"><Activity className="w-4 h-4" /> Dashboard</TabsTrigger>
                    <TabsTrigger value="forms" className="gap-2"><ClipboardList className="w-4 h-4" /> Forms</TabsTrigger>
                    <TabsTrigger value="responses" className="gap-2"><FileCheck className="w-4 h-4" /> Responses</TabsTrigger>
                    <TabsTrigger value="idcard" className="gap-2"><QrCode className="w-4 h-4" /> ID Cards</TabsTrigger>
                </TabsList>

                {/* Dashboard Tab */}
                <TabsContent value="dashboard" className="mt-6 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4">
                        {statCards.map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <GlassCard className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                            <p className={`text-3xl font-display font-bold ${stat.color}`}>
                                                {loading ? "—" : stat.value}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                                            <Icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <GlassCard>
                            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" /> Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab("forms")}>
                                    <ClipboardList className="w-6 h-6 text-blue-400" />
                                    <span className="text-xs">My Forms</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab("responses")}>
                                    <FileCheck className="w-6 h-6 text-emerald-400" />
                                    <span className="text-xs">Responses</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab("idcard")}>
                                    <QrCode className="w-6 h-6 text-purple-400" />
                                    <span className="text-xs">Generate IDs</span>
                                </Button>
                                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate("/admin/programs")}>
                                    <Calendar className="w-6 h-6 text-primary" />
                                    <span className="text-xs">Events</span>
                                </Button>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-display font-semibold mb-4">Recent Forms</h3>
                            {forms.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    No forms yet — create your first form!
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {forms.slice(0, 4).map(f => (
                                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                            onClick={() => fetchResponses(f.id)}>
                                            <div>
                                                <p className="font-medium text-sm">{f.title}</p>
                                                <p className="text-xs text-muted-foreground">{f.event_name} · {f.response_count || 0} responses</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </TabsContent>

                {/* Forms Tab */}
                <TabsContent value="forms" className="mt-6">
                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-semibold">Registration Forms</h3>
                            <Button size="sm" className="gap-2" onClick={() => setShowCreateForm(true)}>
                                <Plus className="w-4 h-4" /> Create Form
                            </Button>
                        </div>
                        {forms.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>No forms yet.</p>
                                <Button className="mt-4 gap-2" onClick={() => setShowCreateForm(true)}>
                                    <Plus className="w-4 h-4" /> Create Your First Form
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {forms.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-muted/10 hover:bg-muted/20 transition-colors">
                                        <div>
                                            <p className="font-semibold">{f.title}</p>
                                            <p className="text-sm text-muted-foreground">{f.event_name}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={f.is_active ? "default" : "secondary"}>{f.is_active ? "Active" : "Closed"}</Badge>
                                            <span className="text-sm text-muted-foreground">{f.response_count || 0} responses</span>
                                            <Button size="sm" variant="outline" className="gap-2" onClick={() => fetchResponses(f.id)}>
                                                <Eye className="w-4 h-4" /> View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </TabsContent>

                {/* Responses Tab */}
                <TabsContent value="responses" className="mt-6">
                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-semibold">
                                Form Responses {selectedFormId && <span className="text-sm text-muted-foreground font-normal ml-2">(Form ID: {selectedFormId.slice(0, 8)}...)</span>}
                            </h3>
                            {responses.length > 0 && (
                                <Button size="sm" variant="outline" className="gap-2" onClick={exportCSV}>
                                    <DownloadCloud className="w-4 h-4" /> Export CSV
                                </Button>
                            )}
                        </div>
                        {!selectedFormId ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>Select a form from the Forms tab to view responses.</p>
                                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("forms")}>
                                    Go to Forms <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ) : loadingResponses ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : responses.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No responses received yet for this form.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-muted-foreground">
                                            <th className="text-left py-3 px-3">#</th>
                                            <th className="text-left py-3 px-3">Name</th>
                                            <th className="text-left py-3 px-3">Email</th>
                                            <th className="text-left py-3 px-3">Phone</th>
                                            <th className="text-left py-3 px-3">Submitted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {responses.map((r, i) => (
                                            <tr key={r.id} className="border-b border-white/5 hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-3 text-muted-foreground">{i + 1}</td>
                                                <td className="py-3 px-3 font-medium">{r.respondent_name || "-"}</td>
                                                <td className="py-3 px-3">{r.respondent_email || "-"}</td>
                                                <td className="py-3 px-3">{r.respondent_phone || "-"}</td>
                                                <td className="py-3 px-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </TabsContent>

                {/* ID Card Tab */}
                <TabsContent value="idcard" className="mt-6">
                    <GlassCard>
                        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-purple-400" /> Delegate ID Card Generator
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Event Name (appears on card)</Label>
                                    <Input placeholder="e.g. National Youth Summit 2026" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Delegate Name</Label>
                                    <Input placeholder="Full name" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Delegate Role / Title</Label>
                                    <Input placeholder="e.g. Delegate, Speaker, Organizer" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Registration ID</Label>
                                    <Input placeholder="e.g. DEL-001" />
                                </div>
                                <Button className="w-full gap-2 mt-4">
                                    <QrCode className="w-4 h-4" /> Generate ID Card (PDF)
                                </Button>
                                <p className="text-xs text-muted-foreground">Full ID card generation with QR code will be available after DB setup is complete.</p>
                            </div>

                            {/* Preview Card */}
                            <div className="flex items-center justify-center">
                                <div className="w-72 h-44 rounded-2xl overflow-hidden shadow-xl border border-primary/30 bg-gradient-to-br from-primary/20 via-background to-accent/10 p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs font-bold tracking-widest text-primary opacity-80">SAVISHKAR</div>
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Users className="w-4 h-4 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-display font-bold">Delegate Name</p>
                                        <p className="text-xs text-muted-foreground">Position / Role</p>
                                        <p className="text-xs text-primary mt-1">National Youth Summit 2026</p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <p className="text-xs font-mono text-muted-foreground">ID: DEL-001</p>
                                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-[8px] text-white/50">QR</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </TabsContent>
            </Tabs>

            {/* Create Form Dialog */}
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Registration Form</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Form Title *</Label>
                            <Input placeholder="e.g. Delegate Registration Form" value={newFormTitle}
                                onChange={e => setNewFormTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Event Name *</Label>
                            <Input placeholder="e.g. National Youth Summit 2026" value={newEventName}
                                onChange={e => setNewEventName(e.target.value)} />
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg text-sm text-muted-foreground">
                            Full form builder with custom fields will open after creation. The form will automatically collect: Name, Email, Phone, and any custom fields you add.
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                            <Button className="flex-1 gap-2" onClick={handleCreateForm} disabled={creating}>
                                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Form
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
