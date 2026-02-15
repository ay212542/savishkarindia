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
import { Loader2, Plus, Pencil, Trash2, Image as ImageIcon, Save, X } from "lucide-react";
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

// Define News Item Type
interface NewsItem {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
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
    const [uploading, setUploading] = useState(false);
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
            setNews(data || []);
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

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return null;

        try {
            setUploading(true);
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("news_images")
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("news_images")
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({
                title: "Upload Failed",
                description: "Could not upload the image. Please try again.",
                variant: "destructive",
            });
            return null;
        } finally {
            setUploading(false);
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
            let imageUrl = formData.image_url;

            // Upload new image if selected
            if (imageFile) {
                const uploadedUrl = await uploadImage();
                if (uploadedUrl) imageUrl = uploadedUrl;
            }

            const newsData = {
                title: formData.title,
                content: formData.content,
                image_url: imageUrl,
                updated_at: new Date().toISOString(),
            };

            if (editingItem) {
                // Update
                const { error } = await supabase
                    .from("news")
                    .update(newsData)
                    .eq("id", editingItem.id);

                if (error) throw error;
                toast({ title: "Success", description: "News item updated successfully." });
            } else {
                // Create
                const { error } = await supabase
                    .from("news")
                    .insert([{ ...newsData, created_by: user?.id }]);

                if (error) throw error;
                toast({ title: "Success", description: "News item created successfully." });
            }

            // Reset & Refresh
            setIsDialogOpen(false);
            resetForm();
            fetchNews();
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
            const { error } = await supabase.from("news").delete().eq("id", id);
            if (error) throw error;

            toast({ title: "Deleted", description: "News item removed." });
            fetchNews();
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
        setEditingItem(null);
    };

    const openEditDialog = (item: NewsItem) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            content: item.content,
            image_url: item.image_url || "",
        });
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
                    <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? "Edit News" : "Add News"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                                    className="min-h-[150px]"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Image (Optional)</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            id="image-upload" // Added ID for label
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="cursor-pointer file:cursor-pointer file:text-primary file:font-semibold"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Upload an image for the news thumbnail.
                                        </p>
                                    </div>
                                    {(formData.image_url || imageFile) && (
                                        <div className="w-16 h-16 rounded-md overflow-hidden border border-border relative group">
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Only allow removing if it's set */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, image_url: "" }));
                                                    setImageFile(null);
                                                }}
                                                className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex"
                                            >
                                                <X className="w-4 h-4 text-white" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
                                <TableHead>Image</TableHead>
                                <TableHead>Title & Content</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                                        <span className="text-xs text-muted-foreground mt-2 block">Loading news...</span>
                                    </TableCell>
                                </TableRow>
                            ) : news.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
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
