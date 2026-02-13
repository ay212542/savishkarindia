import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Loader2, Video, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Story {
    id: string;
    title: string | null;
    media_url: string;
    media_type: "image" | "video";
    visible: boolean;
    created_at: string;
    expires_at: string | null;
}

export default function StoriesManager() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        media_url: "",
        media_type: "image"
    });
    const { toast } = useToast();

    useEffect(() => {
        fetchStories();
    }, []);

    async function fetchStories() {
        setLoading(true);
        try {
            const fetchPromise = supabase
                .from("stories")
                .select("*")
                .order("created_at", { ascending: false });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out (7s)")), 7000)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) throw error;
            setStories(data as any || []);
        } catch (error: any) {
            console.error("Error fetching stories:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to load stories",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!form.media_url) {
            toast({ title: "Error", description: "Media is required", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase.from("stories").insert({
                title: form.title || null,
                media_url: form.media_url,
                media_type: form.media_type,
                // default expires_at is 24h from DB default
            }).select().single();

            if (error) throw error;

            setStories(prev => [data as any, ...prev]);
            toast({ title: "Success", description: "Story uploaded" });
            setShowDialog(false);
            setForm({ title: "", media_url: "", media_type: "image" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure?")) return;
        try {
            const { error } = await supabase.from("stories").delete().eq("id", id);
            if (error) throw error;
            setStories(prev => prev.filter(s => s.id !== id));
            toast({ title: "Deleted", description: "Story removed" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-display text-2xl font-bold">Stories</h1>
                    <p className="text-muted-foreground">Manage ephemeral updates</p>
                </div>
                <Button onClick={() => setShowDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Story
                </Button>
            </div>

            {loading ? (
                <div className="h-40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : stories.length === 0 ? (
                <GlassCard className="text-center py-10">
                    <p className="text-muted-foreground">No active stories.</p>
                </GlassCard>
            ) : (
                <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {stories.map(story => (
                        <GlassCard key={story.id} className="relative group p-2 overflow-hidden aspect-[9/16]">
                            {story.media_type === "video" ? (
                                <video src={story.media_url} className="w-full h-full object-cover rounded-md" muted />
                            ) : (
                                <img src={story.media_url} className="w-full h-full object-cover rounded-md" alt="story" />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white text-xs truncate font-medium">{story.title || "Untitled"}</p>
                                <p className="text-white/70 text-[10px]">{new Date(story.created_at).toLocaleTimeString()}</p>
                            </div>

                            <Button
                                size="icon" variant="destructive"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(story.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </GlassCard>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Story</DialogTitle>
                        <DialogDescription>Upload an image or video (Max 60s)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Caption (Optional)</Label>
                            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="What's happening?" />
                        </div>
                        <div className="space-y-2">
                            <Label>Media Type</Label>
                            <Select value={form.media_type} onValueChange={v => setForm({ ...form, media_type: v as any })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Upload Media</Label>
                            {/* Note: ImageUpload component might not support video natively yet. If not, we assume images mainly for now, or update it. */}
                            {/* Assuming ImageUpload handles files generically or we rename it later */}
                            <ImageUpload
                                bucket={"stories" as any}
                                folder="uploads"
                                onUpload={(url) => setForm({ ...form, media_url: url })}
                                currentImage={form.media_url}
                                aspectRatio="portrait"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Upload
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
