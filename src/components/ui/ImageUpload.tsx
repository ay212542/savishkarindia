import { useState, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  bucket: "programs" | "avatars" | "leadership" | "member_photos" | "brochures";
  folder?: string;
  onUpload: (url: string) => void;
  currentImage?: string | null;
  className?: string;
  aspectRatio?: "square" | "wide" | "portrait";
}

export function ImageUpload({
  bucket,
  folder = "",
  onUpload,
  currentImage,
  className = "",
  aspectRatio = "square"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const { toast } = useToast();

  const aspectClasses = {
    square: "aspect-square",
    wide: "aspect-video",
    portrait: "aspect-[3/4]"
  };

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // Create unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreview(urlData.publicUrl);
      onUpload(urlData.publicUrl);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, onUpload, toast]);

  const handleRemove = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className={`relative ${className}`}>
      {preview ? (
        <div className={`relative ${aspectClasses[aspectRatio]} rounded-xl overflow-hidden border border-border bg-muted`}>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`
            flex flex-col items-center justify-center 
            ${aspectClasses[aspectRatio]} 
            rounded-xl border-2 border-dashed border-border 
            bg-muted/30 hover:bg-muted/50 
            cursor-pointer transition-colors
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Upload Image</span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
            </div>
          )}
        </label>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  bucket: "programs" | "avatars" | "leadership" | "member_photos" | "brochures";
  folder?: string;
  onUpload: (urls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
}

export function MultiImageUpload({
  bucket,
  folder = "",
  onUpload,
  currentImages = [],
  maxImages = 10
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(currentImages);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        newUrls.push(urlData.publicUrl);
      }

      const updatedImages = [...images, ...newUrls];
      setImages(updatedImages);
      onUpload(updatedImages);
      toast({ title: "Success", description: `${newUrls.length} image(s) uploaded` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onUpload(updated);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
            <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => removeImage(index)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {images.length < maxImages && (
          <label
            className="
              flex flex-col items-center justify-center 
              aspect-square rounded-lg border-2 border-dashed border-border 
              bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors
            "
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add</span>
              </div>
            )}
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {images.length}/{maxImages} images • Drag & drop or click to upload
      </p>
    </div>
  );
}
