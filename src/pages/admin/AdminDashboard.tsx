import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, UserCheck, Clock, TrendingUp, Activity,
  FileCheck, Calendar, MapPin, ArrowUpRight, School
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalMembers: number;
  pendingApprovals: number;
  activePrograms: number;
  roleStats: Record<string, number>;
  stateStats: Record<string, number>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: any;
    created_at: string;
  }>;
  activeDistricts?: number; // For state admins
}

export default function AdminDashboard() {
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    pendingApprovals: 0,
    activePrograms: 0,
    roleStats: {},
    stateStats: {},
    recentActivity: [],
    activeDistricts: 0
  });
  const [loading, setLoading] = useState(true);

  const isStateAdmin = role === "STATE_CONVENER" || role === "STATE_CO_CONVENER";
  const userState = profile?.state;

  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log("Fetching Admin Stats...");
        // Queries
        const membersQuery = supabase.from("profiles" as any).select("*", { count: "exact", head: true });
        const pendingQuery = supabase.from("applications" as any).select("*", { count: "exact", head: true }).eq("status", "pending");
        const eventsQuery = supabase.from("events" as any).select("*", { count: "exact", head: true }).eq("is_published", true);

        let activityQuery = supabase
          .from("audit_logs" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        // Execute all queries safely
        const results = await Promise.allSettled([
          membersQuery,
          pendingQuery,
          eventsQuery,
          supabase.from("user_roles" as any).select("role"),
          supabase.from("profiles" as any).select("state, district"),
          activityQuery
        ]);

        // Helper to extract data safely
        const getRes = (result: PromiseSettledResult<any>, label: string) => {
          if (result.status === "rejected") {
            console.error(`Query Failed (${label}):`, result.reason);
            return { count: 0, data: [], error: result.reason };
          }
          if (result.value.error) {
            console.error(`Query RLS Error (${label}):`, result.value.error);
            return { count: 0, data: [], error: result.value.error };
          }
          return result.value;
        };

        const membersRes = getRes(results[0], "Members");
        const pendingRes = getRes(results[1], "Pending");
        const eventsRes = getRes(results[2], "Events");
        const rolesRes = getRes(results[3], "Roles");
        const profilesRes = getRes(results[4], "Profiles");
        const activityRes = getRes(results[5], "Activity");

        // Check if we hit a permission wall (using Members query as canary)
        if (membersRes.error || rolesRes.error) {
          setPermissionError(true);
        } else {
          setPermissionError(false); // Clear if successful
        }

        // Process Stats
        const roleStats: Record<string, number> = {};
        const rolesData = rolesRes.data || [];
        if (!isStateAdmin) {
          rolesData.forEach((r: any) => {
            if (r.role) roleStats[r.role] = (roleStats[r.role] || 0) + 1;
          });
        }

        const stateStats: Record<string, number> = {};
        const profilesData = profilesRes.data || [];

        const stateProfiles = (isStateAdmin && userState)
          ? profilesData.filter((p: any) => p.state === userState)
          : profilesData;

        // Count Districts if State Admin, or States if National
        let activeDistrictsCount = 0;
        const distSet = new Set<string>();

        stateProfiles.forEach((p: any) => {
          if (p.state) {
            stateStats[p.state] = (stateStats[p.state] || 0) + 1;
          }
          if (isStateAdmin && p.district) {
            distSet.add(p.district);
          }
        });
        activeDistrictsCount = distSet.size;

        setStats({
          totalMembers: membersRes.count || 0,
          pendingApprovals: pendingRes.count || 0,
          activePrograms: eventsRes.count || 0,
          roleStats,
          stateStats,
          recentActivity: activityRes.data || [],
          activeDistricts: activeDistrictsCount
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      }
      setLoading(false);
    }

    if (profile) {
      fetchStats();
    }
  }, [profile, role, isStateAdmin, userState]);

  const statCards = [
    {
      label: isStateAdmin ? `${userState} Members` : "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-400/10",
      link: "/admin/approvals"
    },
    {
      label: "Active Programs",
      value: stats.activePrograms,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
      link: "/admin/programs"
    },
    {
      label: isStateAdmin ? "Active Districts" : "Active States",
      value: isStateAdmin ? stats.activeDistricts : Object.keys(stats.stateStats).length,
      icon: isStateAdmin ? School : MapPin,
      color: "text-savishkar-cyan",
      bgColor: "bg-savishkar-cyan/10"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {isStateAdmin ? `${userState} Command Center` : "National Command Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {isStateAdmin ? `Managing operations for ${userState}` : "Overview of SAVISHKAR ecosystem"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot status-online" />
          <span className="text-sm text-muted-foreground">System Online</span>
        </div>
      </div>

      {/* Permission Error Alert - Showing FIX logic */}
      {permissionError && (
        <GlassCard className="border-l-4 border-l-red-500 bg-red-500/5">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-red-500/10 text-red-500">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold text-red-500">Database Permissions Mismatch</h3>
              <p className="text-sm text-foreground/80">
                You are viewing this dashboard via the <strong>Emergency Backend Override</strong> (React Context), but your actual
                database role does not grant access to other users' data. Row Level Security involves the database, not just the frontend.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-black/40 border border-white/10 overflow-hidden relative group">
                <p className="text-xs text-muted-foreground mb-2">Run this SQL in your Supabase SQL Editor to fix your role permanently:</p>
                <code className="text-xs font-mono text-green-400 block whitespace-pre-wrap select-all">
                  {`DO $$
DECLARE
  target_email TEXT := '${profile?.email}'; 
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  IF target_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'SUPER_CONTROLLER');
    UPDATE public.profiles SET designation = 'SUPER CONTROLLER' WHERE user_id = target_user_id;
  END IF;
END $$;`}
                </code>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-3xl font-display font-bold ${stat.color}`}>
                      {loading ? "—" : stat.value}
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
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Role Distribution (Hide for State Admin if not relevant, or show Global?) 
            Let's hide for State Admin to declutter.
        */}
        {!isStateAdmin && (
          <GlassCard className="lg:col-span-1">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Role Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(ROLE_LABELS).map(([key, label]) => {
                const count = stats.roleStats[key] || 0;
                const percentage = stats.totalMembers > 0 ? (count / stats.totalMembers) * 100 : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Recent Activity */}
        <GlassCard className={isStateAdmin ? "lg:col-span-3" : "lg:col-span-2"}>
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-auto">
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                No recent activity
              </p>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("en-IN")}
                    </p>
                    {/* Optional: Show who did it if available */}
                    {/* {log.details?.email && <p className="text-xs text-muted-foreground">by {log.details.email}</p>} */}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <GlassCard>
        <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-savishkar-cyan" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/approvals">
            <Button variant="outline" className="gap-2">
              <FileCheck className="w-4 h-4" />
              Review Applications ({stats.pendingApprovals})
            </Button>
          </Link>
          <Link to="/admin/programs">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Add Program
            </Button>
          </Link>
          <Link to="/admin/members">
            <Button variant="outline" className="gap-2">
              <Users className="w-4 h-4" />
              View All Members
            </Button>
          </Link>
          {/* Only National Admin see AI Panel */}
          {!isStateAdmin && (
            <Link to="/admin/ai-panel">
              <Button variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                Run Diagnostics
              </Button>
            </Link>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
