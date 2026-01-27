import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Edit2, Eye, Loader2, FileText, Globe, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CMSBlock {
  id: string;
  section: string;
  content: Record<string, any> | null;
  updated_at: string;
  updated_by: string | null;
}

function parseCMSContent(content: unknown): Record<string, any> | null {
  if (content === null || content === undefined) return null;
  if (typeof content === 'object' && !Array.isArray(content)) {
    return content as Record<string, any>;
  }
  return null;
}

const SECTIONS = [
  { id: "hero", label: "Hero Section", fields: ["title", "subtitle", "cta_text"] },
  { id: "about", label: "About Page", fields: ["title", "description", "mission", "vision"] },
  { id: "contact", label: "Contact Info", fields: ["email", "phone", "address"] },
  { id: "footer", label: "Footer", fields: ["tagline", "copyright", "instagram_url", "facebook_url", "twitter_url", "linkedin_url"] },
  {
    id: "member_dashboard",
    label: "Member Dashboard",
    fields: ["welcome_message", "announcement_banner", "featured_title", "featured_description", "featured_link"]
  },
];

export default function CMSEditor() {
  const [blocks, setBlocks] = useState<Record<string, CMSBlock>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCMSBlocks();
  }, []);

  async function fetchCMSBlocks() {
    const { data, error } = await supabase
      .from("cms_blocks")
      .select("*");

    if (error) {
      console.error("Error fetching CMS blocks:", error);
    } else {
      const blockMap: Record<string, CMSBlock> = {};
      data?.forEach(block => {
        blockMap[block.section] = {
          ...block,
          content: parseCMSContent(block.content)
        };
      });
      setBlocks(blockMap);
    }
    setLoading(false);
  }

  function startEditing(section: string) {
    const block = blocks[section];
    setFormData(block?.content || {});
    setEditingSection(section);
  }

  function cancelEditing() {
    setEditingSection(null);
    setFormData({});
  }

  async function saveSection(section: string) {
    setSaving(section);

    try {
      // Validate URL fields
      const urlFields = ["instagram_url", "facebook_url", "twitter_url", "linkedin_url"];
      for (const field of urlFields) {
        if (formData[field] && formData[field].trim() !== "") {
          try {
            new URL(formData[field]);
          } catch {
            toast({
              title: "Invalid URL",
              description: `${field.replace(/_/g, " ")} must be a valid URL`,
              variant: "destructive"
            });
            setSaving(null);
            return;
          }
        }
      }

      const existingBlock = blocks[section];

      if (existingBlock) {
        const { error } = await supabase
          .from("cms_blocks")
          .update({
            content: formData,
            updated_by: user?.id
          })
          .eq("id", existingBlock.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("cms_blocks")
          .insert<any>({
            section,
            content: formData,
            updated_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        setBlocks(prev => ({ ...prev, [section]: data as CMSBlock }));
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        action: "CMS_UPDATED",
        user_id: user?.id,
        target_type: "cms_block",
        target_id: section,
        details: { section, content: formData }
      });

      toast({ title: "Saved", description: `${section} section has been updated` });

      setBlocks(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          content: formData
        }
      }));
      setEditingSection(null);
      setFormData({});
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }

    setSaving(null);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            CMS Editor
          </h1>
          <p className="text-muted-foreground">Edit website content directly from the dashboard</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.open("/", "_blank")}>
          <Globe className="w-4 h-4" />
          View Website
        </Button>
      </div>

      <div className="grid gap-6">
        {SECTIONS.map((section, index) => {
          const block = blocks[section.id];
          const isEditing = editingSection === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-lg">{section.label}</h3>
                    {block && (
                      <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(block.updated_at).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => startEditing(section.id)} className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={cancelEditing} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveSection(section.id)}
                        disabled={saving === section.id}
                        className="gap-2"
                      >
                        {saving === section.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {section.fields.map(field => (
                      <div key={field}>
                        <label className="text-sm font-medium capitalize mb-1.5 block">
                          {field.replace(/_/g, " ")}
                        </label>
                        {field.includes("description") || field.includes("mission") || field.includes("vision") ? (
                          <Textarea
                            value={formData[field] || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                            rows={4}
                          />
                        ) : (
                          <Input
                            value={formData[field] || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {section.fields.map(field => {
                      const value = block?.content?.[field];
                      return (
                        <div key={field} className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm text-muted-foreground capitalize">
                            {field.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm font-medium text-right max-w-[60%] truncate">
                            {value || <span className="text-muted-foreground italic">Not set</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
