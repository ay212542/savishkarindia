import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Bell, Edit, Trash2, Loader2, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string | null;
  target_audience: "ALL" | "DESIGNATORY" | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

const PRIORITY_STYLES = {
  high: { bg: "bg-destructive/20", text: "text-destructive", icon: AlertCircle },
  normal: { bg: "bg-primary/20", text: "text-primary", icon: Bell },
  low: { bg: "bg-muted", text: "text-muted-foreground", icon: Info }
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    target_audience: "ALL",
    is_active: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const fetchPromise = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out (7s)")), 7000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load announcements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingAnnouncement(null);
    setForm({
      title: "",
      content: "",
      priority: "normal",
      target_audience: "ALL",
      is_active: true
    });
    setShowDialog(true);
  }

  function openEditDialog(announcement: Announcement) {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || "normal",
      target_audience: announcement.target_audience || "ALL",
      is_active: announcement.is_active
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Error", description: "Title and content are required", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        content: form.content,
        priority: form.priority,
        target_audience: form.target_audience,
        is_active: form.is_active
      };

      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingAnnouncement.id);

        if (error) throw error;

        toast({ title: "Announcement Updated" });

        setAnnouncements(prev => prev.map(a =>
          a.id === editingAnnouncement.id ? { ...a, ...payload, target_audience: payload.target_audience as any, id: a.id, created_at: a.created_at, created_by: a.created_by } : a
        ));
      } else {
        const { data, error } = await supabase
          .from("announcements")
          .insert({
            ...payload,
            created_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        toast({ title: "Announcement Created" });
        setAnnouncements(prev => [data as Announcement, ...prev]);
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to save announcement",
        variant: "destructive"
      });
    }

    setSaving(false);
  }

  async function handleDelete(announcement: Announcement) {
    if (!confirm(`Delete "${announcement.title}"?`)) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", announcement.id);

      if (error) throw error;

      toast({ title: "Announcement Deleted" });
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  }

  async function toggleActive(announcement: Announcement) {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: !announcement.is_active })
        .eq("id", announcement.id);

      if (error) throw error;

      setAnnouncements(prev => prev.map(a =>
        a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
      ));
    } catch (error) {
      console.error("Toggle error:", error);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Manage system-wide announcements for members</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 glow-button-teal">
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-semibold mb-2">No Announcements</h3>
          <p className="text-muted-foreground mb-4">Create your first announcement</p>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Announcement
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement, index) => {
            const priority = announcement.priority as keyof typeof PRIORITY_STYLES || "normal";
            const PriorityIcon = PRIORITY_STYLES[priority].icon;

            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className={`${!announcement.is_active ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${PRIORITY_STYLES[priority].bg}`}>
                      <PriorityIcon className={`w-5 h-5 ${PRIORITY_STYLES[priority].text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-semibold">{announcement.title}</h3>
                        <Badge variant={announcement.is_active ? "default" : "secondary"}>
                          {announcement.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">{priority}</Badge>
                        {announcement.target_audience === "DESIGNATORY" && (
                          <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                            Designatory Only
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{announcement.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(announcement.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={() => toggleActive(announcement)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(announcement)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(announcement)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "New Announcement"}</DialogTitle>
            <DialogDescription>
              Announcements will be displayed on member dashboards
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
              />
            </div>

            <div>
              <Label>Content *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Announcement content..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High (Urgent)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Audience</Label>
                <Select
                  value={form.target_audience}
                  onValueChange={(v) => setForm(prev => ({ ...prev, target_audience: v as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Members</SelectItem>
                    <SelectItem value="DESIGNATORY">Designatory / Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label className="text-base">Active</Label>
                <p className="text-sm text-muted-foreground">Show this announcement to members</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAnnouncement ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
