import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award, BadgeCheck, User, Facebook, Instagram, Twitter, Linkedin,
  MapPin, Users, Building2, Crown, ChevronDown
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, isNationalRole, isStateRole, isDistrictRole } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Leader {
  id: string;
  full_name: string;
  role: string;
  prant: string | null;
  district: string | null;
  designation: string | null;
  photo_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

// Priority order within each level
const ROLE_RANK: Record<string, number> = {
  NATIONAL_CONVENER: 1,
  NATIONAL_CO_CONVENER: 2,
  STATE_CONVENER: 3,
  STATE_CO_CONVENER: 4,
  STATE_INCHARGE: 5,
  STATE_CO_INCHARGE: 6,
  DISTRICT_CONVENER: 7,
  DISTRICT_CO_CONVENER: 8,
  DISTRICT_INCHARGE: 9,
  DISTRICT_CO_INCHARGE: 10,
};

const NATIONAL_ROLES = new Set([
  "NATIONAL_CONVENER", "NATIONAL_CO_CONVENER",
  "INCHARGE", "CO_INCHARGE", // used as Advisor / Org Secretary at national level
]);
const STATE_ROLES = new Set([
  "STATE_CONVENER", "STATE_CO_CONVENER", "STATE_INCHARGE", "STATE_CO_INCHARGE",
]);
const DISTRICT_ROLES = new Set([
  "DISTRICT_CONVENER", "DISTRICT_CO_CONVENER", "DISTRICT_INCHARGE", "DISTRICT_CO_INCHARGE",
]);

function sortLeaders(arr: Leader[]): Leader[] {
  return [...arr].sort((a, b) => {
    if (a.display_order !== b.display_order) return a.display_order - b.display_order;
    const aR = ROLE_RANK[a.role] ?? 99;
    const bR = ROLE_RANK[b.role] ?? 99;
    return aR - bR;
  });
}

// ─── Leader Card ─────────────────────────────────────────────────────────────
function LeaderCard({ leader, index, size = "md" }: { leader: Leader; index: number; size?: "lg" | "md" | "sm" }) {
  const isBig = size === "lg";
  const isSm = size === "sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      className="h-full"
    >
      <GlassCard className={`text-center group hover:border-primary/50 transition-all h-full flex flex-col ${isBig ? "p-8" : isSm ? "p-4" : "p-6"}`}>
        {/* Avatar */}
        <div className={`mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary/60 transition-colors ${isBig ? "w-32 h-32" : isSm ? "w-16 h-16" : "w-24 h-24"}`}>
          {leader.photo_url ? (
            <img src={leader.photo_url} alt={leader.full_name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <User className={`text-muted-foreground ${isBig ? "w-16 h-16" : isSm ? "w-8 h-8" : "w-12 h-12"}`} />
          )}
        </div>

        {/* Name + Verified */}
        <div className={`flex items-center justify-center gap-2 mb-2 ${isBig ? "mb-3" : ""}`}>
          <h3 className={`font-display font-semibold ${isBig ? "text-2xl" : isSm ? "text-base" : "text-xl"}`}>
            {leader.full_name || "Unknown"}
          </h3>
          <BadgeCheck className={`text-primary shrink-0 ${isBig ? "w-6 h-6" : "w-5 h-5"}`} />
        </div>

        {/* Role Badge */}
        <div className="mb-2">
          <Badge variant={isNationalRole(leader.role) ? "default" : leader.role.includes("CONVENER") ? "secondary" : "outline"}>
            {ROLE_LABELS[leader.role] || leader.role}
          </Badge>
        </div>

        {/* Location */}
        {!isNationalRole(leader.role) && (leader.prant || leader.district) && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{leader.district ? `${leader.district}${leader.prant ? `, ${leader.prant}` : ""}` : leader.prant}</span>
          </div>
        )}

        {/* Designation */}
        {leader.designation && (
          <p className={`text-muted-foreground mt-1 flex-1 ${isSm ? "text-xs" : "text-sm"}`}>{leader.designation}</p>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {leader.facebook_url && (
            <a href={leader.facebook_url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Facebook className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {leader.instagram_url && (
            <a href={leader.instagram_url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Instagram className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {leader.twitter_url && (
            <a href={leader.twitter_url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Twitter className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {leader.linkedin_url && (
            <a href={leader.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center hover:bg-primary/20 transition-colors">
              <Linkedin className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            </a>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-border/50 ml-2" />
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2].map(s => (
        <div key={s}>
          <div className="h-8 bg-muted/40 rounded w-48 mb-6 animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-panel p-6 animate-pulse rounded-xl">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/50" />
                <div className="h-6 bg-muted/50 rounded mx-auto w-32 mb-2" />
                <div className="h-4 bg-muted/50 rounded mx-auto w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Leadership() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("national");
  const [selectedPrant, setSelectedPrant] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaders() {
      try {
        // ── Method 1: Try public RPC (best path — no RLS issues) ──────────
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_public_leaders" as any);

        if (!cancelled && !rpcError && rpcData && (rpcData as any[]).length > 0) {
          const mapped: Leader[] = (rpcData as any[]).map((p: any) => ({
            id: p.id,
            full_name: p.full_name || "Unknown",
            role: p.role || "MEMBER",
            prant: p.state || p.prant || null,
            district: p.district || null,
            designation: p.designation || null,
            photo_url: p.avatar_url || null,
            instagram_url: p.instagram_url || null,
            facebook_url: p.facebook_url || null,
            twitter_url: p.twitter_url || null,
            linkedin_url: p.linkedin_url || null,
            display_order: p.display_order ?? 999,
          }));
          setLeaders(sortLeaders(mapped));
          return;
        }

        // ── Method 2: Fallback — query profiles WHERE is_leadership = true ─
        // This is the SAME data source as LeadershipManager admin page
        // Cast to any to bypass Supabase's over-deep type inference on custom columns
        const profilesQuery = (supabase as any)
          .from("profiles")
          .select("id, user_id, full_name, avatar_url, state, district, designation, instagram_url, facebook_url, twitter_url, linkedin_url, display_order")
          .eq("is_leadership", true);
        const { data: profiles, error: profileErr } = await profilesQuery;

        if (cancelled) return;
        if (profileErr || !profiles || profiles.length === 0) {
          setLeaders([]);
          return;
        }

        // Fetch roles in parallel
        const userIds = profiles.map((p: any) => p.user_id);
        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        if (cancelled) return;

        const roleMap = new Map((rolesData || []).map(r => [r.user_id, r.role]));

        const mapped: Leader[] = profiles.map((p: any) => ({
          id: p.id,
          full_name: p.full_name || "Unknown",
          role: roleMap.get(p.user_id) || "MEMBER",
          prant: p.state || null,
          district: p.district || null,
          designation: p.designation || null,
          photo_url: p.avatar_url || null,
          instagram_url: p.instagram_url || null,
          facebook_url: p.facebook_url || null,
          twitter_url: p.twitter_url || null,
          linkedin_url: p.linkedin_url || null,
          display_order: (p as any).display_order ?? 999,
        }));

        setLeaders(sortLeaders(mapped));
      } catch (err) {
        console.error("Leadership fetch error:", err);
        setLeaders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLeaders();
    return () => { cancelled = true; };
  }, []);

  // ── Filtered memos ──────────────────────────────────────────────────────────
  const nationalLeaders = useMemo(() =>
    leaders.filter(l => NATIONAL_ROLES.has(l.role)), [leaders]);

  const nationalConveners = useMemo(() =>
    nationalLeaders.filter(l => l.role === "NATIONAL_CONVENER" || l.role === "NATIONAL_CO_CONVENER"),
    [nationalLeaders]);

  const nationalAdvisors = useMemo(() =>
    nationalLeaders.filter(l => l.role === "INCHARGE" || l.role === "CO_INCHARGE"),
    [nationalLeaders]);

  const availablePrants = useMemo(() => {
    const prants = new Set(leaders.filter(l => STATE_ROLES.has(l.role) || DISTRICT_ROLES.has(l.role)).map(l => l.prant).filter(Boolean) as string[]);
    return Array.from(prants).sort();
  }, [leaders]);

  const stateLeaders = useMemo(() =>
    leaders.filter(l => STATE_ROLES.has(l.role) && (selectedPrant === "all" || l.prant === selectedPrant)),
    [leaders, selectedPrant]);

  const districtLeaders = useMemo(() =>
    leaders.filter(l => DISTRICT_ROLES.has(l.role) && (selectedPrant === "all" || l.prant === selectedPrant)),
    [leaders, selectedPrant]);

  const hasDistrictLeaders = useMemo(() =>
    leaders.some(l => DISTRICT_ROLES.has(l.role)), [leaders]);

  // Group state leaders by prant
  const stateLeadersByPrant = useMemo(() => {
    const map = new Map<string, Leader[]>();
    for (const l of stateLeaders) {
      const key = l.prant || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [stateLeaders]);

  // Group district leaders by district/prant
  const districtLeadersByDistrict = useMemo(() => {
    const map = new Map<string, Leader[]>();
    for (const l of districtLeaders) {
      const key = l.district || l.prant || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    return map;
  }, [districtLeaders]);

  // ── Prant filter dropdown ────────────────────────────────────────────────────
  const PrantFilter = () => availablePrants.length > 0 ? (
    <div className="flex justify-center mb-8">
      <div className="w-full max-w-xs">
        <Select value={selectedPrant} onValueChange={setSelectedPrant}>
          <SelectTrigger className="bg-background/50 backdrop-blur-sm border-white/10">
            <SelectValue placeholder="Filter by Prant / State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prants / States</SelectItem>
            {availablePrants.map(p => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  ) : null;

  // ── National Tab ─────────────────────────────────────────────────────────────
  const NationalTab = () => (
    <div className="space-y-10">
      {/* Convener / Co-Convener — large prominent cards */}
      {nationalConveners.length > 0 && (
        <div>
          <SectionHeader icon={Crown} title="National Team" subtitle="Convener & Co-Convener" />
          <div className={`grid gap-6 ${nationalConveners.length === 1 ? "max-w-sm mx-auto" : nationalConveners.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 md:grid-cols-3"}`}>
            {nationalConveners.map((l, i) => <LeaderCard key={l.id} leader={l} index={i} size="lg" />)}
          </div>
        </div>
      )}

      {/* Advisors */}
      {nationalAdvisors.length > 0 && (
        <div>
          <SectionHeader icon={Award} title="Advisors & Secretaries" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nationalAdvisors.map((l, i) => <LeaderCard key={l.id} leader={l} index={i} size="md" />)}
          </div>
        </div>
      )}

      {nationalLeaders.length === 0 && (
        <GlassCard className="text-center py-12">
          <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">National leadership details coming soon.</p>
        </GlassCard>
      )}
    </div>
  );

  // ── State Tab ─────────────────────────────────────────────────────────────────
  const StateTab = () => (
    <div className="space-y-10">
      <PrantFilter />
      {stateLeadersByPrant.size === 0 ? (
        <GlassCard className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No state leaders found{selectedPrant !== "all" ? ` for ${selectedPrant}` : ""}.</p>
        </GlassCard>
      ) : (
        Array.from(stateLeadersByPrant.entries()).map(([prant, members]) => (
          <div key={prant}>
            <SectionHeader icon={Building2} title={prant} />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((l, i) => <LeaderCard key={l.id} leader={l} index={i} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── District Tab ──────────────────────────────────────────────────────────────
  const DistrictTab = () => (
    <div className="space-y-10">
      <PrantFilter />
      {districtLeadersByDistrict.size === 0 ? (
        <GlassCard className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No district leaders found{selectedPrant !== "all" ? ` for ${selectedPrant}` : ""}.</p>
        </GlassCard>
      ) : (
        Array.from(districtLeadersByDistrict.entries()).map(([district, members]) => (
          <div key={district}>
            <SectionHeader icon={MapPin} title={district} />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((l, i) => <LeaderCard key={l.id} leader={l} index={i} size="sm" />)}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Our <span className="text-primary">Leadership</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Meet the visionaries driving SAVISHKAR's mission across India
          </p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : leaders.length === 0 ? (
          <GlassCard className="text-center py-16">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-display text-xl font-semibold mb-2">Leadership Directory Coming Soon</h3>
            <p className="text-muted-foreground">Our leadership team details will be updated shortly.</p>
          </GlassCard>
        ) : (
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSelectedPrant("all"); }} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className={`grid gap-2 h-auto p-2 bg-muted/30 ${hasDistrictLeaders ? "grid-cols-3" : "grid-cols-2"}`}>
                <TabsTrigger value="national" className="gap-2">
                  <Crown className="w-4 h-4" /><span>National</span>
                </TabsTrigger>
                <TabsTrigger value="state" className="gap-2">
                  <Building2 className="w-4 h-4" /><span>State (Prant)</span>
                </TabsTrigger>
                {/* District tab ONLY shown if Super Controller has assigned district leaders */}
                {hasDistrictLeaders && (
                  <TabsTrigger value="district" className="gap-2">
                    <MapPin className="w-4 h-4" /><span>District</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="national" className="mt-0"><NationalTab /></TabsContent>
            <TabsContent value="state" className="mt-0"><StateTab /></TabsContent>
            {hasDistrictLeaders && (
              <TabsContent value="district" className="mt-0"><DistrictTab /></TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </Layout>
  );
}