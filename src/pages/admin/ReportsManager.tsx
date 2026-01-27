import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Activity, Users, MapPin } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { PRANT_LIST } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ReportsManager() {
    const [generating, setGenerating] = useState(false);
    const [selectedPrant, setSelectedPrant] = useState<string>("All");
    const { toast } = useToast();
    const { profile, role } = useAuth();

    useEffect(() => {
        if ((role === "STATE_CONVENER" || role === "STATE_CO_CONVENER" || role === "STATE_INCHARGE" || role === "STATE_CO_INCHARGE") && profile?.state) {
            setSelectedPrant(profile.state);
        }
    }, [role, profile]);

    async function generateMemberReport(withPhotos = false) {
        setGenerating(true);
        try {
            console.log("Fetching profiles for report...");

            let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

            if (selectedPrant !== "All") {
                query = query.eq("state", selectedPrant);
            }

            const { data: profiles, error } = await query;

            if (error) {
                console.error("Supabase Error:", error);
                throw new Error("Failed to fetch member data");
            }

            if (!profiles || profiles.length === 0) {
                toast({ title: "No Data", description: "No members found for this criteria.", variant: "default" });
                setGenerating(false);
                return;
            }

            console.log(`Found ${profiles.length} profiles. Generating PDF...`);

            // Helper to load image
            const loadImage = (url: string): Promise<string | null> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        ctx?.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/jpeg"));
                    };
                    img.onerror = () => resolve(null);
                    img.src = url;
                });
            };

            const doc = new jsPDF();

            doc.setFontSize(18);
            const title = selectedPrant !== "All" ? `Savishkar India - ${selectedPrant} Membership Report` : "Savishkar India - National Membership Report";
            doc.text(title, 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Region Scope: ${selectedPrant}`, 14, 28);
            doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 14, 33);
            doc.text(`Total Records: ${profiles.length}`, 14, 38);

            // Prepare headers and body
            const headers = withPhotos
                ? [['Photo', 'Name', 'Email', 'Phone', 'State', 'District', 'ID']]
                : [['Name', 'Email', 'Phone', 'State', 'District', 'ID']];

            // If photos requested, we need to preload images
            let tableData: any[][] = [];

            if (withPhotos) {
                toast({ title: "Processing Images", description: "This may take a moment..." });
                // We use a placeholder or load images sequentially/parallel
                // For PDF table, we need row data. 
                // We will store the base64 image in the first column if available

                tableData = await Promise.all(profiles.map(async (p) => {
                    let photoData = null;
                    if (p.avatar_url) {
                        try {
                            photoData = await loadImage(p.avatar_url);
                        } catch (e) {
                            console.error("Failed to load image", e);
                        }
                    }
                    return [
                        photoData, // Column 0: Image Data (Base64) or null
                        p.full_name || "N/A",
                        p.email || "N/A",
                        p.phone || "-",
                        p.state || "-",
                        p.district || "-",
                        p.membership_id || "Pending"
                    ];
                }));
            } else {
                tableData = profiles.map(p => [
                    p.full_name || "N/A",
                    p.email || "N/A",
                    p.phone || "-",
                    p.state || "-",
                    p.district || "-",
                    p.membership_id || "Pending"
                ]);
            }

            autoTable(doc, {
                startY: 45,
                head: headers,
                body: tableData,
                styles: { fontSize: 8, minCellHeight: withPhotos ? 15 : 8, valign: 'middle' },
                headStyles: { fillColor: [249, 115, 22] },
                didDrawCell: (data) => {
                    if (withPhotos && data.section === 'body' && data.column.index === 0) {
                        const base64Img = data.cell.raw as string;
                        if (base64Img) {
                            // data.cell.x + padding, data.cell.y + padding, width, height
                            doc.addImage(base64Img, 'JPEG', data.cell.x + 2, data.cell.y + 2, 10, 10);
                        }
                    }
                },
                // If withPhotos, empty the text in the first column so it doesn't print base64 string
                didParseCell: (data) => {
                    if (withPhotos && data.section === 'body' && data.column.index === 0) {
                        data.cell.text = []; // Clear text
                    }
                }
            });

            doc.save(`Savishkar_Members_${selectedPrant}${withPhotos ? '_Photos' : ''}_${new Date().toISOString().split('T')[0]}.pdf`);

            toast({ title: "Success", description: "Member report downloaded successfully." });

        } catch (e: any) {
            console.error("Report Generation Error:", e);
            toast({ title: "Error", description: e.message || "Failed to generate report", variant: "destructive" });
        }
        setGenerating(false);
    }

    async function generateEventReport() {
        setGenerating(true);
        try {
            console.log("Fetching events for report...");
            const { data: events, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });

            if (error) throw error;

            if (!events || events.length === 0) {
                toast({ title: "No Data", description: "No events found to report.", variant: "default" });
                setGenerating(false);
                return;
            }

            console.log(`Found ${events.length} events. Generating PDF...`);

            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.text("Savishkar India - Programs Activity Log", 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total Programs: ${events.length}`, 14, 30);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 35);

            const tableData = events.map(e => [
                e.title?.substring(0, 30) || "Untitled",
                e.event_date ? new Date(e.event_date).toLocaleDateString() : "-",
                e.event_type || "-",
                e.location || "-",
                e.is_published ? "Published" : "Draft"
            ]);

            autoTable(doc, {
                startY: 42,
                head: [['Title', 'Date', 'Type', 'Location', 'Status']],
                body: tableData,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [45, 212, 191] } // Teal theme
            });

            doc.save(`Savishkar_Programs_${new Date().toISOString().split('T')[0]}.pdf`);
            toast({ title: "Success", description: "Activity report downloaded successfully." });

        } catch (e: any) {
            console.error("Report Generation Error:", e);
            toast({ title: "Error", description: e.message || "Failed to generate report", variant: "destructive" });
        }
        setGenerating(false);
    }

    async function generateDetailedEventReport() {
        setGenerating(true);
        try {
            toast({ title: "Started", description: "Generating detailed report..." });

            let { data: events, error } = await supabase.from("events").select("*").order("event_date", { ascending: false });
            if (error) throw error;

            if (selectedPrant !== "All") {
                events = events?.filter(e =>
                    (e.location && e.location.includes(selectedPrant)) ||
                    (e.collab_states && e.collab_states.includes(selectedPrant))
                ) || [];
            }

            if (!events || events.length === 0) {
                toast({ title: "No Data", description: `No events found for ${selectedPrant}.`, variant: "default" });
                setGenerating(false);
                return;
            }

            // Helper to load image
            const loadImage = (url: string): Promise<string | null> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext("2d");
                        ctx?.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress slightly
                    };
                    img.onerror = () => resolve(null);
                    img.src = url;
                });
            };

            const doc = new jsPDF();
            let yPos = 20;
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);

            // Title Page
            const stateTitle = selectedPrant !== "All" ? selectedPrant : "National";
            doc.setFontSize(24);
            doc.setTextColor(255, 100, 0); // Orange
            doc.text(`Savishkar India - ${stateTitle}`, pageWidth / 2, yPos, { align: "center" });
            yPos += 15;
            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.text("Detailed Event Report", pageWidth / 2, yPos, { align: "center" });
            yPos += 10;
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: "center" });
            yPos += 20;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 20;

            // Iterate Events
            for (let i = 0; i < events.length; i++) {
                const event = events[i];

                // Check page break
                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = 20;
                }

                // 1. Heading: Program Name
                doc.setFontSize(16);
                doc.setTextColor(0, 102, 204); // Blue branding
                doc.setFont("helvetica", "bold");
                const titleLines = doc.splitTextToSize(`${i + 1}. ${event.title || "Untitled Program"}`, contentWidth);
                doc.text(titleLines, margin, yPos);
                yPos += (titleLines.length * 8) + 5;

                // Meta info
                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.setFont("helvetica", "normal");
                const dateStr = event.event_date ? new Date(event.event_date).toLocaleDateString() : "Date: N/A";
                const locationStr = event.location || "Location: N/A";
                doc.text(`${dateStr} | ${locationStr}`, margin, yPos);
                yPos += 10;

                // 2. Photo (if exists)
                if (event.image_urls && event.image_urls.length > 0) {
                    const base64Img = await loadImage(event.image_urls[0]);
                    if (base64Img) {
                        try {
                            const imgProps = doc.getImageProperties(base64Img);
                            const imgRatio = imgProps.height / imgProps.width;
                            const imgWidth = 120; // Fixed width
                            const imgHeight = imgWidth * imgRatio;

                            // Check space for image
                            if (yPos + imgHeight > pageHeight - 20) {
                                doc.addPage();
                                yPos = 20;
                            }

                            doc.addImage(base64Img, 'JPEG', margin, yPos, imgWidth, imgHeight);
                            yPos += imgHeight + 10;
                        } catch (err) {
                            console.error("Error adding image to PDF", err);
                        }
                    }
                }

                // AI Enhancement Simulation (Summary/Polish)
                // Since we don't have a live AI connection here, we simulate "AI Enhancement"
                // by adding a formatted "AI Analysis" section if description is short, or just nice formatting.

                // 3. Description
                let description = event.description || "No description provided.";

                // If description is very short, we might append an AI-style note (simulated for now)
                if (description.length < 50) {
                    description += "\n\n[AI Note]: This event record has minimal details. Recommended to update with outcomes and participant feedback.";
                }

                doc.setFontSize(11);
                doc.setTextColor(30);
                doc.setFont("helvetica", "normal");

                const splitDesc = doc.splitTextToSize(description, contentWidth);

                // Check space for description
                if (yPos + (splitDesc.length * 6) > pageHeight - 20) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.text(splitDesc, margin, yPos);
                yPos += (splitDesc.length * 6) + 15; // Space for next item

                // Separator
                doc.setDrawColor(200);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 15;
            }

            doc.save(`Savishkar_Detailed_Programs_${new Date().toISOString().split('T')[0]}.pdf`);
            toast({ title: "Success", description: "Detailed report generated successfully." });

        } catch (e: any) {
            console.error("Detailed Report Error:", e);
            toast({ title: "Error", description: e.message || "Failed", variant: "destructive" });
        }
        setGenerating(false);
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="font-display text-2xl font-bold">Reports Center</h1>
            <p className="text-muted-foreground">Generate PDF reports for administrative use.</p>

            <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-6 h-6 text-blue-500" /></div>
                        <h3 className="font-semibold text-lg">Membership Reports</h3>
                    </div>

                    <div className="space-y-2">
                        <Label>Filter by State (Prant)</Label>
                        <Select
                            value={selectedPrant}
                            onValueChange={setSelectedPrant}
                            disabled={role === "STATE_CONVENER" || role === "STATE_CO_CONVENER" || role === "STATE_INCHARGE" || role === "STATE_CO_INCHARGE"}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All India</SelectItem>
                                {PRANT_LIST.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Button onClick={() => generateMemberReport(false)} disabled={generating} className="w-full">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Download Member List
                        </Button>
                        <Button onClick={() => generateMemberReport(true)} disabled={generating} variant="outline" className="w-full">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Download with Photos
                        </Button>
                    </div>
                </GlassCard>

                <GlassCard className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg"><Activity className="w-6 h-6 text-green-500" /></div>
                        <h3 className="font-semibold text-lg">Activity Reports</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Download a summary of all events, programs, and workshops conducted. (PDF)
                    </p>
                    <div className="pt-4">
                        <Button variant="outline" onClick={generateEventReport} disabled={generating} className="w-full">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Download Activity Log
                        </Button>
                        <Button variant="secondary" onClick={generateDetailedEventReport} disabled={generating} className="w-full mt-2">
                            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                            Detailed Report (Photo-wise)
                        </Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
