import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, MapPin, FileCheck, Crown, Info, Map as MapIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { REGIONS } from "@/lib/constants";
import { VerificationWidget } from "@/components/ui/VerificationWidget";

interface Stats {
    totalMembers: number;
    pendingApprovals: number;
    totalStates: number;
    membersByState: { state: string; count: number }[];
}

export default function RegionalConvenerDashboard() {
    const { role, profile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats>({
        totalMembers: 0,
        pendingApprovals: 0,
        totalStates: 0,
        membersByState: [],
    });
    const [loading, setLoading] = useState(true);

    const isRegional = ["REGIONAL_CONVENER", "REGIONAL_CO_CONVENER"].includes(role || "");
    const userRegion = profile?.state || ""; // We stored region in the state field

    useEffect(() => {
        if (!isRegional) {
            navigate("/dashboard");
        }
    }, [isRegional, navigate]);

    useEffect(() => {
        if (!isRegional || !userRegion) return;
        fetchStats();
    }, [isRegional, userRegion]);

    async function fetchStats() {
        setLoading(true);
        try {
            // REGIONS is a map like { "North Zone": ["Delhi", "Punjab", ...] }
            const assignedPrants = REGIONS[userRegion] || [];

            if (assignedPrants.length === 0) {
                setLoading(false);
                return;
            }

            const [membersRes, approvalsRes] = await Promise.all([
                // Total active members in assigned states
                (supabase as any).from("profiles").select("id, state", { count: "exact" }).in("state", assignedPrants),
                // Pending approvals in assigned states
                (supabase as any).from("applications").select("id", { count: "exact" }).in("state", assignedPrants).eq("status", "pending"),
            ]);

            const members: any[] = membersRes.data || [];
            const pendingCount = approvalsRes.count || 0;

            // Count members by state
            const stateMap = new Map<string, number>();
            for (const m of members) {
                if (m.state) {
                    stateMap.set(m.state, (stateMap.get(m.state) || 0) + 1);
                }
            }
            const membersByState = Array.from(stateMap.entries())
                .map(([state, count]) => ({ state, count }))
                .sort((a, b) => b.count - a.count);

            setStats({
                totalMembers: members.length,
                pendingApprovals: pendingCount,
                totalStates: assignedPrants.length, // Total states they are managing
                membersByState,
            });
        } catch (e) {
            console.error("RegionalConvenerDashboard fetch error:", e);
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
                    <MapIcon className="w-7 h-7 text-primary" />
                    <h1 className="font-display text-2xl font-bold text-white">Regional Convener Dashboard</h1>
                </div>
                <p className="text-muted-foreground ml-10">Welcome, {profile?.full_name} — Managing: <strong className="text-white">{userRegion}</strong></p>
                <div className="ml-10 mt-2 flex items-center gap-2 text-xs text-amber-500">
                    <Info className="w-3.5 h-3.5" />
                    <span>This dashboard only shows data for states within your assigned region.</span>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Members in Region" value={stats.totalMembers} />
                <StatCard icon={MapPin} label="States under Jurisdiction" value={stats.totalStates} />
                <StatCard icon={FileCheck} label="Pending Region Approvals" value={stats.pendingApprovals} color="text-amber-400" />
            </div>

            {/* Regional Identity Verification */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <VerificationWidget />
                </div>
                <div className="lg:col-span-2">
                    <GlassCard className="h-full flex flex-col justify-center border-blue-500/20 bg-blue-500/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <MapIcon className="w-8 h-8 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-blue-500">Regional Governance</h3>
                                <p className="text-sm text-muted-foreground">Verification lookups are limited to profiles and applications within the states of your assigned region.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Members by State */}
                <GlassCard className="lg:col-span-2 max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-primary" />
                        <h2 className="font-display text-lg font-semibold text-white">State-wise Breakdown</h2>
                    </div>
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />)}
                        </div>
                    ) : stats.membersByState.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No member data available in your region.</p>
                    ) : (
                        <div className="space-y-2">
                            {stats.membersByState.map((row, i) => (
                                <div key={row.state} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold font-mono">{i + 1}</span>
                                        <span className="text-sm font-medium text-white">{row.state}</span>
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20">
                                        {row.count} Members
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
