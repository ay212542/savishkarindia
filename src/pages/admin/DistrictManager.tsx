import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2, MapPin, Save, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PRANT_LIST } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

interface District {
  id: string;
  prant: string;
  district: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function DistrictManager() {
  const { profile, role } = useAuth();
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrant, setSelectedPrant] = useState<string>(PRANT_LIST[0]);

  // Effect to set initial prant for State Admins
  useEffect(() => {
    if ((role === "STATE_CONVENER" || role === "STATE_CO_CONVENER" || role === "STATE_INCHARGE" || role === "STATE_CO_INCHARGE") && profile?.state) {
      setSelectedPrant(profile.state);
    }
  }, [role, profile]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    district: "",
    display_order: 0,
    is_active: true
  });
  const { toast } = useToast();

  const fetchDistricts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("prant_districts")
      .select("*")
      .eq("prant", selectedPrant)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setDistricts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDistricts();
  }, [selectedPrant]);

  const handleSave = async () => {
    try {
      if (editingDistrict) {
        // Update existing
        const { error } = await supabase
          .from("prant_districts")
          .update({
            district: formData.district,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
          .eq("id", editingDistrict.id);

        if (error) throw error;
        toast({ title: "District updated successfully" });
      } else {
        // Create new
        const { error } = await supabase
          .from("prant_districts")
          .insert({
            prant: selectedPrant,
            district: formData.district,
            display_order: formData.display_order,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast({ title: "District added successfully" });
      }

      setIsDialogOpen(false);
      setEditingDistrict(null);
      setFormData({ district: "", display_order: 0, is_active: true });
      fetchDistricts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this district?")) return;

    try {
      const { error } = await supabase
        .from("prant_districts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "District deleted successfully" });
      fetchDistricts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleBulkUpload = async () => {
    try {
      const lines = bulkInput.split("\n").filter(line => line.trim());
      const districtsToInsert = lines.map((line, index) => ({
        prant: selectedPrant,
        district: line.trim(),
        display_order: districts.length + index + 1,
        is_active: true
      }));

      if (districtsToInsert.length === 0) {
        toast({ title: "No districts to add", variant: "destructive" });
        return;
      }

      const { error } = await supabase
        .from("prant_districts")
        .insert(districtsToInsert);

      if (error) throw error;
      toast({ title: `${districtsToInsert.length} districts added successfully` });
      setIsBulkDialogOpen(false);
      setBulkInput("");
      fetchDistricts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditDialog = (district: District) => {
    setEditingDistrict(district);
    setFormData({
      district: district.district,
      display_order: district.display_order,
      is_active: district.is_active
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingDistrict(null);
    setFormData({
      district: "",
      display_order: districts.length + 1,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">District Manager</h1>
          <p className="text-muted-foreground">Manage districts under each Prant</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Bulk Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Add Districts</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter one district name per line for <strong>{selectedPrant}</strong>
                </p>
                <Textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="District 1
District 2
District 3"
                  className="min-h-[200px] font-mono"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkUpload} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Add Districts
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Add District
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDistrict ? "Edit District" : "Add New District"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Prant</Label>
                  <Input value={selectedPrant} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>District Name</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Enter district name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Prant Selector */}
      <div className="flex items-center gap-4">
        <Label className="shrink-0">Select Prant:</Label>
        <Select
          value={selectedPrant}
          onValueChange={setSelectedPrant}
          disabled={role === "STATE_CONVENER" || role === "STATE_CO_CONVENER" || role === "STATE_INCHARGE" || role === "STATE_CO_INCHARGE"}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRANT_LIST.map((prant) => (
              <SelectItem key={prant} value={prant}>{prant}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Districts Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border rounded-xl overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Order</TableHead>
              <TableHead>District Name</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading districts...
                  </div>
                </TableCell>
              </TableRow>
            ) : districts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No districts found for {selectedPrant}</p>
                  <Button variant="link" onClick={openAddDialog} className="mt-2">
                    Add your first district
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              districts.map((district) => (
                <TableRow key={district.id}>
                  <TableCell className="font-mono">{district.display_order}</TableCell>
                  <TableCell className="font-medium">{district.district}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${district.is_active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                      }`}>
                      {district.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(district)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(district.id)}
                        className="text-destructive hover:text-destructive"
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