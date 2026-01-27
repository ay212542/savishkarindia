import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, MapPin, Users, Edit, Trash2, Eye, EyeOff, Loader2, Image, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MultiImageUpload } from "@/components/ui/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PRANT_LIST } from "@/lib/constants";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  event_type: string | null;
  is_published: boolean;
  image_urls: string[] | null;
  created_at: string;
  created_by: string | null;
  collab_states: string[] | null;
  is_joint_initiative: boolean | null;
  approval_status: string | null;
}

const EVENT_TYPES = [
  "Workshop",
  "Bootcamp",
  "Ideathon",
  "Hackathon",
  "Conference",
  "Summit",
  "Training",
  "Competition",
  "Seminar",
  "Other"
];

export default function ProgramsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    event_type: "Workshop",
    is_published: false,
    image_urls: [] as string[],
    is_joint_initiative: false,
    collab_states: [] as string[]
  });
  const { user, isAdmin, role, profile } = useAuth();
  const { toast } = useToast();

  const isStateAdmin = role === "STATE_CONVENER" || role === "STATE_CO_CONVENER" || role === "STATE_INCHARGE" || role === "STATE_CO_INCHARGE";

  useEffect(() => {
    fetchEvents();
  }, [user, role, profile]);

  async function fetchEvents() {
    let query = supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      let filteredEvents = data || [];

      // Strict filtering for State Admins
      if (isStateAdmin && profile?.state) {
        filteredEvents = filteredEvents.filter(event => {
          // 1. Created by me
          if (event.created_by === user?.id) return true;
          // 2. Collaboration includes my state
          if (event.collab_states?.includes(profile.state)) return true;
          // 3. Location matches my state (fuzzy check)
          if (event.location && event.location.includes(profile.state)) return true;

          return false;
        });
      }

      setEvents(filteredEvents);
    }
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingEvent(null);
    setForm({
      title: "",
      description: "",
      event_date: "",
      location: "",
      event_type: "Workshop",
      is_published: false,
      image_urls: [],
      is_joint_initiative: false,
      collab_states: []
    });
    setShowDialog(true);
  }

  function openEditDialog(event: Event) {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date || "",
      location: event.location || "",
      event_type: event.event_type || "Workshop",
      is_published: event.is_published,
      image_urls: event.image_urls || [],
      is_joint_initiative: event.is_joint_initiative || false,
      collab_states: event.collab_states || []
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);

    // Auto-set approval status logic
    // If Admin/SuperController -> approved
    // If Joint Initiative by State Admin -> pending (logic per rules)
    let approvalStatus = "approved"; // Default
    if (form.is_joint_initiative && !isAdmin && role !== "SUPER_CONTROLLER") {
      approvalStatus = "pending";
    }

    try {
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from("events")
          .update({
            title: form.title,
            description: form.description || null,
            event_date: form.event_date || null,
            location: form.location || null,
            event_type: form.event_type,
            is_published: form.is_published,
            image_urls: form.image_urls.length > 0 ? form.image_urls : null,
            is_joint_initiative: form.is_joint_initiative,
            collab_states: form.collab_states.length > 0 ? form.collab_states : null,
            // Only update approval status if not admin (to re-trigger review if changed) 
            // OR keep existing logic. For now, let's not reset approval on edit unless needed.
          })
          .eq("id", editingEvent.id);

        if (error) throw error;

        toast({ title: "Event Updated", description: "Program has been updated successfully" });

        setEvents(prev => prev.map(e =>
          e.id === editingEvent.id
            ? {
              ...e,
              ...form,
              description: form.description || null,
              event_date: form.event_date || null,
              location: form.location || null,
              image_urls: form.image_urls.length > 0 ? form.image_urls : null,
              collab_states: form.collab_states.length > 0 ? form.collab_states : null
            }
            : e
        ));
      } else {
        // Create new event
        const { data, error } = await supabase
          .from("events")
          .insert({
            title: form.title,
            description: form.description || null,
            event_date: form.event_date || null,
            location: form.location || null,
            event_type: form.event_type,
            is_published: form.is_published,
            image_urls: form.image_urls.length > 0 ? form.image_urls : null,
            created_by: user?.id,
            is_joint_initiative: form.is_joint_initiative,
            collab_states: form.collab_states.length > 0 ? form.collab_states : null,
            approval_status: approvalStatus,
            proposed_by: user?.id
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Event Created",
          description: approvalStatus === 'pending'
            ? "Program submitted for approval (Joint Initiative)"
            : "New program has been created successfully"
        });

        setEvents(prev => [data, ...prev]);
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save program", variant: "destructive" });
    }

    setSaving(false);
  }

  async function handleDelete(event: Event) {
    if (!confirm(`Are you sure you want to delete "${event.title}"?`)) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;

      toast({ title: "Event Deleted", description: "Program has been deleted" });
      setEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to delete program", variant: "destructive" });
    }
  }

  async function togglePublish(event: Event) {
    if (event.approval_status === 'pending') {
      toast({ title: "Action Required", description: "Cannot publish pending programs. Approve them first.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("events")
        .update({ is_published: !event.is_published })
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: event.is_published ? "Unpublished" : "Published",
        description: `"${event.title}" is now ${event.is_published ? "hidden" : "visible"} on the website`
      });

      setEvents(prev => prev.map(e =>
        e.id === event.id ? { ...e, is_published: !e.is_published } : e
      ));
    } catch (error) {
      console.error("Toggle error:", error);
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Programs Manager</h1>
          <p className="text-muted-foreground">Create and manage events, workshops, and programs</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 glow-button-teal">
          <Plus className="w-4 h-4" />
          Add Program
        </Button>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-semibold mb-2">No Programs Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first program to get started</p>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Program
          </Button>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="h-full flex flex-col relative overflow-hidden">
                {event.approval_status === 'pending' && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 z-10" />
                )}

                <div className="flex items-start justify-between mb-3">
                  <Badge variant={event.is_published ? "default" : "secondary"}>
                    {event.is_published ? "Published" : "Draft"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {event.is_joint_initiative && (
                      <Badge variant="outline" className="border-purple-500 text-purple-500">Joint</Badge>
                    )}
                    {event.approval_status === 'pending' && (
                      <Badge variant="destructive" className="animate-pulse">Pending Approval</Badge>
                    )}
                    <Badge variant="outline">{event.event_type}</Badge>
                  </div>
                </div>

                {event.image_urls && event.image_urls.length > 0 && (
                  <div className="mb-3 -mx-4 -mt-2">
                    <img
                      src={event.image_urls[0]}
                      alt={event.title}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                <h3 className="font-display font-semibold text-lg mb-2">{event.title}</h3>

                {event.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {event.collab_states && event.collab_states.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Collaboration:</p>
                    <div className="flex flex-wrap gap-1">
                      {event.collab_states.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                      {event.collab_states.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{event.collab_states.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                  {event.event_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.event_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(event)}
                    className="flex-1"
                  >
                    {event.is_published ? (
                      <><EyeOff className="w-4 h-4 mr-1" /> Hide</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-1" /> Publish</>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(event)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(event)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Program" : "Create Program"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update the program details below" : "Fill in the details to create a new program"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Program title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the program..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm(prev => ({ ...prev, event_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={form.event_type}
                  onValueChange={(v) => setForm(prev => ({ ...prev, event_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Event location"
              />
            </div>

            {/* Joint Initiative Logic */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Joint Initiative</Label>
                  <p className="text-xs text-muted-foreground">Collaborate with multiple states</p>
                </div>
                <Switch
                  checked={form.is_joint_initiative}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_joint_initiative: checked }))}
                />
              </div>

              {form.is_joint_initiative && (
                <div className="space-y-2">
                  <Label>Collaborating States</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-[40px]">
                        {form.collab_states.length > 0
                          ? `${form.collab_states.length} states selected`
                          : "Select states..."}
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search state..." />
                        <CommandEmpty>No state found.</CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-y-auto">
                          {PRANT_LIST.map((prant) => (
                            <CommandItem
                              key={prant}
                              value={prant}
                              onSelect={(currentValue) => {
                                const isSelected = form.collab_states.includes(currentValue);
                                let newStates;
                                if (isSelected) {
                                  newStates = form.collab_states.filter(s => s !== currentValue);
                                } else {
                                  newStates = [...form.collab_states, currentValue];
                                }
                                setForm(prev => ({ ...prev, collab_states: newStates }));
                              }}
                            >
                              <div className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                form.collab_states.includes(prant)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50 [&_svg]:invisible"
                              )}>
                                <Check className={cn("h-4 w-4")} />
                              </div>
                              {prant}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.collab_states.map(state => (
                      <Badge key={state} variant="secondary" className="gap-1">
                        {state}
                        <button
                          onClick={() => setForm(prev => ({
                            ...prev,
                            collab_states: prev.collab_states.filter(s => s !== state)
                          }))}
                          className="hover:text-destructive"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label className="text-base">Publish immediately</Label>
                <p className="text-sm text-muted-foreground">Make this visible on the website</p>
              </div>
              <Switch
                checked={form.is_published}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_published: checked }))}
              />
            </div>



            <div>
              <Label className="mb-2 block">Program Photos</Label>
              <MultiImageUpload
                bucket="programs"
                folder={editingEvent?.id || "new"}
                currentImages={form.image_urls}
                onUpload={(urls) => setForm(prev => ({ ...prev, image_urls: urls }))}
                maxImages={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingEvent ? "Save Changes" : "Create Program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

