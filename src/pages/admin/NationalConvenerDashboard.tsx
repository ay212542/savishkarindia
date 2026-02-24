import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, MapPin, FileCheck, Megaphone, TrendingUp, Crown, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { VerificationWidget } from "@/components/ui/VerificationWidget";

interface Stats {
    totalMembers: number;
    pendingApprovals: number;
    totalStates: number;
    recentAnnouncements: { title: string; created_at: string }[];
    membersByState: { state: string; count: number }[];
}

export default function NationalConvenerDashboard() {
    const { role, profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalMembers: 0,
        pendingApprovals: 0,
        totalStates: 0,
        recentAnnouncements: [],
        membersByState: [],
    });
    const [loading, setLoading] = useState(true);

    // Access guard
    useEffect(() => {
        if (role && role !== "NATIONAL_CONVENER") {
            navigate("/dashboard");
        }
    }, [role, navigate]);

    useEffect(() => {
        if (role !== "NATIONAL_CONVENER") return;
        fetchStats();
    }, [role]);

    async function fetchStats() {
        setLoading(true);
        try {
            const [membersRes, approvalsRes, announcementsRes] = await Promise.all([
                // Total active members
                (supabase as any).from("profiles").select("id, state", { count: "exact" }),
                // Pending approvals
                (supabase as any).from("applications").select("id", { count: "exact" }).eq("status", "pending"),
                // Recent announcements (latest 5)
                (supabase as any).from("announcements").select("title, created_at").order("created_at", { ascending: false }).limit(5),
            ]);

            const members: any[] = membersRes.data || [];
            const pendingCount = approvalsRes.count || 0;
            const announcements = announcementsRes.data || [];

            // Count members by state
            const stateMap = new Map<string, number>();
            for (const m of members) {
                if (m.state) {
                    stateMap.set(m.state, (stateMap.get(m.state) || 0) + 1);
                }
            }
            const membersByState = Array.from(stateMap.entries())
                .map(([state, count]) => ({ state, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setStats({
                totalMembers: members.length,
                pendingApprovals: pendingCount,
                totalStates: stateMap.size,
                recentAnnouncements: announcements,
                membersByState,
            });
        } catch (e) {
            console.error("NationalConvenerDashboard fetch error:", e);
        } finally {
            setLoading(false);
        }
    }

    const StatCard = ({ icon: Icon, label, value, color = "text-primary" }: { icon: React.ElementType; label: string; value: number | string; color?: string }) => (
        <GlassCard className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <p className="text-2xl font-bold font-display">{loading ? "–" : value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
            </div>
        </GlassCard>
    );

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-1">
                    <Crown className="w-7 h-7 text-primary" />
                    <h1 className="font-display text-2xl font-bold">National Convener Dashboard</h1>
                </div>
                <p className="text-muted-foreground ml-10">Welcome, {profile?.full_name} — Read-only organisational overview</p>
                <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-amber-500">
                    <Info className="w-3.5 h-3.5" />
                    <span>This is a view-only dashboard. Contact Super Controller for edits.</span>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Total Members" value={stats.totalMembers} />
                <StatCard icon={MapPin} label="Active States / Prants" value={stats.totalStates} />
                <StatCard icon={FileCheck} label="Pending Approvals" value={stats.pendingApprovals} color="text-amber-400" />
            </div>

            {/* Identity Verification Module */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <VerificationWidget />
                </div>
                <div className="lg:col-span-2">
                    <GlassCard className="h-full flex flex-col justify-center border-amber-500/20 bg-amber-500/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Info className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-amber-500">Security Notice</h3>
                                <p className="text-sm text-muted-foreground">National Conveners have cross-state verification access. Every search is logged for audit purposes.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Members by State */}
                <GlassCard>
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h2 className="font-display text-lg font-semibold">Top States by Membership</h2>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-muted/40 rounded animate-pulse" />)}
                        </div>
                    ) : stats.membersByState.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No state data available.</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.membersByState.map((row, i) => (
                                <div key={row.state} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <span className="w-5 text-xs text-muted-foreground font-mono">#{i + 1}</span>
                                        <span className="text-sm font-medium">{row.state}</span>
                                    </div>
                                    <Badge variant="secondary">{row.count}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>

                {/* Recent Announcements */}
                <GlassCard>
                    <div className="flex items-center gap-2 mb-4">
                        <Megaphone className="w-5 h-5 text-accent" />
                        <h2 className="font-display text-lg font-semibold">Recent Announcements</h2>
                    </div>
                    {loading ? (
                        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/40 rounded animate-pulse" />)}</div>
                    ) : stats.recentAnnouncements.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No announcements yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.recentAnnouncements.map((a, i) => (
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
        </div>
    );
}
