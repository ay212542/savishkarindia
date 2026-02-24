import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Calendar, Users, QrCode, Plus, Activity, FileCheck, ArrowRight,
    ClipboardList, DownloadCloud, Trash2, Eye, Loader2, UserPlus, ChevronRight, Upload,
    Settings2, Save, X, ToggleRight, CreditCard, FileUp, FileDown, RefreshCcw, Copy, ExternalLink
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
import * as XLSX from 'xlsx';
import QRCode from "react-qr-code";

// Removed Event interface as it is decoupled from the public events table

interface Delegate {
    id: string;
    manager_id: string; // Links to the Event Manager who created them, rather than a global event_id
    event_name: string; // The text name of the event they are assigned to
    name: string;
    email: string | null;
    phone: string | null;
    role_in_event: string | null;
    delegation: string | null;
    created_at: string;
    custom_data: Record<string, any> | null;
}

interface FormField {
    id: string;
    label: string;
    type: "text" | "number" | "email" | "tel" | "select";
    required: boolean;
    options?: string[]; // For select type
}

interface EventForm {
    id: string;
    event_name: string;
    fields: FormField[];
    is_active: boolean;
}

export default function EventManager() {
    const { role, profile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stats, setStats] = useState({ totalDelegates: 0 });
    const [delegates, setDelegates] = useState<Delegate[]>([]);
    const [selectedEventName, setSelectedEventName] = useState<string>("My Event");
    const [loading, setLoading] = useState(true);
    const [loadingDelegates, setLoadingDelegates] = useState(false);

    // Excel upload state
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ID Card Gen state
    const [selectedDelegate, setSelectedDelegate] = useState<Delegate | null>(null);
    const [viewingDelegate, setViewingDelegate] = useState<Delegate | null>(null);
    const idCardRef = useRef<HTMLDivElement>(null);

    // Form Builder State
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [isFormActive, setIsFormActive] = useState(true);
    const [savingForm, setSavingForm] = useState(false);
    const [fetchingForm, setFetchingForm] = useState(false);
    const [hasExistingForm, setHasExistingForm] = useState(false);

    const isSuperController = role === "SUPER_CONTROLLER" || role === "ADMIN";

    // Access guard
    useEffect(() => {
        if (role && role !== "EVENT_MANAGER" && role !== "SUPER_CONTROLLER" && role !== "ADMIN") {
            navigate("/admin");
        }
    }, [role, navigate]);

    const fetchStats = useCallback(async () => {
        try {
            // Event Managers only see their own delegates. Super controllers see all.
            let query = supabase.from("event_delegates" as any).select("*", { count: "exact" });

            if (role === "EVENT_MANAGER" && profile?.user_id) {
                query = query.eq("manager_id", profile.user_id);
                // Extract event name from designation (e.g., "Event Manager - Ideathon")
                const eName = profile.designation?.replace("Event Manager – ", "").replace("Event Manager - ", "") || "Assigned Event";
                setSelectedEventName(eName);
            } else {
                setSelectedEventName("All Managed Events");
            }

            const delegatesRes = await query;

            setStats({
                totalDelegates: delegatesRes.count || 0
            });

            if (profile?.user_id) {
                fetchDelegates();
            }
        } catch (e) {
            console.error("Error fetching event stats", e);
            toast({ title: "Setup Required", description: "The event_delegates table needs to be updated.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [role, profile]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const fetchDelegates = async () => {
        setLoadingDelegates(true);
        try {
            let query = supabase
                .from("event_delegates" as any)
                .select("*")
                .order("created_at", { ascending: false });

            if (role === "EVENT_MANAGER" && profile?.user_id) {
                query = query.eq("manager_id", profile.user_id);
            }

            const { data } = await query;
            setDelegates((data || []) as any);
        } catch {
            setDelegates([]);
        }
        setLoadingDelegates(false);
    };

    const fetchEventForm = async () => {
        if (!profile?.user_id) return;
        setFetchingForm(true);
        try {
            const { data, error } = await (supabase
                .from("event_forms" as any)
                .select("*")
                .eq("manager_id", profile.user_id)
                .maybeSingle() as any);

            if (data) {
                setFormFields(data.fields as FormField[]);
                setIsFormActive(data.is_active);
            }
        } catch (e) {
            console.error("Error fetching form", e);
        } finally {
            setFetchingForm(false);
        }
    };

    useEffect(() => {
        if (activeTab === "formbuilder") {
            fetchEventForm();
        }
    }, [activeTab]);

    const handleSaveForm = async () => {
        if (!profile?.user_id) return;
        setSavingForm(true);
        try {
            const { error } = await supabase
                .from("event_forms" as any)
                .upsert({
                    manager_id: profile.user_id,
                    event_name: selectedEventName,
                    fields: formFields,
                    is_active: isFormActive
                }, { onConflict: 'manager_id' });

            if (error) {
                // Handle schema cache error specifically
                if (error.message?.includes("fields")) {
                    toast({
                        title: "Schema Refresh Needed",
                        description: "Please run the SQL command provided to restore the form schema.",
                        variant: "destructive"
                    });
                } else {
                    throw error;
                }
            }

            toast({ title: "Form Saved", description: "Registration form is now syncronized with the portal." });
            setHasExistingForm(true);
        } catch (error: any) {
            console.error("Error saving form", error);
            toast({
                title: "Save Failed",
                description: error.message || "Failed to save form configuration.",
                variant: "destructive"
            });
        } finally {
            setSavingForm(false);
        }
    };

    const addFormField = () => {
        const newField: FormField = {
            id: Math.random().toString(36).substr(2, 9),
            label: "New Field",
            type: "text",
            required: false
        };
        setFormFields([...formFields, newField]);
    };

    const removeFormField = (id: string) => {
        setFormFields(formFields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFormFields(formFields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.user_id) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);

                    if (data.length === 0) {
                        toast({ title: "Error", description: "Excel file is empty", variant: "destructive" });
                        setUploading(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        return;
                    }

                    const newDelegates = data.map((row: any) => ({
                        manager_id: profile.user_id,
                        event_name: selectedEventName,
                        name: row.Name || row.name,
                        email: row.Email || row.email || null,
                        phone: String(row.Phone || row.phone || row.Mobile || '').trim() || null,
                        role_in_event: row.Role || row.role || 'Delegate',
                        delegation: row.Delegation || row.State || null
                    }));

                    const { error } = await supabase.from('event_delegates' as any).insert(newDelegates);
                    if (error) throw error;

                    toast({ title: "Success", description: `Imported ${newDelegates.length} delegates` });
                    fetchDelegates();
                    fetchStats();
                } catch (innerError: any) {
                    console.error("Import processing error", innerError);
                    toast({ title: "Import failed", description: innerError.message || "Failed to process the Excel file.", variant: "destructive" });
                } finally {
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };

            reader.onerror = () => {
                toast({ title: "Error", description: "Failed to read the file.", variant: "destructive" });
                setUploading(false);
            };

            reader.readAsBinaryString(file);
        } catch (error: any) {
            console.error("Import error", error);
            toast({ title: "Import failed", description: error.message, variant: "destructive" });
            setUploading(false);
        }
    };

    const exportCSV = () => {
        if (!delegates.length) return;
        const headers = ["Name", "Email", "Phone", "Role", "Delegation", "Registered At"];
        const rows = delegates.map(r => [
            r.name || "-",
            r.email || "-",
            r.phone || "-",
            r.role_in_event || "-",
            r.delegation || "-",
            new Date(r.created_at).toLocaleString("en-IN")
        ]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `delegates-${profile?.user_id}.csv`;
        a.click();
    };

    const handlePrintIDCard = () => {
        if (!idCardRef.current || !selectedDelegate) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
                <head>
                    <title>ID Card - ${selectedDelegate.name}</title>
                    <style>
                        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background: #f0f0f0; }
                        .card { width: 3.375in; height: 2.125in; background: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 0.2in; box-sizing: border-box; display: flex; position: relative; overflow: hidden; border: 1px solid #ccc; }
                        .card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: #f97316; }
                        .info { flex: 1; display: flex; flex-direction: column; justify-content: center; z-index: 10; }
                        .qr-col { width: 80px; display: flex; align-items: center; justify-content: center; z-index: 10; }
                        h1 { margin: 0 0 4px 0; font-size: 16pt; color: #1e293b; }
                        h2 { margin: 0 0 8px 0; font-size: 10pt; color: #f97316; font-weight: normal; }
                        p { margin: 2px 0; font-size: 8pt; color: #64748b; }
                        .event-name { font-size: 9pt; font-weight: bold; margin-top: auto; color: #0f172a; }
                        .brand { position: absolute; bottom: 0.1in; right: 0.2in; text-transform: uppercase; letter-spacing: 2px; font-size: 6pt; color: rgba(0,0,0,0.1); font-weight: bold; }
                    </style>
                </head>
                <body>
                    ${idCardRef.current.outerHTML}
                    <script>
                        window.onload = () => { window.print(); }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const statCards = [
        { label: "Assigned Designation", value: selectedEventName, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
        { label: "Total Delegates", value: stats.totalDelegates, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" }
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
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-auto p-1 bg-muted/30">
                    <TabsTrigger value="dashboard" className="gap-2"><Activity className="w-4 h-4" /> Dashboard</TabsTrigger>
                    <TabsTrigger value="formbuilder" className="gap-2 data-[state=active]:text-[#22D3EE]"><ClipboardList className="w-4 h-4" /> Form Builder</TabsTrigger>
                    <TabsTrigger value="delegates" className="gap-2 data-[state=active]:text-[#F59E0B]"><Users className="w-4 h-4" /> Delegates</TabsTrigger>
                    <TabsTrigger value="idcard" className="gap-2 data-[state=active]:text-[#22D3EE]"><CreditCard className="w-4 h-4" /> ID Card</TabsTrigger>
                    <TabsTrigger value="imports" className="gap-2 data-[state=active]:text-[#F59E0B]"><FileUp className="w-4 h-4" /> Bulk Upload</TabsTrigger>
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
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab("responses")}>
                                <Users className="w-6 h-6 text-emerald-400" />
                                <span className="text-xs">Manage Delegates</span>
                            </Button>
                            <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab("idcard")}>
                                <QrCode className="w-6 h-6 text-purple-400" />
                                <span className="text-xs">Generate IDs</span>
                            </Button>
                        </div>
                    </div>
                </TabsContent>



                {/* Responses Tab */}
                <TabsContent value="responses" className="mt-6">
                    <GlassCard>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-semibold">
                                Event Delegates <span className="text-sm text-muted-foreground font-normal ml-2">({delegates.length} records)</span>
                            </h3>
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                                <Button size="sm" variant="outline" className="gap-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                    onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Import Excel
                                </Button>
                                {delegates.length > 0 && (
                                    <Button size="sm" variant="outline" className="gap-2" onClick={exportCSV}>
                                        <DownloadCloud className="w-4 h-4" /> Export
                                    </Button>
                                )}
                            </div>
                        </div>
                        {loadingDelegates ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : delegates.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No delegates registered for this event yet.</p>
                                <p className="text-xs mt-2">Use the "Import Excel" button to bulk add delegates.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-muted-foreground">
                                            <th className="text-left py-3 px-3">#</th>
                                            <th className="text-left py-3 px-3">Name</th>
                                            <th className="text-left py-3 px-3">Email</th>
                                            <th className="text-left py-3 px-3">Role</th>
                                            <th className="text-left py-3 px-3">Delegation</th>
                                            <th className="text-right py-3 px-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {delegates.map((r, i) => (
                                            <tr key={r.id} className="border-b border-white/5 hover:bg-muted/20 transition-colors">
                                                <td className="py-3 px-3 text-muted-foreground">{i + 1}</td>
                                                <td className="py-3 px-3 font-medium">{r.name || "-"}</td>
                                                <td className="py-3 px-3">{r.email || "-"}</td>
                                                <td className="py-3 px-3">
                                                    <Badge variant="outline" className="font-normal text-[10px]">{r.role_in_event || "Delegate"}</Badge>
                                                </td>
                                                <td className="py-3 px-3 text-muted-foreground">{r.delegation || "-"}</td>
                                                <td className="py-3 px-3 text-right flex justify-end gap-2">
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewingDelegate(r)}>
                                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-primary" onClick={() => {
                                                        setSelectedDelegate(r);
                                                        setActiveTab("idcard");
                                                    }}>Get ID</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </TabsContent>

                <Dialog open={!!viewingDelegate} onOpenChange={(open) => !open && setViewingDelegate(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Delegate Details</DialogTitle>
                        </DialogHeader>
                        {viewingDelegate && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/20 rounded-lg border border-white/5">
                                        <p className="text-[10px] uppercase text-muted-foreground">Name</p>
                                        <p className="text-sm font-medium">{viewingDelegate.name}</p>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg border border-white/5">
                                        <p className="text-[10px] uppercase text-muted-foreground">Role</p>
                                        <p className="text-sm font-medium">{viewingDelegate.role_in_event}</p>
                                    </div>
                                </div>

                                {viewingDelegate.custom_data && Object.keys(viewingDelegate.custom_data).length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Custom Form Data</p>
                                        <div className="grid gap-2">
                                            {Object.entries(viewingDelegate.custom_data).map(([key, value]) => (
                                                <div key={key} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                    <p className="text-[10px] uppercase text-muted-foreground">{key}</p>
                                                    <p className="text-sm font-medium">{String(value)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Form Builder Tab */}
                <TabsContent value="formbuilder" className="mt-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <GlassCard>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-display font-semibold text-lg">Registration Form Builder</h3>
                                        <p className="text-sm text-muted-foreground">Define what information delegates need to fill during registration.</p>
                                    </div>
                                    <Button onClick={addFormField} variant="outline" size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" /> Add Field
                                    </Button>
                                </div>

                                {fetchingForm ? (
                                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : formFields.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl border-white/5 text-muted-foreground">
                                        <p>No custom fields added yet.</p>
                                        <Button variant="link" onClick={addFormField} className="text-primary mt-2">Click here to add your first field</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formFields.map((field, index) => (
                                            <motion.div key={field.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                                                className="p-4 bg-muted/20 rounded-xl border border-white/5 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Field Label</Label>
                                                            <Input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} placeholder="e.g. T-shirt Size" className="h-9" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs">Field Type</Label>
                                                            <select value={field.type} onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                                                className="w-full h-9 bg-background border border-input rounded-md px-3 text-sm">
                                                                <option value="text">Text Input</option>
                                                                <option value="number">Number Input</option>
                                                                <option value="email">Email</option>
                                                                <option value="tel">Phone Number</option>
                                                                <option value="select">Dropdown Menu</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex items-end h-full py-2">
                                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                                <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                                    className="w-4 h-4 rounded border-gray-300 text-primary" />
                                                                Required Field
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={() => removeFormField(field.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {field.type === "select" && (
                                                    <div className="pt-2 border-t border-white/5">
                                                        <Label className="text-xs mb-2 block">Dropdown Options (comma separated)</Label>
                                                        <Input value={field.options?.join(", ") || ""} onChange={(e) => updateField(field.id, { options: e.target.value.split(",").map(o => o.trim()) })}
                                                            placeholder="Small, Medium, Large" className="h-8 text-xs" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>
                        </div>

                        <div className="space-y-6">
                            <GlassCard className="lg:sticky lg:top-6">
                                <h3 className="font-display font-semibold mb-4">Form Settings</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium">Form Status</p>
                                            <p className="text-xs text-muted-foreground">{isFormActive ? "Live - accepting data" : "Offline"}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => setIsFormActive(!isFormActive)}>
                                            <ToggleRight className={`w-6 h-6 ${isFormActive ? "text-primary" : "text-muted"}`} />
                                        </Button>
                                    </div>

                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                        <Label className="text-xs text-primary mb-1 block">Public Registration URL</Label>
                                        <div className="flex gap-2">
                                            <Input readOnly value={`${window.location.origin}/register/event/${profile?.user_id}`} className="h-8 text-[10px] bg-background/50" />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/register/event/${profile?.user_id}`);
                                                toast({ title: "Copied", description: "Link copied to clipboard." });
                                            }}>
                                                <DownloadCloud className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <Button className="w-full gap-2 py-6" onClick={handleSaveForm} disabled={savingForm}>
                                        {savingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save & Sync Form
                                    </Button>

                                    <div className="text-[10px] text-muted-foreground leading-relaxed">
                                        💡 **Note:** Syncing the form will update the live registration link immediately. Make sure to save after any changes.
                                    </div>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </TabsContent>

                {/* ID Card Tab */}
                <TabsContent value="idcard" className="mt-6">
                    <GlassCard>
                        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-purple-400" /> Delegate ID Card Generator
                        </h3>
                        {!selectedDelegate ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>Select a delegate from the Delegates tab to generate an ID card.</p>
                                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("responses")}>
                                    Go to Delegates <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/20 rounded-xl border">
                                        <p className="text-sm font-semibold mb-1 text-primary">Selected Delegate</p>
                                        <p className="font-display text-xl">{selectedDelegate.name}</p>
                                        <p className="text-sm text-foreground">{selectedDelegate.role_in_event || "Delegate"}</p>
                                        {selectedDelegate.delegation && <p className="text-xs text-muted-foreground mt-1">From: {selectedDelegate.delegation}</p>}
                                    </div>
                                    <Button className="w-full gap-2 mt-4" onClick={handlePrintIDCard}>
                                        <QrCode className="w-4 h-4" /> Print ID Card
                                    </Button>
                                    <Button variant="outline" className="w-full gap-2" onClick={() => setSelectedDelegate(null)}>
                                        Clear Selection
                                    </Button>
                                </div>

                                {/* Preview Card */}
                                <div className="flex items-center justify-center bg-muted/10 p-6 rounded-xl border border-dashed">
                                    {/* This is the printable node */}
                                    <div ref={idCardRef} className="card">
                                        <div className="info">
                                            <h1>{selectedDelegate.name}</h1>
                                            <h2>{selectedDelegate.role_in_event || "Delegate"}</h2>
                                            {selectedDelegate.delegation && <p>{selectedDelegate.delegation}</p>}
                                            <p className="event-name">{selectedDelegate.event_name || "Savishkar Event"}</p>
                                        </div>
                                        <div className="qr-col">
                                            <QRCode
                                                value={`${window.location.origin}/verify/delegate/${selectedDelegate.id}`}
                                                size={70}
                                                level="M"
                                            />
                                        </div>
                                        <div className="brand">SAVISHKAR INDIA</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}
