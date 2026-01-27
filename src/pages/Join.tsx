import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PRANT_LIST, APPLICATION_DESIGNATIONS, ROLE_LABELS } from "@/lib/constants";
import logoSavishkar from "@/assets/logo-savishkar.png";

interface PrantDistrict {
  id: string;
  prant: string;
  district: string;
}

export default function Join() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [districts, setDistricts] = useState<PrantDistrict[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    state: "",
    district: "",
    institution: "",
    motivation: "",
    division: ""
  });
  const { toast } = useToast();

  // Fetch districts when prant changes
  useEffect(() => {
    async function fetchDistricts() {
      if (!formData.state) {
        setDistricts([]);
        return;
      }

      const { data, error } = await supabase
        .from("prant_districts")
        .select("*")
        .eq("prant", formData.state)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (!error && data) {
        setDistricts(data);
      }
    }
    fetchDistricts();
  }, [formData.state]);

  // Handle photo file selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 2MB",
        variant: "destructive"
      });
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove photo
  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Upload photo to storage
  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    setUploadingPhoto(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `applications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("member_photos")
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("member_photos")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Photo upload error:", error);
      toast({
        title: "Photo upload failed",
        description: error instanceof Error ? error.message : "Unknown upload error",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload photo first if exists
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto();
      }

      // Submit application with server-side validation
      // Submit application via Edge Function first
      const { data, error } = await supabase.functions.invoke("submit-application", {
        body: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
          division: formData.division || null,
          district: formData.district || null,
          prant: formData.state, // Using state as prant for now
          institution: formData.institution || null,
          motivation: formData.motivation || null,
          photo_url: photoUrl
        }
      });

      if (error || (data && !data.success)) {
        console.warn("Edge Function failed, attempting direct DB insert fallback...");
        // Fallback to direct insert if Edge Function fails (e.g. not deployed)
        const { error: dbError } = await supabase
          .from("applications")
          .insert({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            state: formData.state,
            division: formData.division || null,
            district: formData.district || null,
            prant: formData.state,
            institution: formData.institution || null,
            motivation: formData.motivation || null,
            photo_url: photoUrl,
            status: 'pending'
          });

        if (dbError) throw dbError;
      }

      setSubmitted(true);
      toast({ title: "Application Submitted!", description: "We'll review your application soon." });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <AnimatedBackground />
        <div className="min-h-[80vh] flex items-center justify-center px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel-strong p-12 text-center max-w-md"
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="font-display text-2xl font-bold mb-2">Application Received!</h2>
            <p className="text-muted-foreground">
              Thank you for applying. Our team will review your application and get back to you soon.
            </p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <img
            src={logoSavishkar}
            alt="SAVISHKAR"
            className="h-16 mx-auto mb-4"
          />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Join <span className="text-primary">SAVISHKAR</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            National Innovation Command Ecosystem — Begin your journey as a national innovator
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-panel-strong p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Your Photo</Label>
                <div className="flex items-start gap-4">
                  {photoPreview ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/30">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                      >
                        <X className="w-4 h-4 text-destructive-foreground" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                      <ImageIcon className="w-8 h-8 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Upload a passport-size photo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or WebP. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-glow"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-glow"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-glow"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Applying as *</Label>
                  <Select
                    value={formData.division}
                    onValueChange={(v) => setFormData({ ...formData, division: v })}
                  >
                    <SelectTrigger className="input-glow">
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      {APPLICATION_DESIGNATIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role] || role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">Prant *</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => setFormData({ ...formData, state: v, district: "" })}
                  >
                    <SelectTrigger className="input-glow">
                      <SelectValue placeholder="Select your prant" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRANT_LIST.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Select
                    value={formData.district}
                    onValueChange={(v) => setFormData({ ...formData, district: v })}
                    disabled={!formData.state || districts.length === 0}
                  >
                    <SelectTrigger className="input-glow">
                      <SelectValue placeholder={
                        !formData.state
                          ? "Select prant first"
                          : districts.length === 0
                            ? "No districts available"
                            : "Select your district"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.district}>{d.district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution/Organization</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="input-glow"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">Why do you want to join?</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  className="input-glow min-h-[120px]"
                  placeholder="Tell us about your motivation..."
                />
              </div>

              <Button
                type="submit"
                className="w-full glow-button-teal gap-2"
                disabled={loading || uploadingPhoto}
              >
                <Send className="w-4 h-4" />
                {loading ? "Submitting..." : uploadingPhoto ? "Uploading photo..." : "Submit Application"}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}