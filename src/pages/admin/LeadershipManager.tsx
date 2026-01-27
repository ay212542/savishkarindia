import { useEffect, useState } from "react";
import { Edit, User, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ROLE_LABELS } from "@/lib/constants";

interface LeaderProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: string | null; // We will fetch this map
  designation: string | null;
  avatar_url: string | null;
  state: string | null;
  district: string | null;
}

export default function LeadershipManager() {
  const [leaders, setLeaders] = useState<LeaderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaders();
  }, [user]);

  async function fetchLeaders() {
    setLoading(true);
    // Fetch profiles where is_leadership is true
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_leadership", true)
      .order("full_name", { ascending: true });

    if (profiles) {
      // Fetch roles for these users for display
      const userIds = profiles.map(p => p.user_id);
      let roleMap = new Map();

      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        if (roles) {
          roleMap = new Map(roles.map(r => [r.user_id, r.role]));
        }
      }

      const mappedLeaders = profiles.map(p => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        role: roleMap.get(p.user_id) || "Member",
        designation: p.designation,
        avatar_url: p.avatar_url,
        state: p.state,
        district: p.district
      }));

      setLeaders(mappedLeaders);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Leadership Directory</h1>
          <p className="text-muted-foreground">
            Members marked as "Leadership Member" appear here.
          </p>
        </div>
        <Button onClick={() => navigate("/admin/members")} variant="outline" className="gap-2">
          Go to Registry <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <GlassCard className="bg-blue-500/10 border-blue-500/20 p-4">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>How to add leaders:</strong> Go to <strong>Member Registry</strong>, edit a member's profile, and toggle the <strong>"Leadership Member"</strong> switch. They will automatically appear here and on the public website.
        </p>
      </GlassCard>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : leaders.length === 0 ? (
        <GlassCard className="text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display text-xl font-semibold mb-2">No Leaders Found</h3>
          <p className="text-muted-foreground mb-4">Mark members as leadership in their profile settings.</p>
          <Button onClick={() => navigate("/admin/members")}>Go to Members</Button>
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map((leader) => (
            <GlassCard key={leader.id} className="relative">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                  {leader.avatar_url ? (
                    <img src={leader.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{leader.full_name}</h3>
                  <Badge variant="secondary" className="text-xs mb-1">
                    {ROLE_LABELS[leader.role as any] || leader.role}
                  </Badge>
                  {leader.designation && (
                    <p className="text-xs text-muted-foreground">{leader.designation}</p>
                  )}
                  {leader.state && (
                    <p className="text-xs text-muted-foreground mt-1">{leader.state} {leader.district ? `• ${leader.district}` : ''}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/admin/profile/${leader.user_id}`)}>
                  <Edit className="w-4 h-4 mr-2" /> Manage Profile
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}