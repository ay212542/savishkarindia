import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, MapPin, FileCheck, Megaphone, Star, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function NationalCoConvenerDashboard() {
    const { role, profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        totalMembers: 0,
        pendingApprovals: 0,
        recentAnnouncements: [] as { title: string; created_at: string }[],
    });

    useEffect(() => {
        if (role && role !== "NATIONAL_CO_CONVENER") {
            navigate("/dashboard");
        }
    }, [role, navigate]);

    useEffect(() => {
        if (role !== "NATIONAL_CO_CONVENER") return;
        fetchData();
    }, [role]);

    async function fetchData() {
        setLoading(true);
        try {
            const [membersRes, approvalsRes, annRes] = await Promise.all([
                (supabase as any).from("profiles").select("id", { count: "exact" }),
                (supabase as any).from("applications").select("id", { count: "exact" }).eq("status", "pending"),
                (supabase as any).from("announcements").select("title, created_at").order("created_at", { ascending: false }).limit(5),
            ]);
            setData({
                totalMembers: membersRes.data?.length || 0,
                pendingApprovals: approvalsRes.count || 0,
                recentAnnouncements: annRes.data || [],
            });
        } catch (e) {
            console.error("NationalCoConvenerDashboard:", e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 space-y-8">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-1">
                    <Star className="w-7 h-7 text-primary" />
                    <h1 className="font-display text-2xl font-bold">National Co-Convener Dashboard</h1>
                </div>
                <p className="text-muted-foreground ml-10">Welcome, {profile?.full_name}</p>
                <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-amber-500">
                    <Info className="w-3.5 h-3.5" />
                    <span>View-only dashboard. Contact National Convener or Super Controller for changes.</span>
                </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { icon: Users, label: "Total Members", value: data.totalMembers },
                    { icon: FileCheck, label: "Pending Approvals", value: data.pendingApprovals },
                    { icon: MapPin, label: "Role", value: "National Co-Convener" },
                ].map(({ icon: Icon, label, value }) => (
                    <GlassCard key={label} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-display">{loading ? "–" : value}</p>
                            <p className="text-sm text-muted-foreground">{label}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Announcements */}
            <GlassCard>
                <div className="flex items-center gap-2 mb-4">
                    <Megaphone className="w-5 h-5 text-accent" />
                    <h2 className="font-display text-lg font-semibold">Recent Announcements</h2>
                </div>
                {loading ? (
                    <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />)}</div>
                ) : data.recentAnnouncements.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No announcements yet.</p>
                ) : (
                    <div className="space-y-2">
                        {data.recentAnnouncements.map((a, i) => (
                            <div key={i} className="p-3 rounded-lg bg-muted/30">
                                <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
