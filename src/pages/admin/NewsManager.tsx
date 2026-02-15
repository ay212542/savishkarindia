
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, Image as ImageIcon, Save, X, Video, Upload, FileVideo } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Define Media Type
interface MediaItem {
    type: "image" | "video";
    url: string;
}

// Define News Item Type
interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    media: MediaItem[] | null;
    is_published: boolean | null;
    created_at: string;
}

export default function NewsManager() {
    const { user, role } = useAuth();
    const { toast } = useToast();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        image_url: "",
    });
    const [mediaFiles, setMediaFiles] = useState<{ file: File, type: "image" | "video" }[]>([]);
    const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
    const [uploading, setUploading] = useState(false);

    // Legacy single image file state (kept for backward compatibility or main thumbnail)
    const [imageFile, setImageFile] = useState<File | null>(null);

    // STRICT ACCESS CONTROL: Only Super Controller or specific admin email
    const isSuperAdmin = role === "SUPER_CONTROLLER" || user?.email === "savishkarindia@gmail.com";

    useEffect(() => {
        if (isSuperAdmin) {
            fetchNews();
        }
    }, [isSuperAdmin]);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("news")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Cast media column properly
            const formattedData: NewsItem[] = (data || []).map(item => ({
                ...item,
                media: item.media ? (item.media as any as MediaItem[]) : []
            }));

            setNews(formattedData);
        } catch (error) {
            console.error("Error fetching news:", error);
            toast({
                title: "Error",
                description: "Failed to load news items.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({ file, type }));
            setMediaFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeMediaFile = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (index: number) => {
        setExistingMedia(prev => prev.filter((_, i) => i !== index));
    };

    const compressImage = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 1200;
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = Math.min(MAX_WIDTH, img.width);
                    const height = img.height * (scaleSize < 1 ? scaleSize : 1);

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const newFile = new File([blob], file.name, {
                                type: "image/jpeg",
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error("Compression failed"));
                        }
                    }, "image/jpeg", 0.7); // 70% quality
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const uploadFile = async (file: File, path: string): Promise<string | null> => {
        try {
            const { error: uploadError } = await supabase.storage
                .from("news_images")
                .upload(path, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("news_images")
                .getPublicUrl(path);

            return data.publicUrl;
        } catch (error) {
            console.error("Upload error:", error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.content) {
            toast({
                title: "Missing Fields",
                description: "Please fill in both Title and Content.",
                variant: "destructive",
            });
            return;
        }

        try {
            setUploading(true);
            let mainImageUrl = formData.image_url;

            // 1. Upload Main Image (if new one selected)
            if (imageFile) {
                const compressedFile = await compressImage(imageFile);
                const fileName = `main_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                const uploadedUrl = await uploadFile(compressedFile, fileName);
                if (uploadedUrl) mainImageUrl = uploadedUrl;
            }

            // 2. Upload Additional Media
            const newMediaUrls: MediaItem[] = [];
            for (const media of mediaFiles) {
                let fileToUpload = media.file;
                let fileExt = media.file.name.split('.').pop();

                // Compress images but NOT videos
                if (media.type === 'image') {
                    fileToUpload = await compressImage(media.file);
                    fileExt = 'jpg';
                }

                const fileName = `gallery_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const url = await uploadFile(fileToUpload, fileName);

                if (url) {
                    newMediaUrls.push({ type: media.type, url });
                }
            }

            // Combine existing and new media
            // IMPORTANT: cast to any to satisfy JSONB type requirement for Supabase
            const allMedia = [...existingMedia, ...newMediaUrls] as any;

            const newsData = {
                title: formData.title,
                content: formData.content,
                image_url: mainImageUrl,
                media: allMedia,
                updated_at: new Date().toISOString(),
                is_published: true
            };

            let savedData;

            if (editingItem) {
                // Update
                const { data, error } = await supabase
                    .from("news")
                    .update(newsData)
                    .eq("id", editingItem.id)
                    .select()
                    .single();

                if (error) throw error;
                savedData = data;

                toast({ title: "Success", description: "News item updated successfully." });
            } else {
                // Create
                const { data, error } = await supabase
                    .from("news")
                    .insert([{ ...newsData, created_by: user?.id }])
                    .select()
                    .single();

                if (error) throw error;
                savedData = data;

                toast({ title: "Success", description: "News item created successfully." });
            }

            // Update local state with proper type casting
            const formattedItem: NewsItem = {
                ...savedData,
                media: savedData.media ? (savedData.media as any as MediaItem[]) : []
            };

            if (editingItem) {
                setNews(prev => prev.map(item => item.id === editingItem.id ? formattedItem : item));
            } else {
                setNews(prev => [formattedItem, ...prev]);
            }

            setIsDialogOpen(false);
            resetForm();

        } catch (error) {
            console.error("Error saving news:", error);
            toast({
                title: "Error",
                description: "Failed to save news item.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            // Optimistic update
            const previousNews = [...news];
            setNews(prev => prev.filter(item => item.id !== id));

            const { error } = await supabase.from("news").delete().eq("id", id);

            if (error) {
                setNews(previousNews);
                throw error;
            }

            toast({ title: "Deleted", description: "News item removed." });
        } catch (error) {
            console.error("Error deleting news:", error);
            toast({
                title: "Error",
                description: "Failed to delete news item.",
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({ title: "", content: "", image_url: "" });
        setImageFile(null);
        setMediaFiles([]);
        setExistingMedia([]);
        setEditingItem(null);
    };

    const openEditDialog = (item: NewsItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            image_url: item.image_url || "",
        });
        setExistingMedia(item.media || []);
        setMediaFiles([]); // Clear pending files
        setIsDialogOpen(true);
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
                Access Denied. Only Super Controller can manage news.
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-gradient-gold">News Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Create, edit, and manage news updates for all members.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
                            <Plus className="w-4 h-4" />
                            Add News
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit News" : "Add News"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 mt-4">

                            {/* Title & Content */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        name="title"
                                        placeholder="Enter news headline..."
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Content</label>
                                    <Textarea
                                        name="content"
                                        placeholder="Enter full news content..."
                                        value={formData.content}
                                        onChange={handleInputChange}
                                        className="min-h-[120px]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Main Thumbnail */}
                            <div className="space-y-2 border-t border-border pt-4">
                                <label className="text-sm font-medium">Main Thumbnail (Required)</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    {(formData.image_url || imageFile) && (
                                        <div className="w-20 h-20 rounded-md overflow-hidden border border-border relative bg-muted">
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gallery Uploads */}
                            <div className="space-y-4 border-t border-border pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Gallery (Images & Videos)</label>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => handleMediaSelect(e, 'image')}
                                            />
                                            <Button type="button" variant="outline" size="sm" className="gap-2">
                                                <ImageIcon className="w-4 h-4" /> Add Images
                                            </Button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="video/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={(e) => handleMediaSelect(e, 'video')}
                                            />
                                            <Button type="button" variant="outline" size="sm" className="gap-2">
                                                <Video className="w-4 h-4" /> Add Videos
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Grid */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Existing Media */}
                                    {existingMedia.map((media, index) => (
                                        <div key={`existing-${index}`} className="relative group aspect-video rounded-md overflow-hidden bg-muted border border-border">
                                            {media.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-black/10">
                                                    <FileVideo className="w-8 h-8 text-foreground/50" />
                                                </div>
                                            ) : (
                                                <img src={media.url} alt="Gallery" className="w-full h-full object-cover" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeExistingMedia(index)}
                                                className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded">
                                                Existing
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Files */}
                                    {mediaFiles.map((item, index) => (
                                        <div key={`new-${index}`} className="relative group aspect-video rounded-md overflow-hidden bg-muted border border-border">
                                            {item.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-black/10">
                                                    <FileVideo className="w-8 h-8 text-foreground/50" />
                                                </div>
                                            ) : (
                                                <img src={URL.createObjectURL(item.file)} alt="Preview" className="w-full h-full object-cover" />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeMediaFile(index)}
                                                className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-green-500/80 text-[10px] text-white rounded">
                                                New
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-6"
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {editingItem ? "Updating..." : "Publishing..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingItem ? "Update News" : "Publish News"}
                                    </>
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Thumbnail</TableHead>
                                <TableHead>Title & Content</TableHead>
                                <TableHead>Gallery</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                        <span className="text-xs text-muted-foreground mt-2 block">Loading news...</span>
                                    </TableCell>
                                </TableRow>
                            ) : news.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        No news items found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                news.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            {item.image_url ? (
                                                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-md">
                                            <div className="font-semibold text-foreground truncate">{item.title}</div>
                                            <div className="text-sm text-muted-foreground truncate">{item.content}</div>
                                        </TableCell>
                                        <TableCell>
                                            {item.media && item.media.length > 0 ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                                                    {item.media.length} items
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(item)}
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete News Item?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the
                                                                news item "{item.title}".
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(item.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
