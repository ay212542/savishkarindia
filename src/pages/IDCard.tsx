import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, CreditCard, Check, QrCode, User, FileImage, FileText } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { ID_TEMPLATES, ROLE_LABELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import logoSavishkar from "@/assets/logo-savishkar.png";

type TemplateType = "modern" | "minimal" | "premium" | "cyber";

const templateStyles: Record<TemplateType, string> = {
  modern: "id-card-modern border-primary/50",
  minimal: "border border-border",
  premium: "id-card-premium border-accent/50",
  cyber: "id-card-cyber border-savishkar-cyan/50"
};

const templateGradients: Record<TemplateType, string> = {
  modern: "from-primary/20 via-transparent to-primary/5",
  minimal: "from-muted/30 via-transparent to-transparent",
  premium: "from-accent/20 via-transparent to-accent/5",
  cyber: "from-savishkar-cyan/20 via-transparent to-savishkar-cyan/5"
};

export default function IDCard() {
  const { user, profile, role, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("modern");
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const generatePNG = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true
      });

      const link = document.createElement("a");
      link.download = `SAVISHKAR-ID-${profile?.membership_id || "card"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "ID Card Downloaded",
        description: "Your digital ID card has been saved as PNG"
      });
    } catch (error) {
      console.error("Error generating PNG:", error);
      toast({
        title: "Error",
        description: "Failed to generate PNG. Please try again.",
        variant: "destructive"
      });
    }
    setIsGenerating(false);
  };

  const generatePDF = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98]
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
      pdf.save(`SAVISHKAR-ID-${profile?.membership_id || "card"}.pdf`);

      toast({
        title: "ID Card Downloaded",
        description: "Your digital ID card has been saved as PDF"
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
    setIsGenerating(false);
  };

  const verificationUrl = `${window.location.origin}/verify/${profile?.membership_id}`;

  if (loading) {
    return (
      <Layout hideFooter>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl skeleton-shimmer" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile?.membership_id) {
    return (
      <Layout hideFooter>
        <AnimatedBackground />
        <div className="container mx-auto px-4 py-24 relative z-10">
          <GlassCard className="max-w-lg mx-auto text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-display text-2xl font-bold mb-2">ID Card Not Issued</h2>
            <p className="text-muted-foreground">
              {profile?.membership_id
                ? "Your ID Card is being generated. Please contact support if this persists."
                : "Your digital ID card will be available once your membership is approved and a membership ID is assigned."}
            </p>
          </GlassCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Digital <span className="text-primary">ID Card</span>
          </h1>
          <p className="text-muted-foreground">
            Select a template and download your verified membership ID
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Template Selection */}
          <div className="space-y-6">
            <GlassCard>
              <h3 className="font-display text-lg font-semibold mb-4">Select Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {ID_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id as TemplateType)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${selectedTemplate === template.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{template.name}</span>
                      {selectedTemplate === template.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="font-display text-lg font-semibold mb-4">Card Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membership ID</span>
                  <span className="font-mono text-primary">{profile?.membership_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span>{role ? ROLE_LABELS[role] : "Member"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State</span>
                  <span>{profile?.state || "Not specified"}</span>
                </div>
              </div>
            </GlassCard>

            {/* Export Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={generatePNG}
                disabled={isGenerating}
                variant="outline"
                className="gap-2"
                size="lg"
              >
                <FileImage className="w-5 h-5" />
                Export PNG
              </Button>
              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="glow-button-teal gap-2"
                size="lg"
              >
                <FileText className="w-5 h-5" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold">Live Preview</h3>

            <div
              ref={cardRef}
              className={`id-card ${templateStyles[selectedTemplate]} p-6 relative`}
              style={{ width: "100%", maxWidth: "428px", aspectRatio: "1.586" }}
            >
              {/* Watermark — commented out */}
              {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="font-display text-4xl font-bold tracking-widest transform rotate-[-30deg]">
                  SAVISHKAR INDIA
                </span>
              </div> */}

              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${templateGradients[selectedTemplate]} rounded-2xl`} />

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={logoSavishkar}
                      alt="SAVISHKAR"
                      className="w-8 h-8 object-contain"
                    />
                    <div>
                      <p className="font-display font-bold text-sm leading-none">SAVISHKAR</p>
                      <p className="text-[10px] text-muted-foreground">National Innovation Ecosystem</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-medium ${selectedTemplate === "cyber"
                    ? "bg-savishkar-cyan/20 text-savishkar-cyan"
                    : selectedTemplate === "premium"
                      ? "bg-accent/20 text-accent"
                      : "bg-primary/20 text-primary"
                    }`}>
                    VERIFIED
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex gap-4">
                  <div className="w-16 h-20 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden border border-border">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg leading-tight">{profile?.full_name}</h3>
                    <p className={`text-sm font-medium ${selectedTemplate === "cyber"
                      ? "text-savishkar-cyan"
                      : selectedTemplate === "premium"
                        ? "text-accent"
                        : "text-primary"
                      }`}>
                      {role ? ROLE_LABELS[role] : "Member"}
                    </p>
                    {/* Removed old designation per request */}

                    <p className="text-xs text-muted-foreground">{profile?.state}</p>

                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">MEMBERSHIP ID</p>
                    <p className="font-mono font-bold text-sm">{profile?.membership_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg">
                      <QRCodeSVG
                        value={verificationUrl}
                        size={48}
                        level="M"
                        bgColor="transparent"
                        fgColor="#000000"
                      />
                    </div>
                    <div className="text-right">
                      <QrCode className="w-3 h-3 text-muted-foreground mb-0.5" />
                      <p className="text-[8px] text-muted-foreground">Scan to verify</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              The QR code links to your verification page where anyone can confirm your membership
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}