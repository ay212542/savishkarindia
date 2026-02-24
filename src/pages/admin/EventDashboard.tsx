import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Loader2, Users, Calendar, ArrowUpRight, Activity, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { VerificationWidget } from "@/components/ui/VerificationWidget";

export default function EventDashboard() {
    const { user, profile, role } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDelegates: 0,
        recentActivity: [] as any[]
    });

    // Guard: Only SUPER_CONTROLLER, ADMIN, and EVENT_MANAGER
    useEffect(() => {
        if (role && !["SUPER_CONTROLLER", "ADMIN", "EVENT_MANAGER"].includes(role)) {
            navigate("/admin");
        }
    }, [role, navigate]);

    useEffect(() => {
        async function fetchDashboardStats() {
            if (!user) return;
            setLoading(true);

            try {
                let delegatesQuery = supabase
                    .from("event_delegates" as any)
                    .select("*", { count: "exact", head: true });

                let recentQuery = supabase
                    .from("event_delegates" as any)
                    .select("id, name, created_at, event_name")
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (role === "EVENT_MANAGER" && profile?.user_id) {
                    delegatesQuery = delegatesQuery.eq("manager_id", profile.user_id);
                    recentQuery = recentQuery.eq("manager_id", profile.user_id);
                }

                const [delegatesRes, recentRes] = await Promise.all([
                    delegatesQuery,
                    recentQuery
                ]);

                const delegatesCount = delegatesRes.count;
                const recentDelegates = recentRes.data as any[] | null;

                setStats({
                    totalDelegates: delegatesCount || 0,
                    recentActivity: recentDelegates || []
                });

            } catch (error) {
                console.error("Error fetching event dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardStats();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isGlobalAdmin = role === "SUPER_CONTROLLER" || role === "ADMIN";

    const statCards = [
        {
            label: "Total Delegates Registered",
            value: stats.totalDelegates,
            icon: Users,
            color: "text-primary",
            bgColor: "bg-primary/10",
            link: "/admin/events"
        },
        {
            label: "Assigned To Event",
            value: profile?.designation?.replace("Event Manager – ", "").replace("Event Manager - ", "") || "Assigned Event",
            icon: MapPin,
            color: "text-savishkar-cyan",
            bgColor: "bg-savishkar-cyan/10"
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold">Event Command Center</h1>
                    <p className="text-muted-foreground">{profile?.designation || "Event Manager Dashboard"}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    const content = (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <GlassCard className="relative overflow-hidden">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                        <p className={`text-3xl font-display font-bold ${stat.color}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                        <Icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                </div>
                                {stat.link && (
                                    <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-muted-foreground" />
                                )}
                            </GlassCard>
                        </motion.div>
                    );
                    return stat.link ? (
                        <Link key={stat.label} to={stat.link}>{content}</Link>
                    ) : (
                        content
                    );
                })}
            </div>

            {/* Event Identity Verification */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <VerificationWidget />
                </div>
                <div className="lg:col-span-2">
                    <GlassCard className="h-full flex flex-col justify-center border-purple-500/20 bg-purple-500/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <Activity className="w-8 h-8 text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-purple-500">Event Security</h3>
                                <p className="text-sm text-muted-foreground">Use this module to verify delegates on-site. Scanning QR codes from printed IDs will instantly link to the registration profile.</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <GlassCard className="lg:col-span-2">
                    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent" />
                        Recent Delegate Registrations
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-auto">
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-8">
                                No delegates registered yet
                            </p>
                        ) : (
                            stats.recentActivity.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{log.name} registered for <span className="text-primary">{log.event_name}</span></p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>

                {/* Quick Actions */}
                <GlassCard className="lg:col-span-1">
                    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                        <ArrowUpRight className="w-5 h-5 text-savishkar-cyan" />
                        Quick Actions
                    </h3>
                    <div className="flex flex-col gap-3">
                        <Link to="/admin/events">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <Users className="w-4 h-4" />
                                Manage Event Delegates
                            </Button>
                        </Link>

                        {isGlobalAdmin && (
                            <Link to="/admin/assign-event-manager">
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <Search className="w-4 h-4" />
                                    Assign Event Managers
                                </Button>
                            </Link>
                        )}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
