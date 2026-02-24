import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: "low" | "normal" | "high";
    target_audience: "ALL" | "DESIGNATORY";
    created_at: string;
    author_name?: string | null;
    author_role?: string | null;
}

import { ROLE_LABELS } from "@/lib/constants";

export function AnnouncementsList({ role }: { role: string | null }) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnnouncements() {
            try {
                const { data, error } = await supabase
                    .from("announcements")
                    .select("*")
                    .eq("is_active", true)
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (error) throw error;

                // Client-side filtering for target audience
                const filtered = (data || []).filter((a: any) => {
                    if (a.target_audience === "ALL" || !a.target_audience) return true;
                    if (a.target_audience === "DESIGNATORY") {
                        // Show if user has any role other than basic member (or null)
                        // Assuming 'role' is passed from AuthContext: 'admin', 'state_admin', etc.
                        return role && role !== "member";
                    }
                    return true;
                });

                setAnnouncements(filtered as unknown as Announcement[]);
            } catch (e) {
                console.error("Error fetching announcements:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchAnnouncements();
    }, [role]);

    if (loading) return <div className="text-sm text-muted-foreground">Loading updates...</div>;

    if (announcements.length === 0) {
        return <p className="text-muted-foreground text-sm">No new announcements at this time.</p>;
    }

    return (
        <div className="space-y-3">
            {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-primary/5 rounded-lg border border-primary/10 hover:border-primary/30 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{a.title}</h4>
                        {a.priority === 'high' && <Badge variant="destructive" className="text-[10px] h-5">Urgent</Badge>}
                        {a.target_audience === 'DESIGNATORY' && <Badge variant="secondary" className="text-[10px] h-5 bg-purple-500/10 text-purple-500">Admin Only</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{a.content}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                        <span>Issued by: {a.author_name || "Admin"} {a.author_role ? `(${ROLE_LABELS[a.author_role] || a.author_role})` : ""}</span>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
