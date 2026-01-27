import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, FileText, Download, Upload, Save, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Brochure {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  uploaded_by: string | null;
  download_count: number | null;
  is_active: boolean | null;
}

export default function BrochureManager() {
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrochure, setEditingBrochure] = useState<Brochure | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBrochures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brochures")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBrochures(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrochures();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Allow PDF, DOC, DOCX, images
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Invalid file type", description: "Please upload PDF, DOC, or image files.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `brochures/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("brochures")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("brochures")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      let fileUrl = editingBrochure?.file_url || "";

      if (selectedFile) {
        const uploadedUrl = await uploadFile(selectedFile);
        if (!uploadedUrl) {
          throw new Error("Failed to upload file");
        }
        fileUrl = uploadedUrl;
      }

      if (!fileUrl && !editingBrochure) {
        toast({ title: "Please select a file to upload", variant: "destructive" });
        setUploading(false);
        return;
      }

      if (editingBrochure) {
        // Update existing
        const { error } = await supabase
          .from("brochures")
          .update({
            title: formData.title,
            description: formData.description,
            is_active: formData.is_active,
            ...(fileUrl !== editingBrochure.file_url && { file_url: fileUrl })
          })
          .eq("id", editingBrochure.id);

        if (error) throw error;
        toast({ title: "Brochure updated successfully" });
      } else {
        // Create new
        const { error } = await supabase
          .from("brochures")
          .insert({
            title: formData.title,
            description: formData.description,
            file_url: fileUrl,
            is_active: formData.is_active,
            uploaded_by: user?.id
          });

        if (error) throw error;
        toast({ title: "Brochure uploaded successfully" });
      }

      setIsDialogOpen(false);
      setEditingBrochure(null);
      setFormData({ title: "", description: "", is_active: true });
      setSelectedFile(null);
      fetchBrochures();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }

    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brochure?")) return;

    try {
      const { error } = await supabase
        .from("brochures")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Brochure deleted successfully" });
      fetchBrochures();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleActive = async (brochure: Brochure) => {
    try {
      const { error } = await supabase
        .from("brochures")
        .update({ is_active: !brochure.is_active })
        .eq("id", brochure.id);

      if (error) throw error;
      fetchBrochures();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (brochure: Brochure) => {
    setEditingBrochure(brochure);
    setFormData({
      title: brochure.title,
      description: brochure.description || "",
      is_active: brochure.is_active ?? true
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingBrochure(null);
    setFormData({ title: "", description: "", is_active: true });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Brochure Manager</h1>
          <p className="text-muted-foreground">Upload and manage downloadable brochures</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Upload Brochure
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBrochure ? "Edit Brochure" : "Upload New Brochure"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter brochure title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{editingBrochure ? "Replace File (optional)" : "File *"}</Label>
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Allowed: PDF, DOC, DOCX, JPG, PNG, WebP (Max 10MB)
                </p>
                {selectedFile && (
                  <p className="text-xs text-primary">Selected: {selectedFile.name}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Active (Publicly Visible)</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={uploading} className="gap-2">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingBrochure ? "Update" : "Upload"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Brochures Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Downloads</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading brochures...
                  </div>
                </TableCell>
              </TableRow>
            ) : brochures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No brochures found</p>
                  <Button variant="link" onClick={openAddDialog} className="mt-2">
                    Upload your first brochure
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              brochures.map((brochure) => (
                <TableRow key={brochure.id}>
                  <TableCell className="font-medium">{brochure.title}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {brochure.description || "-"}
                  </TableCell>
                  <TableCell className="text-center">{brochure.download_count || 0}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActive(brochure)}
                      className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
                        brochure.is_active 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {brochure.is_active ? "Active" : "Hidden"}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(brochure.file_url, "_blank")}
                        title="View file"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(brochure)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(brochure.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
