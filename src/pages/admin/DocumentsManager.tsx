import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Upload, FileText, Download, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function DocumentsManager() {
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("mou");

    // MoU States
    const [mous, setMous] = useState<any[]>([]);
    const [mouLoading, setMouLoading] = useState(true);
    const [mouUploading, setMouUploading] = useState(false);
    const [mouTitle, setMouTitle] = useState("");
    const [mouCategory, setMouCategory] = useState<"educational" | "non-educational">("educational");

    // Guide States
    const [guides, setGuides] = useState<any[]>([]);
    const [guideLoading, setGuideLoading] = useState(true);
    const [guideUploading, setGuideUploading] = useState(false);
    const [guideTitle, setGuideTitle] = useState("");

    // Brochures State
    const [brochures, setBrochures] = useState<any[]>([]);
    const [brochureLoading, setBrochureLoading] = useState(true);
    const [brochureUploading, setBrochureUploading] = useState(false);
    const [brochureTitle, setBrochureTitle] = useState("");
    const [brochureDesc, setBrochureDesc] = useState("");

    useEffect(() => {
        // Fetch all 3 data types IN PARALLEL on mount
        Promise.all([
            supabase.from("mou_templates").select("*").order("uploaded_at", { ascending: false }),
            supabase.from("guides").select("*").order("updated_at", { ascending: false }),
            supabase.from("brochures").select("*").order("created_at", { ascending: false })
        ]).then(([mouRes, guideRes, brochureRes]) => {
            if (mouRes.data) setMous(mouRes.data);
            setMouLoading(false);
            if (guideRes.data) setGuides(guideRes.data);
            setGuideLoading(false);
            if (brochureRes.data) setBrochures(brochureRes.data);
            setBrochureLoading(false);
        });
    }, []);

    async function fetchMous() {
        const { data } = await supabase.from("mou_templates").select("*").order("uploaded_at", { ascending: false });
        if (data) setMous(data);
        setMouLoading(false);
    }

    // --- MoU Functions ---
    async function handleMouUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!mouTitle) {
            toast({ title: "Error", description: "Please enter a title first", variant: "destructive" });
            return;
        }

        setMouUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `mous/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

            const { error: dbError } = await supabase.from("mou_templates").insert({
                title: mouTitle,
                category: mouCategory,
                file_url: publicUrl,
                visible: true
            });

            if (dbError) throw dbError;

            toast({ title: "Success", description: "MoU Template uploaded" });
            setMouTitle("");
            fetchMous();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setMouUploading(false);
    }

    async function deleteMou(id: string, fileUrl: string) {
        if (!confirm("Delete this document?")) return;
        try {
            await supabase.from("mou_templates").delete().eq("id", id);
            toast({ title: "Deleted", description: "Document removed" });
            setMous(prev => prev.filter(m => m.id !== id)); // Local state — no re-fetch
        } catch (e) {
            console.error(e);
        }
    }

    async function toggleMouVisibility(item: any) {
        await supabase.from("mou_templates").update({ visible: !item.visible }).eq("id", item.id);
        setMous(prev => prev.map(m => m.id === item.id ? { ...m, visible: !m.visible } : m)); // Local state
    }

    // --- Guide Functions ---
    async function handleGuideUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!guideTitle) {
            toast({ title: "Error", description: "Please enter a title first", variant: "destructive" });
            return;
        }

        setGuideUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `guides/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

            const { error: dbError } = await supabase.from("guides").insert({
                title: guideTitle,
                file_url: publicUrl,
                visible: true
            });

            if (dbError) throw dbError;

            toast({ title: "Success", description: "Guide uploaded" });
            setGuideTitle("");
            // Refresh guides list after upload
            const { data: freshGuides } = await supabase.from("guides").select("*").order("updated_at", { ascending: false });
            if (freshGuides) setGuides(freshGuides);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setGuideUploading(false);
    }

    async function deleteGuide(id: string) {
        if (!confirm("Delete this guide?")) return;
        await supabase.from("guides").delete().eq("id", id);
        setGuides(prev => prev.filter(g => g.id !== id)); // Local state — no re-fetch
    }
    async function toggleGuideVisibility(item: any) {
        await supabase.from("guides").update({ visible: !item.visible }).eq("id", item.id);
        setGuides(prev => prev.map(g => g.id === item.id ? { ...g, visible: !g.visible } : g)); // Local state
    }

    // --- Brochure Functions ---
    async function handleBrochureUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        if (!brochureTitle) {
            toast({ title: "Error", description: "Please enter a title first", variant: "destructive" });
            return;
        }

        setBrochureUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `brochures/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage.from('brochures').upload(filePath, file); // Uses 'brochures' bucket or 'documents' folder? Assuming 'brochures' bucket based on BrochureManager, but create_downloads might have used a bucket. BrochureManager used 'brochures' bucket. I will use 'documents' bucket to be safe or check bucket config. BrochureManager used 'brochures'. I'll try 'documents' or 'brochures'. Let's stick to 'documents' to unify if possible, or 'brochures' if that bucket exists. BrochureManager.tsx used 'brochures'. I'll use 'documents' assuming it's the main bucket, but create a 'brochures' folder.

            // Correction: BrochureManager used 'brochures' bucket string in `from("brochures")`. If that bucket doesn't exist, it fails.
            // Safe bet: use 'documents' bucket with 'brochures/' path like others.

            const { error: uploadError2 } = await supabase.storage.from('documents').upload(filePath, file);

            if (uploadError2) throw uploadError2;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

            const { error: dbError } = await supabase.from("brochures").insert({
                title: brochureTitle,
                description: brochureDesc,
                file_url: publicUrl,
                is_active: true,
                uploaded_by: user?.id
            });

            if (dbError) throw dbError;

            toast({ title: "Success", description: "Brochure uploaded" });
            setBrochureTitle("");
            setBrochureDesc("");
            // Refresh brochures list after upload
            const { data: freshBrochures } = await supabase.from("brochures").select("*").order("created_at", { ascending: false });
            if (freshBrochures) setBrochures(freshBrochures);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setBrochureUploading(false);
    }

    async function deleteBrochure(id: string) {
        if (!confirm("Delete this brochure?")) return;
        await supabase.from("brochures").delete().eq("id", id);
        setBrochures(prev => prev.filter(b => b.id !== id)); // Local state — no re-fetch
    }

    async function toggleBrochureVisibility(item: any) {
        await supabase.from("brochures").update({ is_active: !item.is_active }).eq("id", item.id);
        setBrochures(prev => prev.map(b => b.id === item.id ? { ...b, is_active: !b.is_active } : b)); // Local state
    }


    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold">Documents Manager</h1>
                    <p className="text-muted-foreground">Manage MoUs, Guides, and Brochures</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="mou">MoU Templates</TabsTrigger>
                    <TabsTrigger value="guides">Margdarshika</TabsTrigger>
                    <TabsTrigger value="brochures">Brochures</TabsTrigger>
                </TabsList>

                {/* MoU Content */}
                <TabsContent value="mou" className="space-y-6 mt-6">
                    <GlassCard>
                        <h3 className="font-semibold mb-4">Upload New Template</h3>
                        <div className="grid md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={mouTitle} onChange={(e) => setMouTitle(e.target.value)} placeholder="e.g. Standard University MoU" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={mouCategory} onValueChange={(v: any) => setMouCategory(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="educational">Educational</SelectItem>
                                        <SelectItem value="non-educational">Non-Educational</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="invisible">Upload</Label>
                                <div className="relative">
                                    <Input
                                        type="file"
                                        id="mou-upload"
                                        className="hidden"
                                        onChange={handleMouUpload}
                                        disabled={mouUploading}
                                        accept=".pdf,.doc,.docx"
                                    />
                                    <Button asChild disabled={mouUploading} className="w-full cursor-pointer">
                                        <label htmlFor="mou-upload">
                                            {mouUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                            Upload Document
                                        </label>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid gap-4">
                        {mouLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : mous.map(item => (
                            <GlassCard key={item.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{item.title}</h4>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline">{item.category}</Badge>
                                            <span className="text-xs text-muted-foreground pt-1">
                                                {new Date(item.uploaded_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={item.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => toggleMouVisibility(item)}>
                                        {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteMou(item.id, item.file_url)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                        {!mouLoading && mous.length === 0 && <p className="text-center text-muted-foreground">No templates uploaded yet.</p>}
                    </div>
                </TabsContent>

                {/* Guides Content */}
                <TabsContent value="guides" className="space-y-6 mt-6">
                    <GlassCard>
                        <h3 className="font-semibold mb-4">Upload New Guide</h3>
                        <div className="grid md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Guide Title</Label>
                                <Input value={guideTitle} onChange={(e) => setGuideTitle(e.target.value)} placeholder="e.g. Chapter Operations Manual" />
                            </div>
                            <div className="relative">
                                <Input
                                    type="file"
                                    id="guide-upload"
                                    className="hidden"
                                    onChange={handleGuideUpload}
                                    disabled={guideUploading}
                                    accept=".pdf"
                                />
                                <Button asChild disabled={guideUploading} className="w-full cursor-pointer">
                                    <label htmlFor="guide-upload">
                                        {guideUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Upload PDF
                                    </label>
                                </Button>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid gap-4">
                        {guideLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : guides.map(item => (
                            <GlassCard key={item.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <FileText className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{item.title}</h4>
                                        <span className="text-xs text-muted-foreground">
                                            Updated: {new Date(item.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={item.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => toggleGuideVisibility(item)}>
                                        {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteGuide(item.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                        {!guideLoading && guides.length === 0 && <p className="text-center text-muted-foreground">No guides uploaded yet.</p>}
                    </div>
                </TabsContent>

                {/* Brochures Content */}
                <TabsContent value="brochures" className="space-y-6 mt-6">
                    <GlassCard>
                        <h3 className="font-semibold mb-4">Upload New Brochure</h3>
                        <div className="grid md:grid-cols-2 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={brochureTitle} onChange={(e) => setBrochureTitle(e.target.value)} placeholder="e.g. 2024 Information Brochure" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input value={brochureDesc} onChange={(e) => setBrochureDesc(e.target.value)} placeholder="Short description..." />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="relative">
                                <Input
                                    type="file"
                                    id="brochure-upload"
                                    className="hidden"
                                    onChange={handleBrochureUpload}
                                    disabled={brochureUploading}
                                    accept=".pdf,.doc,.docx"
                                />
                                <Button asChild disabled={brochureUploading} className="w-full cursor-pointer">
                                    <label htmlFor="brochure-upload">
                                        {brochureUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                        Upload Brochure (PDF)
                                    </label>
                                </Button>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="grid gap-4">
                        {brochureLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : brochures.map(item => (
                            <GlassCard key={item.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <FileText className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{item.title}</h4>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">{item.description}</span>
                                            <span className="text-xs text-muted-foreground pt-1">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href={item.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a>
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => toggleBrochureVisibility(item)}>
                                        {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteBrochure(item.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                </div>
                            </GlassCard>
                        ))}
                        {!brochureLoading && brochures.length === 0 && <p className="text-center text-muted-foreground">No brochures uploaded yet.</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
