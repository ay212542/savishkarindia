import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Loader2, Globe, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface CollabLogo {
    id: string;
    title: string;
    logo_url: string;
    website_link: string | null;
    visible: boolean;
    created_at: string;
}

export default function CollaborationsManager() {
    const [logos, setLogos] = useState<CollabLogo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        logo_url: "",
        website_link: ""
    });
    const { toast } = useToast();
    const { role } = useAuth();

    useEffect(() => {
        fetchLogos();
    }, []);

    async function fetchLogos() {
        const { data, error } = await supabase
            .from("collaboration_logos")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching logos:", error);
            toast({ title: "Error", description: "Failed to load collaborations", variant: "destructive" });
        } else {
            setLogos(data || []);
        }
        setLoading(false);
    }

    async function handleSave() {
        if (!form.title || !form.logo_url) {
            toast({ title: "Error", description: "Title and Logo are required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase.from("collaboration_logos").insert({
                title: form.title,
                logo_url: form.logo_url,
                website_link: form.website_link || null
            }).select().single();

            if (error) throw error;

            setLogos(prev => [data, ...prev]);
            toast({ title: "Success", description: "Collaboration added" });
            setShowDialog(false);
            setForm({ title: "", logo_url: "", website_link: "" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return;
        try {
            const { error } = await supabase.from("collaboration_logos").delete().eq("id", id);
            if (error) throw error;
            setLogos(prev => prev.filter(l => l.id !== id));
            toast({ title: "Deleted", description: "Collaboration removed" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    }

    async function toggleVisibility(id: string, current: boolean) {
        try {
            const { error } = await supabase.from("collaboration_logos").update({ visible: !current }).eq("id", id);
            if (error) throw error;
            setLogos(prev => prev.map(l => l.id === id ? { ...l, visible: !current } : l));
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-display text-2xl font-bold">Collaborations</h1>
                    <p className="text-muted-foreground">Manage partner logos and links</p>
                </div>
                <Button onClick={() => setShowDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Add New
                </Button>
            </div>

            {loading ? (
                <div className="h-40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : logos.length === 0 ? (
                <GlassCard className="text-center py-10">
                    <p className="text-muted-foreground">No collaborations found.</p>
                </GlassCard>
            ) : (
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {logos.map(logo => (
                        <GlassCard key={logo.id} className="relative group p-4 flex flex-col items-center text-center">
                            <div className="h-24 w-full flex items-center justify-center bg-white/5 rounded-lg mb-3 p-2">
                                <img src={logo.logo_url} alt={logo.title} className="max-h-full max-w-full object-contain" />
                            </div>
                            <h3 className="font-semibold truncate w-full">{logo.title}</h3>
                            {logo.website_link && (
                                <a href={logo.website_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                                    <Globe className="w-3 h-3" /> Visit Website
                                </a>
                            )}

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-white hover:text-white hover:bg-white/20" onClick={() => toggleVisibility(logo.id, logo.visible)}>
                                    {logo.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                </Button>
                                {(role === "SUPER_CONTROLLER" || role === "ADMIN") && (
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-white/20" onClick={() => handleDelete(logo.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                            {!logo.visible && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                                    <span className="text-xs font-bold bg-muted px-2 py-1 rounded">HIDDEN</span>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Collaboration</DialogTitle>
                        <DialogDescription>Upload a partner logo</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Partner Name</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Ministry of Youth Affairs" />
                        </div>
                        <div className="space-y-2">
                            <Label>Website Link (Optional)</Label>
                            <Input value={form.website_link} onChange={e => setForm({ ...form, website_link: e.target.value })} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Logo Image</Label>
                            <ImageUpload
                                bucket="programs" // reusing programs bucket or create new
                                folder="collab_logos"
                                onUpload={(url) => setForm({ ...form, logo_url: url })}
                                currentImage={form.logo_url}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
